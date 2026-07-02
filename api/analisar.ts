// api/analisar.ts — Funcao Serverless Vercel (proxy para API Anthropic)
// Nao usa @vercel/node para evitar dependencia nao instalada no projeto.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido." });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[DEBUG] ANTHROPIC_API_KEY existe?", !!apiKey);
  console.log("[DEBUG] Variaveis disponiveis:", Object.keys(process.env).filter(k => k.includes("ANTHROPIC") || k.includes("API")).join(", "));
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY nao configurada no Vercel." });

  const { textoPDF, tipoAmbiente, regras } = req.body ?? {};
  if (!textoPDF || !tipoAmbiente || !regras) {
    return res.status(400).json({ error: "Parametros obrigatorios: textoPDF, tipoAmbiente, regras." });
  }

  const listaRegras = regras
    .map((r: any) => `- ID: ${r.id} | Codigo: ${r.codigo} | Norma: ${r.norma_origem ?? "-"} | Descricao: ${r.descricao}`)
    .join("\n");

  const textoLimitado = String(textoPDF).slice(0, 12000);

  const prompt = `Analise o projeto arquitetonico para o tipo de ambiente: ${tipoAmbiente}\n\nTEXTO DO PROJETO:\n${textoLimitado}\n\nREGRAS A VERIFICAR:\n${listaRegras}\n\nINSTRUCOES:\n- Marque conforme APENAS se o projeto mencionar explicitamente o requisito\n- Marque nao_conforme se claramente nao atende\n- Marque nao_aplicavel se nao ha informacao suficiente\n- Justificativa em 1 frase\n\nRESPONDA APENAS COM JSON PURO SEM MARKDOWN:\n{"resultados":[{"id":"uuid","status":"conforme","justificativa":"frase"}],"resumo":"2-3 frases"}`;

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
      body: JSON.stringify({
        model: MODEL, max_tokens: 4000,
        system: "Especialista em vigilancia sanitaria ANVISA/ABNT. Responda SEMPRE em JSON valido.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const erro = await response.text();
      return res.status(response.status).json({ error: `Erro API Anthropic ${response.status}: ${erro.slice(0, 200)}` });
    }

    const data = await response.json();
    const conteudo: string = data.content?.[0]?.text ?? "";
    if (!conteudo) return res.status(500).json({ error: "API Anthropic retornou resposta vazia." });

    const jsonLimpo = conteudo.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    try {
      return res.status(200).json(JSON.parse(jsonLimpo));
    } catch {
      return res.status(500).json({ error: `Resposta invalida: ${conteudo.slice(0, 200)}` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Erro interno: ${err.message ?? "desconhecido"}` });
  }
}
