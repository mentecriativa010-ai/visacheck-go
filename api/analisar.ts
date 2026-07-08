const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";
const TAMANHO_LOTE = 30;
// Limite de caracteres do texto do PDF enviado por lote. Aumentado de 10000 para 30000
// porque o corte anterior estava cortando o texto ANTES de chegar aos ambientes
// específicos do projeto (ex: Centro Cirúrgico Ambulatorial), deixando só a
// implantação geral (estacionamento, outros setores do hospital) visível para a IA.
const LIMITE_CARACTERES_PDF = 30000;

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
  const textoLimitado = String(textoPDF).slice(0, LIMITE_CARACTERES_PDF);

  const prompt = "Analise o projeto para o ambiente: " + tipoAmbiente + " (lote " + numeroLote + "/" + totalLotes + ")\n\n" +
    "ESCOPO DA ANALISE — LEIA COM ATENCAO:\n" +
    "Este projeto arquitetonico pode conter, alem do ambiente analisado, a representacao de OUTRAS areas do " +
    "hospital/edificio (ex: estacionamento, outros setores, apartamentos, ambulatorio, setor de imagem, circulacoes " +
    "gerais de acesso) que aparecem apenas como CONTEXTO DE IMPLANTACAO/LOCALIZACAO, mas que NAO fazem parte do " +
    "escopo desta analise regulatoria. A legenda do projeto normalmente identifica isso como \"ambientes nao " +
    "sujeitos a analise\" ou area fora do perimetro de intervencao.\n" +
    "- Analise e responda SOMENTE sobre os ambientes, salas e elementos que pertencem ao \"" + tipoAmbiente + "\" " +
    "propriamente dito (o ambiente/setor sendo submetido a analise).\n" +
    "- NAO avalie, NAO comente e NAO reprove itens referentes a outras areas do edificio que nao fazem parte do " +
    "escopo (ex: vagas de estacionamento do hospital, setores administrativos gerais, outros pavimentos), mesmo " +
    "que elas apareçam no texto extraido do PDF.\n" +
    "- Se uma regra so puder ser avaliada a partir de um elemento que esta fora do escopo do projeto (nao faz " +
    "parte do \"" + tipoAmbiente + "\"), marque como nao_aplicavel e explique isso na justificativa " +
    "(ex: \"Fora do escopo deste projeto, que trata apenas do(a) " + tipoAmbiente + "\").\n\n" +
    "TEXTO DO PROJETO:\n" + textoLimitado + "\n\n" +
    "REGRAS A VERIFICAR (" + regras.length + " regras):\n" + listaRegras + "\n\n" +
    "INSTRUCOES:\n" +
    "- Marque conforme APENAS se o projeto mencionar explicitamente o requisito, dentro do escopo do \"" + tipoAmbiente + "\"\n" +
    "- Marque nao_conforme se claramente nao atende, dentro do escopo do \"" + tipoAmbiente + "\"\n" +
    "- Marque nao_aplicavel se nao ha informacao suficiente OU se o item estiver fora do escopo do projeto\n" +
    "- Seja consistente e literal: baseie-se apenas no que esta explicitamente escrito no texto do projeto, sem " +
    "suposicoes ou inferencias alem do que foi informado\n" +
    "- Justificativa em 1 frase curta\n\n" +
    "RESPONDA APENAS COM JSON PURO sem markdown:\n" +
    "{\"resultados\":[{\"id\":\"uuid\",\"status\":\"conforme\",\"justificativa\":\"frase\"}],\"resumo\":\"resumo 1 frase\"}";

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      // temperature 0 = resposta deterministica. Sem isso, o padrao da API (1.0)
      // fazia a mesma analise mudar a cada execucao, mesmo com o mesmo PDF e regras.
      temperature: 0,
      system: "Especialista ANVISA/ABNT. Responda SEMPRE com JSON puro valido sem markdown. Atenha-se estritamente ao escopo do ambiente informado pelo usuario, ignorando outras areas do edificio mencionadas apenas como contexto de implantacao.",
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
