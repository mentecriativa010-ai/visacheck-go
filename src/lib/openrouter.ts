// Integração com OpenRouter — VISAcheck GO
// A chave fica APENAS no Vercel (VITE_OPENROUTER_API_KEY), nunca no código

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// google/gemini-2.0-flash-exp:free foi descontinuado pelo OpenRouter (404).
// Gemma 3 27B é o modelo gratuito do Google atualmente ativo no catálogo.
const MODEL = "google/gemma-3-27b-it:free";

export interface ResultadoRegra {
  id: string;
  status: "conforme" | "nao_conforme" | "nao_aplicavel";
  justificativa: string;
}

export interface RespostaAnalise {
  resultados: ResultadoRegra[];
  resumo: string;
}

export async function analisarProjetoComIA(
  textoPDF: string,
  tipoAmbiente: string,
  regras: Array<{ id: string; codigo: string; descricao: string; norma_origem: string | null }>
): Promise<RespostaAnalise> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string;
  if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY nao configurada no Vercel");

  const listaRegras = regras
    .map(r => `- ID: ${r.id} | Codigo: ${r.codigo} | Norma: ${r.norma_origem ?? "-"} | Descricao: ${r.descricao}`)
    .join("\n");

  // Limita o texto do PDF para caber no contexto do modelo free
  const textoLimitado = textoPDF.slice(0, 12000);

  const prompt = `Voce e especialista em vigilancia sanitaria e normas ANVISA/ABNT para estabelecimentos de saude.

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

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://visacheck-go.vercel.app",
      "X-Title": "VISAcheck GO",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    if (response.status === 429) {
      throw new Error("Limite de uso do modelo gratuito atingido (rate limit). Aguarde alguns minutos e tente novamente.");
    }
    if (response.status === 404) {
      throw new Error(`Modelo "${MODEL}" indisponível no OpenRouter (pode ter sido descontinuado). Verifique openrouter.ai/models.`);
    }
    throw new Error(`Erro OpenRouter ${response.status}: ${erro.slice(0, 200)}`);
  }

  const data = await response.json();
  const conteudo: string = data.choices?.[0]?.message?.content ?? "";

  // Remove markdown fences se o modelo insistir em adicionar
  const jsonLimpo = conteudo
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(jsonLimpo) as RespostaAnalise;
  } catch {
    throw new Error(`IA retornou resposta invalida: ${conteudo.slice(0, 300)}`);
  }
}