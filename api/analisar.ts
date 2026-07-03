const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";
const TAMANHO_LOTE = 30;

function extrairJSON(texto) {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim <= inicio) {
    throw new Error("JSON nao encontrado: " + texto.slice(0, 200));
  }
  return JSON.parse(texto.slice(inicio, fim + 1));
}

async function analisarLote(apiKey, textoPDF, tipoAmbiente, regras, numeroLote, totalLotes) {
  const listaRegras = regras
    .map(r => "- ID: " + r.id + " | Codigo: " + r.codigo + " | Norma: " + (r.norma_origem ?? "-") + " | Descricao: " + r.descricao)
    .join("\n");
  const textoLimitado = String(textoPDF).slice(0, 10000);
  const prompt = "Analise o projeto para o ambiente: " + tipoAmbiente + " (lote " + numeroLote + "/" + totalLotes + ")\n\nTEXTO DO PROJETO:\n" + textoLimitado + "\n\nREGRAS A VERIFICAR (" + regras.length + " regras):\n" + listaRegras + "\n\nINSTRUCOES:\n- Marque conforme APENAS se o projeto mencionar explicitamente o requisito\n- Marque nao_conforme se claramente nao atende\n- Marque nao_aplicavel se nao ha informacao suficiente\n- Justificativa em 1 frase curta\n\nRESPONDA APENAS COM JSON PURO sem markdown:\n{\"resultados\":[{\"id\":\"uuid\",\"status\":\"conforme\",\"justificativa\":\"frase\"}],\"resumo\":\"resumo 1 frase\"}";

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
    body: JSON.stringify({
      model: MODEL, max_tokens: 4096,
      system: "Especialista ANVISA/ABNT. Responda SEMPRE com JSON puro valido sem markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error("Erro API Anthropic " + response.status + " lote " + numeroLote + ": " + erro.slice(0, 200));
  }

  const data = await response.json();
  const conteudo = data.content?.[0]?.text ?? "";
  if (!conteudo) throw new Error("Lote " + numeroLote + ": resposta vazia");
  return extrairJSON(conteudo);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido." });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY nao configurada no Vercel." });

  const { textoPDF, tipoAmbiente, regras } = req.body ?? {};
  if (!textoPDF || !tipoAmbiente || !regras || !Array.isArray(regras)) {
    return res.status(400).json({ error: "Parametros obrigatorios ausentes." });
  }

  try {
    const lotes = [];
    for (let i = 0; i < regras.length; i += TAMANHO_LOTE) lotes.push(regras.slice(i, i + TAMANHO_LOTE));
    const todosResultados = [];
    let ultimoResumo = "";
    for (let i = 0; i < lotes.length; i++) {
      const resultado = await analisarLote(apiKey, textoPDF, tipoAmbiente, lotes[i], i + 1, lotes.length);
      todosResultados.push(...(resultado.resultados ?? []));
      if (i === lotes.length - 1) ultimoResumo = resultado.resumo ?? "";
    }
    return res.status(200).json({ resultados: todosResultados, resumo: ultimoResumo });
  } catch (err) {
    return res.status(500).json({ error: err.message ?? "Erro interno." });
  }
}
