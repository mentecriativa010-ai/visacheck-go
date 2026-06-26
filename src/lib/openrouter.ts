// Integração com OpenRouter — VISAcheck GO
// A chave fica APENAS no Vercel (VITE_OPENROUTER_API_KEY), nunca no código

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ─────────────────────────────────────────────────────────────────────────
// MODO 100% GRATUITO (decisão deliberada: app ainda em fase de testes,
// investimento em modelos pagos só depois que a análise estiver validada)
//
// Histórico de instabilidade observado: gemini-2.0-flash-exp:free (404) ->
// gemma-3-27b-it:free (404) -> glm-4.5-air:free (404, mesmo listado como
// "free" no catálogo — a listagem do site fica desatualizada em relação à
// API real) -> kimi-k2.6:free (mesmo problema) + 429 esporádico em vários
// outros (sobrecarga compartilhada entre todos os usuários do OpenRouter).
//
// Estratégia adotada para maximizar robustez SEM custo:
//   1) Lista ampla e diversificada (7 modelos, 4 provedores diferentes)
//      — reduz a chance de todos caírem ao mesmo tempo.
//   2) Em caso de 429 (rate-limit temporário), espera ~3s e tenta o MESMO
//      modelo de novo 1x antes de desistir dele e ir pro próximo da lista
//      — já que o próprio erro da OpenRouter diz que é "temporário".
//
// TODO (quando o app estiver validado e pronto pra produção real):
// adicionar 1-2 modelos pagos baratos (~$0,05-0,20/M tokens) como última
// rede de segurança. Histórico dessa decisão: conversa de jun/2026.
//
// Verifique disponibilidade atual em: https://openrouter.ai/models
// (mas lembre: a listagem do site pode estar desatualizada — o teste real
// é a resposta da API)
const MODELOS_FALLBACK = [
  "openrouter/owl-alpha",                    // modelo da própria OpenRouter, contexto 1M
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",                 // variante menor da OpenAI, pool de cota separado
  "google/gemma-4-26b-a4b-it:free",          // variante menor do Gemma, pool de cota separado
  "nvidia/nemotron-3-nano-30b-a3b:free",
];

const ESPERA_RETRY_429_MS = 3000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      // 429 = rate limit temporário -> vale a pena tentar o MESMO modelo
      // de novo uma vez após uma pequena espera, antes de desistir dele.
      if (err.status === 429) {
        console.warn(`[OpenRouter] 429 em ${modelo}, aguardando ${ESPERA_RETRY_429_MS}ms e tentando de novo...`);
        await sleep(ESPERA_RETRY_429_MS);
        try {
          return await chamarModelo(modelo, prompt, apiKey);
        } catch (err2: any) {
          erros.push(`${modelo} (após retry): ${err2.message}`);
          console.warn(`[OpenRouter] Retry de ${modelo} também falhou, tentando próximo da lista...`, err2);
          continue;
        }
      }
      // 404 = modelo descontinuado/renomeado, 5xx = indisponibilidade temporária
      erros.push(`${modelo}: ${err.message}`);
      console.warn(`[OpenRouter] Falhou com ${modelo}, tentando próximo da lista...`, err);
      continue;
    }
  }

  // Todos os modelos gratuitos da lista falharam
  throw new Error(
    `Todos os modelos gratuitos configurados falharam (incluindo retry em rate-limits). Catálogo gratuito do OpenRouter pode ter mudado — verifique openrouter.ai/models, ou tente novamente em alguns minutos (a sobrecarga upstream costuma ser passageira).\nDetalhes:\n${erros.join("\n")}`
  );
}
