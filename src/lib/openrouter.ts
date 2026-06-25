// Integração com OpenRouter — VISAcheck GO
// A chave fica APENAS no Vercel (VITE_OPENROUTER_API_KEY), nunca no código

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ─────────────────────────────────────────────────────────────────────────
// LISTA DE FALLBACK — modelos gratuitos do catálogo OpenRouter (jun/2026)
// Histórico de descontinuação: gemini-2.0-flash-exp:free (404) -> gemma-3-27b-it:free (404)
// Por isso agora usamos uma LISTA, não um único modelo: se o primeiro cair
// (404 = removido, 429 = rate limit esgotado), o código tenta o próximo
// automaticamente, sem quebrar a análise do usuário.
// Verifique a disponibilidade atual em: https://openrouter.ai/collections/free-models
const MODELOS_FALLBACK = [
  "google/gemma-4-31b-it:free",   // sucessor direto do gemma-3-27b, mesma faixa de qualidade
  "z-ai/glm-4.5-air:free",        // bom em seguir instruções/JSON estruturado
  "openai/gpt-oss-120b:free",     // forte em raciocínio e formato estruturado
  "moonshotai/kimi-k2.6:free",    // alternativa de outro provedor (reduz risco correlato)
];

export interface ResultadoRegra {
  id: string;
  status: "conforme" | "nao_conforme" | "nao_aplicavel";
  justificativa: string;
}

export interface RespostaAnalise {
  resultados: ResultadoRegra[];
  resumo: string;
}

function montarPrompt(
  textoPDF: string,
  tipoAmbiente: string,
  regras: Array<{ id: string; codigo: string; descricao: string; norma_origem: string | null }>
): string {
  const listaRegras = regras
    .map(r => `- ID: ${r.id} | Codigo: ${r.codigo} | Norma: ${r.norma_origem ?? "-"} | Descricao: ${r.descricao}`)
    .join("\n");

  // Limita o texto do PDF para caber no contexto do modelo free
  const textoLimitado = textoPDF.slice(0, 12000);

  return `Voce e especialista em vigilancia sanitaria e normas ANVISA/ABNT para estabelecimentos de saude.

Analise o projeto arquitetonico abaixo para o tipo de ambiente: ${tipoAmbiente}

TEXTO EXTRAIDO DO PROJETO (PDF):
${textoLimitado}

REGRAS REGULATORIAS A VERIFICAR:
${listaRegras}

INSTRUCOES:
- Analise cada regra contra o texto do projeto
- Marque "conforme" APENAS se o projeto mencionar explicitamente o atendimento ao requisito
- Marque "nao_conforme" se o projeto claramente nao atende
- Marque "nao_aplicavel" se nao ha informacao suficiente para avaliar
- A justificativa deve ser breve (1 frase) e baseada no texto do projeto

Responda APENAS com JSON valido, sem texto adicional, markdown ou backticks:
{"resultados":[{"id":"uuid-da-regra","status":"conforme","justificativa":"explicacao breve"}],"resumo":"resumo geral em 2-3 frases"}`;
}

function limparJSON(conteudo: string): string {
  return conteudo
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Tenta chamar um modelo específico no OpenRouter.
 * Lança erro com `.status` (quando vier de HTTP) para o chamador decidir se tenta o próximo modelo.
 */
async function chamarModelo(
  modelo: string,
  prompt: string,
  apiKey: string
): Promise<RespostaAnalise> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://visacheck-go.vercel.app",
      "X-Title": "VISAcheck GO",
    },
    body: JSON.stringify({
      model: modelo,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    const e: any = new Error(`Erro OpenRouter ${response.status} (${modelo}): ${erro.slice(0, 200)}`);
    e.status = response.status;
    throw e;
  }

  const data = await response.json();
  const conteudo: string = data.choices?.[0]?.message?.content ?? "";
  const jsonLimpo = limparJSON(conteudo);

  try {
    return JSON.parse(jsonLimpo) as RespostaAnalise;
  } catch {
    const e: any = new Error(`IA retornou resposta invalida (${modelo}): ${conteudo.slice(0, 300)}`);
    e.status = "invalid_json";
    throw e;
  }
}

export async function analisarProjetoComIA(
  textoPDF: string,
  tipoAmbiente: string,
  regras: Array<{ id: string; codigo: string; descricao: string; norma_origem: string | null }>
): Promise<RespostaAnalise> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string;
  if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY nao configurada no Vercel");

  const prompt = montarPrompt(textoPDF, tipoAmbiente, regras);

  const erros: string[] = [];

  for (const modelo of MODELOS_FALLBACK) {
    try {
      return await chamarModelo(modelo, prompt, apiKey);
    } catch (err: any) {
      // 404 = modelo descontinuado/renomeado, 429 = rate limit, 5xx = indisponibilidade temporária
      // Em qualquer um desses casos vale tentar o próximo modelo da lista.
      erros.push(`${modelo}: ${err.message}`);
      console.warn(`[OpenRouter] Falhou com ${modelo}, tentando próximo da lista...`, err);
      continue;
    }
  }

  // Todos os modelos da lista falharam
  throw new Error(
    `Todos os modelos gratuitos configurados falharam. Verifique openrouter.ai/models (catálogo pode ter mudado) ou se o limite de uso gratuito foi atingido.\nDetalhes:\n${erros.join("\n")}`
  );
}
