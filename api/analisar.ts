import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";
const TAMANHO_LOTE = 30;
// Limite de caracteres do texto do PDF enviado por lote. Aumentado de 10000 para 30000
// porque o corte anterior estava cortando o texto ANTES de chegar aos ambientes
// específicos do projeto (ex: Centro Cirúrgico Ambulatorial), deixando só a
// implantação geral (estacionamento, outros setores do hospital) visível para a IA.
const LIMITE_CARACTERES_PDF = 30000;
const TABELA_CACHE = "analises_ia_cache";

function extrairJSON(texto) {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim <= inicio) {
    throw new Error("JSON nao encontrado: " + texto.slice(0, 200));
  }
  return JSON.parse(texto.slice(inicio, fim + 1));
}

// ─── Cache de análises ────────────────────────────────────────────────────
// Calcula uma "impressao digital" (hash) unica a partir do texto do PDF (exatamente
// como e enviado ao modelo, ja truncado), do tipo de ambiente e das regras avaliadas.
// Mesmo PDF + mesmo ambiente + mesmas regras => mesmo hash => mesmo resultado sempre,
// mesmo que o modelo de IA nao seja 100% deterministico entre chamadas.
function calcularHashAnalise(textoPDF, tipoAmbiente, regras) {
  const textoConsiderado = String(textoPDF).slice(0, LIMITE_CARACTERES_PDF);
  const regrasOrdenadas = [...regras]
    .map(r => r.id + "|" + r.codigo + "|" + r.descricao + "|" + (r.norma_origem ?? ""))
    .sort()
    .join("\n");
  const base = "v1\n" + tipoAmbiente + "\n---REGRAS---\n" + regrasOrdenadas + "\n---PDF---\n" + textoConsiderado;
  return crypto.createHash("sha256").update(base).digest("hex");
}

function obterClienteSupabase() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null; // cache fica desligado se as env vars nao estiverem configuradas
  return createClient(url, chave);
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
    "COMO DECIDIR O STATUS DE CADA REGRA — SIGA ESTA ORDEM EXATA:\n" +
    "1) O elemento/ambiente a que a regra se refere EXISTE no projeto (dentro do escopo do \"" + tipoAmbiente + "\")?\n" +
    "   - NAO existe no projeto (ex: a regra fala de um ambiente que este projeto simplesmente nao tem, como " +
    "\"berçario\" num projeto que so tem centro cirurgico) -> status = nao_aplicavel. Justificativa: diga que o " +
    "elemento nao existe/nao se aplica a este projeto.\n" +
    "   - SIM existe -> va para o passo 2.\n" +
    "2) O texto do projeto informa o dado necessario para julgar essa regra (medida, presenca de elemento, " +
    "caracteristica descrita)?\n" +
    "   - NAO informa (o elemento existe mas o dado especifico da regra nao aparece no texto, ex: existe rampa mas " +
    "a inclinacao dela nao foi informada) -> status = nao_aplicavel. Justificativa: diga exatamente qual dado " +
    "especifico faltou no texto do projeto.\n" +
    "   - SIM informa -> va para o passo 3.\n" +
    "3) O dado informado atende ao requisito da regra?\n" +
    "   - Atende -> status = conforme.\n" +
    "   - Nao atende -> status = nao_conforme.\n\n" +
    "REGRA DE OURO PARA EVITAR AMBIGUIDADE: se voce encontrou no texto um numero, medida ou caracteristica que " +
    "permite comparar diretamente com o criterio da regra (ex: a regra pede \"minimo X\" e o texto informa um " +
    "valor), NUNCA marque como nao_aplicavel — marque conforme ou nao_conforme, mesmo que o valor esteja em outra " +
    "unidade ou formato, contanto que seja possivel comparar.\n\n" +
    "INSTRUCOES GERAIS:\n" +
    "- Seja consistente e literal: baseie-se apenas no que esta explicitamente escrito no texto do projeto, sem " +
    "suposicoes ou inferencias alem do que foi informado\n" +
    "- TODA regra, inclusive as marcadas como nao_aplicavel, precisa de uma justificativa objetiva de 1 frase " +
    "explicando o motivo (nunca deixe justificativa vazia ou generica)\n\n" +
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

  const supabase = obterClienteSupabase();
  const hash = calcularHashAnalise(textoPDF, tipoAmbiente, regras);

  try {
    // 1) Tenta reaproveitar uma analise identica ja feita antes (mesmo PDF, mesmo
    // ambiente, mesmas regras) — garante resultado sempre igual e evita gastar
    // chamadas de API repetindo a mesma analise.
    if (supabase) {
      const { data: cacheHit, error: erroCache } = await supabase
        .from(TABELA_CACHE)
        .select("resultados, resumo")
        .eq("hash", hash)
        .maybeSingle();
      if (erroCache) console.error("Erro ao consultar cache de analise:", erroCache.message);
      if (cacheHit) {
        return res.status(200).json({ resultados: cacheHit.resultados, resumo: cacheHit.resumo, deCache: true });
      }
    }

    // 2) Sem cache — roda a analise normalmente via IA, em lotes
    const lotes = [];
    for (let i = 0; i < regras.length; i += TAMANHO_LOTE) lotes.push(regras.slice(i, i + TAMANHO_LOTE));
    const todosResultados = [];
    let ultimoResumo = "";
    for (let i = 0; i < lotes.length; i++) {
      const resultado = await analisarLote(apiKey, textoPDF, tipoAmbiente, lotes[i], i + 1, lotes.length);
      todosResultados.push(...(resultado.resultados ?? []));
      if (i === lotes.length - 1) ultimoResumo = resultado.resumo ?? "";
    }

    // 3) Salva no cache para que a proxima analise do mesmo PDF seja instantanea e identica
    if (supabase) {
      const { error: erroSalvar } = await supabase.from(TABELA_CACHE).upsert({
        hash, tipo_ambiente: tipoAmbiente, resultados: todosResultados, resumo: ultimoResumo,
      });
      if (erroSalvar) console.error("Erro ao salvar cache de analise:", erroSalvar.message);
    }

    return res.status(200).json({ resultados: todosResultados, resumo: ultimoResumo, deCache: false });
  } catch (err) {
    return res.status(500).json({ error: err.message ?? "Erro interno." });
  }
}
