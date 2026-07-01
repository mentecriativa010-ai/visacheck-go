// Integração com API da Anthropic — VISAcheck GO
// Migrado do OpenRouter para API nativa da Anthropic em jul/2026.
// Motivo: modelos gratuitos do OpenRouter eram instáveis (404/429 constantes
// e respostas inválidas). A API da Anthropic é mais confiável e o custo
// com Haiku 4.5 é irrisório (~$0,001 por análise).
//
// A chave fica APENAS no Vercel (VITE_ANTHROPIC_API_KEY), nunca no código.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// claude-haiku-4-5: modelo mais rápido e barato da Anthropic.
// $1/M tokens de entrada + $5/M tokens de saída.
// Cada análise usa ~5-8k tokens → custo < R$ 0,01 por análise.
// Segue instruções de JSON de forma muito mais confiável que modelos free.
const MODEL = "claude-haiku-4-5";

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

  // Limita o texto do PDF para caber no contexto (Haiku 4.5 tem 200k tokens,
  // mas limitamos a 12000 chars pra manter custo baixo e resposta focada)
  const textoLimitado = textoPDF.slice(0, 12000);

  return `Analise o projeto arquitetonico abaixo para o tipo de ambiente: ${tipoAmbiente}

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

FORMATO DE RESPOSTA — OBRIGATORIO:
Responda SOMENTE com o objeto JSON abaixo. Nao escreva nenhum texto antes ou depois.
Nao use markdown, nao use blocos de codigo, nao use backticks, nao escreva explicacoes.
APENAS o JSON puro, comecando com { e terminando com }:
{"resultados":[{"id":"uuid-da-regra","status":"conforme","justificativa":"explicacao breve"}],"resumo":"resumo geral em 2-3 frases"}`;
}

function limparJSON(conteudo: string): string {
  return conteudo
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function analisarProjetoComIA(
  textoPDF: string,
  tipoAmbiente: string,
  regras: Array<{ id: string; codigo: string; descricao: string; norma_origem: string | null }>
): Promise<RespostaAnalise> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
  if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY nao configurada no Vercel");

  const prompt = montarPrompt(textoPDF, tipoAmbiente, regras);

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      // Permite que o Anthropic saiba que essa chamada vem de um app externo
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: "Voce e especialista em vigilancia sanitaria e normas ANVISA/ABNT para estabelecimentos de saude. Responda SEMPRE em JSON valido e nada mais.",
      messages: [
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    if (response.status === 401) {
      throw new Error("Chave da API Anthropic invalida ou expirada. Verifique a variavel VITE_ANTHROPIC_API_KEY no Vercel.");
    }
    if (response.status === 429) {
      throw new Error("Limite de uso da API Anthropic atingido. Aguarde alguns minutos ou verifique seus creditos em platform.claude.com.");
    }
    if (response.status === 529) {
      throw new Error("API Anthropic temporariamente sobrecarregada. Tente novamente em alguns instantes.");
    }
    throw new Error(`Erro API Anthropic ${response.status}: ${erro.slice(0, 200)}`);
  }

  const data = await response.json();

  // Formato da resposta da API Anthropic: data.content[0].text
  const conteudo: string = data.content?.[0]?.text ?? "";

  if (!conteudo) {
    throw new Error("API Anthropic retornou resposta vazia.");
  }

  const jsonLimpo = limparJSON(conteudo);

  try {
    return JSON.parse(jsonLimpo) as RespostaAnalise;
  } catch {
    throw new Error(`IA retornou resposta invalida: ${conteudo.slice(0, 300)}`);
  }
}
