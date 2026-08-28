import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";
const TAMANHO_LOTE = 30;
const LIMITE_CARACTERES_PDF = 30000;
const LIMITE_CARACTERES_MEMORIAL = 15000;
const TABELA_CACHE = "analises_ia_cache";

function extrairJSON(texto) {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim <= inicio) {
    throw new Error("JSON nao encontrado: " + texto.slice(0, 200));
  }
  return JSON.parse(texto.slice(inicio, fim + 1));
}

function calcularHashAnalise(textoPDF, tipoAmbiente, regras, textoMemorial) {
  const textoConsiderado = String(textoPDF).slice(0, LIMITE_CARACTERES_PDF);
  const memorialConsiderado = textoMemorial ? String(textoMemorial).slice(0, LIMITE_CARACTERES_MEMORIAL) : "";
  const regrasOrdenadas = [...regras]
    .map(r => r.id + "|" + r.codigo + "|" + r.descricao + "|" + (r.norma_origem ?? ""))
    .sort()
    .join("\n");
  // v3: bump de versao para invalidar cache antigo, que pode conter resultados
  // gerados com o bug de mapeamento por id (ver analisarLote) — forcamos uma
  // nova chamada a IA em vez de reaproveitar um resultado potencialmente errado.
  // v4: prompt agora pede motivo_na (nao_existe/sem_dado) para filtrar pendencias reais
  // v5: prompt agora pede no_limite (conforme com margem estreita) e valores encontrados na justificativa
  const base = "v5\n" + tipoAmbiente + "\n---REGRAS---\n" + regrasOrdenadas + "\n---PDF---\n" + textoConsiderado + "\n---MEMORIAL---\n" + memorialConsiderado;
  return crypto.createHash("sha256").update(base).digest("hex");
}

function obterClienteSupabase() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient(url, chave);
}

async function obterUsuarioAutenticado(req) {
  const cabecalho = req.headers.authorization ?? req.headers.Authorization;
  if (!cabecalho || !cabecalho.startsWith("Bearer ")) return null;
  const token = cabecalho.slice("Bearer ".length).trim();
  if (!token) return null;

  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("[auth] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes - negando acesso.");
    return null;
  }

  const supabase = createClient(url, chave);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function analisarLote(apiKey, textoPDF, tipoAmbiente, regras, numeroLote, totalLotes, textoMemorial) {
  const listaRegras = regras
    .map((r, i) => "- Indice: " + (i + 1) + " | Codigo: " + r.codigo + " | Norma: " + (r.norma_origem ?? "-") + " | Descricao: " + r.descricao)
    .join("\n");
  const textoLimitado = String(textoPDF).slice(0, LIMITE_CARACTERES_PDF);

  const temMemorial = !!(textoMemorial && String(textoMemorial).trim().length > 0);
  const textoMemorialLimitado = temMemorial ? String(textoMemorial).slice(0, LIMITE_CARACTERES_MEMORIAL) : "";

  const blocoMemorial = temMemorial
    ? "\n\nTEXTO DO MEMORIAL DESCRITIVO (documento complementar, redigido pelo arquiteto responsavel):\n" + textoMemorialLimitado + "\n"
    : "";

  const instrucoesMemorial = temMemorial
    ? "USO DO MEMORIAL DESCRITIVO:\n" +
      "- Alem da planta (TEXTO DO PROJETO), voce recebeu tambem o Memorial Descritivo do projeto, um documento " +
      "textual complementar que pode trazer informacoes (medidas, materiais, caracteristicas de ambientes) que nao " +
      "estao desenhadas ou legendadas com clareza na planta.\n" +
      "- Se a planta nao trouxer o dado necessario para julgar uma regra, verifique tambem o texto do Memorial " +
      "Descritivo antes de decidir que falta informacao.\n" +
      "- Se planta e memorial informarem valores ou caracteristicas DIFERENTES para o mesmo elemento (ex: memorial " +
      "descreve \"corredor de 1,50m\" mas a planta indica outra medida para o mesmo corredor), NAO marque como " +
      "conforme nem como nao_aplicavel: marque como nao_conforme e explique a divergencia na justificativa, citando " +
      "o valor de cada documento (ex: \"Divergencia entre memorial (1,50m) e planta (1,20m) para o corredor X\").\n\n"
    : "";

  const prompt = "Analise o projeto para o ambiente: " + tipoAmbiente + " (lote " + numeroLote + "/" + totalLotes + ")\n\n" +
    "ESCOPO DA ANALISE - LEIA COM ATENCAO:\n" +
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
    "TEXTO DO PROJETO:\n" + textoLimitado + "\n" + blocoMemorial + "\n" +
    "REGRAS A VERIFICAR (" + regras.length + " regras):\n" + listaRegras + "\n\n" +
    instrucoesMemorial +
    "COMO DECIDIR O STATUS DE CADA REGRA - SIGA ESTA ORDEM EXATA:\n" +
    "1) O elemento/ambiente a que a regra se refere EXISTE no projeto (dentro do escopo do \"" + tipoAmbiente + "\")?\n" +
    "   - NAO existe no projeto (ex: a regra fala de um ambiente que este projeto simplesmente nao tem, como " +
    "\"berçario\" num projeto que so tem centro cirurgico) -> status = nao_aplicavel. Justificativa: diga que o " +
    "elemento nao existe/nao se aplica a este projeto.\n" +
    "   - SIM existe -> va para o passo 2.\n" +
    "2) O texto do projeto" + (temMemorial ? " ou do memorial descritivo" : "") + " informa o dado necessario para julgar essa regra (medida, presenca de elemento, " +
    "caracteristica descrita)?\n" +
    "   - NAO informa (o elemento existe mas o dado especifico da regra nao aparece em nenhum dos textos, ex: " +
    "existe rampa mas a inclinacao dela nao foi informada) -> status = nao_aplicavel. Justificativa: diga " +
    "exatamente qual dado especifico faltou.\n" +
    "   - SIM informa -> va para o passo 3.\n" +
    "3) O dado informado atende ao requisito da regra?\n" +
    "   - Atende -> status = conforme.\n" +
    "   - Nao atende -> status = nao_conforme.\n\n" +
    "REGRA DE OURO PARA EVITAR AMBIGUIDADE: se voce encontrou no texto um numero, medida ou caracteristica que " +
    "permite comparar diretamente com o criterio da regra (ex: a regra pede \"minimo X\" e o texto informa um " +
    "valor), NUNCA marque como nao_aplicavel - marque conforme ou nao_conforme, mesmo que o valor esteja em outra " +
    "unidade ou formato, contanto que seja possivel comparar.\n\n" +
    "INSTRUCOES GERAIS:\n" +
    "- Seja consistente e literal: baseie-se apenas no que esta explicitamente escrito nos textos fornecidos, sem " +
    "suposicoes ou inferencias alem do que foi informado\n" +
    "- Antes de marcar uma regra como nao_aplicavel por falta de dado, procure no texto por termos equivalentes ou " +
    "sinonimos do que a regra pede (ex: \"abertura telada\"/\"tela\" equivale a protecao contra vetores/insetos; " +
    "\"Ø\" seguido de um numero indica diametro; \"resíduo comum\" equivale a \"resíduo do Grupo D\") antes de " +
    "concluir que a informacao nao existe\n" +
    "- NAO invente ou reutilize siglas/abreviacoes que nao estejam escritas na propria descricao da regra sendo " +
    "avaliada (ex: nunca abrevie \"Consultorio(s) Odontologico(s) Coletivo(s)\" como \"CCO\" - essa sigla ja " +
    "significa \"Centro Cirurgico Odontologico\" em outras regras deste mesmo relatorio; escreva os nomes de " +
    "ambientes por extenso para evitar confundir o leitor)\n" +
    "- TODA regra, inclusive as marcadas como nao_aplicavel, precisa de uma justificativa objetiva de 1 frase " +
    "explicando o motivo (nunca deixe justificativa vazia ou generica)\n" +
    "- Para toda regra com status nao_aplicavel, inclua tambem um campo \"motivo_na\" com um destes dois valores " +
    "exatos:\n" +
    "  * \"nao_existe\" quando o elemento/ambiente da regra simplesmente NAO existe neste tipo de projeto e nunca " +
    "existiria (ex: piscina, playground, auditorio, consultorio coletivo quando o projeto so tem individuais, " +
    "centro cirurgico quando o projeto nao tem um) — ou seja, nenhuma informacao adicional mudaria a resposta\n" +
    "  * \"sem_dado\" quando o elemento/ambiente EXISTE no projeto mas falta uma medida ou especificacao pontual " +
    "para julgar a regra (ex: existe balcao de atendimento mas a altura nao foi informada; existe estacionamento " +
    "mas o numero de vagas PCD nao foi informado) — aqui a informacao poderia completar a analise se fosse " +
    "fornecida\n" +
    "  * Na duvida entre os dois, use \"sem_dado\" (e melhor mostrar uma pendencia a mais do que esconder um " +
    "problema real)\n" +
    "- Para toda regra com status nao_conforme, inclua tambem um campo \"sugestao\" com 1 frase objetiva recomendando " +
    "a correcao necessaria para o projeto passar a atender a regra (omita esse campo para conforme/nao_aplicavel)\n" +
    "- Para toda regra com status conforme cujo criterio envolva um valor numerico (valor_minimo ou valor_maximo " +
    "informado na regra), a justificativa deve citar o valor encontrado no projeto e o valor exigido lado a lado " +
    "(ex: \"Consultorio 4: 9,00m² (minimo exigido: 9,0m²)\"), nao so dizer que esta conforme\n" +
    "- IMPORTANTE: identifique cada regra pelo campo \"indice\" (o numero listado antes de cada regra em \"REGRAS A " +
    "VERIFICAR\" acima). NAO invente, copie ou tente lembrar nenhum identificador de texto — use apenas o numero " +
    "inteiro do indice, exatamente como listado\n\n" +
    "RESPONDA APENAS COM JSON PURO sem markdown:\n" +
    "{\"resultados\":[{\"indice\":1,\"status\":\"conforme\",\"justificativa\":\"frase\"},{\"indice\":2,\"status\":\"conforme\",\"justificativa\":\"Consultorio 4: 9,00m² (minimo exigido: 9,0m²)\"},{\"indice\":3,\"status\":\"nao_conforme\",\"justificativa\":\"frase\",\"sugestao\":\"frase\"},{\"indice\":4,\"status\":\"nao_aplicavel\",\"justificativa\":\"frase\",\"motivo_na\":\"nao_existe\"}],\"resumo\":\"resumo 1 frase\"}";

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0,
      system: "Especialista ANVISA/ABNT. Responda SEMPRE com JSON puro valido sem markdown, identificando cada regra pelo campo indice numerico (nunca por texto/id). Atenha-se estritamente ao escopo do ambiente informado pelo usuario, ignorando outras areas do edificio mencionadas apenas como contexto de implantacao. Quando houver memorial descritivo, use-o como fonte complementar a planta e sinalize divergencias entre os dois documentos.",
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
  const bruto = extrairJSON(conteudo);

  // Traduz o "indice" que a IA devolveu de volta para o id real da regra,
  // usando a posicao dela na lista deste lote (regras[i-1] <-> indice i).
  // Isso elimina de vez a classe de bug em que a IA erra/trunca um UUID longo
  // ao tentar ecoa-lo: um numero pequeno (1..30) e muito mais dificil de errar
  // do que um UUID de 36 caracteres, e mesmo que erre, o indice fora do
  // intervalo e detectado e descartado abaixo (nunca vira uma entrada
  // "fantasma" que conta no total mas nao aparece em nenhuma lista da tela).
  let indicesInvalidos = 0;
  const resultadosMapeados = (bruto.resultados ?? [])
    .map(r => {
      const regraCorrespondente = regras[r.indice - 1];
      if (!regraCorrespondente) {
        indicesInvalidos++;
        return null;
      }
      return { id: regraCorrespondente.id, status: r.status, justificativa: r.justificativa, sugestao: r.sugestao ?? null, motivo_na: r.motivo_na ?? null, no_limite: r.no_limite === true };
    })
    .filter(Boolean);
  if (indicesInvalidos > 0) {
    console.warn("[analisar] lote " + numeroLote + ": " + indicesInvalidos + " indice(s) invalido(s) na resposta da IA (descartado(s)).");
  }

  return { resultados: resultadosMapeados, resumo: bruto.resumo };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://visacheck-go.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido." });

  const usuario = await obterUsuarioAutenticado(req);
  if (!usuario) {
    return res.status(401).json({ error: "Nao autenticado. Faca login para rodar uma analise." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY nao configurada no Vercel." });
  const { textoPDF, tipoAmbiente, regras: regrasRecebidas, textoMemorial } = req.body ?? {};
  const LIMITE_REGRAS = 150;
  if (Array.isArray(regrasRecebidas) && regrasRecebidas.length > LIMITE_REGRAS) {
    return res.status(400).json({ error: `Numero de regras excede o limite de ${LIMITE_REGRAS} por analise.` });
  }
  if (!textoPDF || !tipoAmbiente || !regrasRecebidas || !Array.isArray(regrasRecebidas)) {
    return res.status(400).json({ error: "Parametros obrigatorios ausentes." });
  }

  // Busca as regras oficiais no banco usando so os ids recebidos - o
  // codigo/descricao/norma_origem que o cliente mandar junto e ignorado,
  // evitando que o payload manipule o conteudo enviado para a IA.
  const idsRegras = [...new Set(regrasRecebidas.map(r => r && r.id).filter(Boolean))];
  if (idsRegras.length === 0) {
    return res.status(400).json({ error: "Nenhum id de regra valido informado." });
  }
  const supabaseServidor = obterClienteSupabase();
  if (!supabaseServidor) return res.status(500).json({ error: "Configuracao do servidor ausente." });
  const { data: regrasOficiais, error: erroRegras } = await supabaseServidor
    .from("regras_regulatorias")
    .select("id, codigo, descricao, norma_origem, categoria")
    .in("id", idsRegras);
  if (erroRegras) {
    console.error("[analisar] erro ao buscar regras oficiais:", erroRegras);
    return res.status(500).json({ error: "Erro ao validar regras." });
  }
  const mapaRegrasOficiais = new Map((regrasOficiais ?? []).map(r => [r.id, r]));
  const regras = idsRegras.map(id => mapaRegrasOficiais.get(id)).filter(Boolean);
  if (regras.length === 0) {
    return res.status(400).json({ error: "Nenhuma regra valida encontrada para os IDs informados." });
  }

  const supabase = obterClienteSupabase();
  const hash = calcularHashAnalise(textoPDF, tipoAmbiente, regras, textoMemorial);

  try {
    if (supabase) {
      const { data: cacheHit, error: erroCache } = await supabase
        .from(TABELA_CACHE)
        .select("resultados, resumo")
        .eq("hash", hash)
        .maybeSingle();
      if (erroCache) console.error("[cache] Erro ao consultar cache:", JSON.stringify(erroCache));
      if (cacheHit) {
        return res.status(200).json({ resultados: cacheHit.resultados, resumo: cacheHit.resumo, deCache: true });
      }
    }

    const lotes = [];
    for (let i = 0; i < regras.length; i += TAMANHO_LOTE) lotes.push(regras.slice(i, i + TAMANHO_LOTE));
    const todosResultados = [];
    let ultimoResumo = "";
    for (let i = 0; i < lotes.length; i++) {
      const resultado = await analisarLote(apiKey, textoPDF, tipoAmbiente, lotes[i], i + 1, lotes.length, textoMemorial);
      todosResultados.push(...(resultado.resultados ?? []));
      if (i === lotes.length - 1) ultimoResumo = resultado.resumo ?? "";
    }

    if (supabase) {
      const { error: erroSalvar } = await supabase.from(TABELA_CACHE).upsert({
        hash, tipo_ambiente: tipoAmbiente, resultados: todosResultados, resumo: ultimoResumo,
      });
      if (erroSalvar) console.error("[cache] Erro ao salvar cache:", JSON.stringify(erroSalvar));
    }

    return res.status(200).json({ resultados: todosResultados, resumo: ultimoResumo, deCache: false });
  } catch (err) {
    return res.status(500).json({ error: err.message ?? "Erro interno." });
  }
}
