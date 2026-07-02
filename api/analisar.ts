// api/analisar.ts — Edge Function Vercel (proxy para API Anthropic)
//
// Por que existe esse arquivo?
// A API da Anthropic não permite chamadas diretas do navegador (CORS bloqueado).
// Essa função roda no servidor do Vercel, recebe a requisição do frontend,
// repassa para api.anthropic.com e devolve a resposta — sem expor a chave.
//
// A chave VITE_ANTHROPIC_API_KEY fica apenas nas variáveis de ambiente do Vercel,
// nunca no código nem no bundle do frontend.

import type { VercelRequest, VercelResponse } from "@vercel/node";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Só aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  // Cabeçalhos CORS — permite chamadas do frontend hospedado no Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "VITE_ANTHROPIC_API_KEY não configurada no Vercel." });
  }

  const { textoPDF, tipoAmbiente, regras } = req.body ?? {};
  if (!textoPDF || !tipoAmbiente || !regras) {
    return res.status(400).json({ error: "Parâmetros obrigatórios: textoPDF, tipoAmbiente, regras." });
  }

  const listaRegras = (regras as Array<{ id: string; codigo: string; descricao: string; norma_origem: string | null }>)
    .map(r => `- ID: ${r.id} | Codigo: ${r.codigo} | Norma: ${r.norma_origem ?? "-"} | Descricao: ${r.descricao}`)
    .join("\n");

  const textoLimitado = (textoPDF as string).slice(0, 12000);

  const prompt = `Analise o projeto arquitetonico abaixo para o tipo de ambiente: ${tipoAmbiente}

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

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: "Voce e especialista em vigilancia sanitaria e normas ANVISA/ABNT para estabelecimentos de saude. Responda SEMPRE em JSON valido e nada mais.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const erro = await response.text();
      if (response.status === 401) {
        return res.status(401).json({ error: "Chave da API Anthropic inválida. Verifique ANTHROPIC_API_KEY no Vercel." });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: "Limite de uso da API Anthropic atingido. Aguarde ou verifique créditos em platform.claude.com." });
      }
      return res.status(response.status).json({ error: `Erro API Anthropic ${response.status}: ${erro.slice(0, 200)}` });
    }

    const data = await response.json();
    const conteudo: string = data.content?.[0]?.text ?? "";

    if (!conteudo) {
      return res.status(500).json({ error: "API Anthropic retornou resposta vazia." });
    }

    // Remove markdown fences se o modelo insistir
    const jsonLimpo = conteudo
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const resultado = JSON.parse(jsonLimpo);
      return res.status(200).json(resultado);
    } catch {
      return res.status(500).json({ error: `IA retornou resposta inválida: ${conteudo.slice(0, 300)}` });
    }

  } catch (err: any) {
    return res.status(500).json({ error: `Erro interno: ${err.message ?? "desconhecido"}` });
  }
}
