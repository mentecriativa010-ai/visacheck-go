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

const STATUS_VALIDOS = new Set(["conforme", "nao_conforme", "nao_aplicavel"]);

// Corrige uma inconsistencia de formato que a IA as vezes comete: preencher o campo
// "status" com um valor que deveria estar em "motivo_na" (ex: status="sem_dado" em vez
// de status="nao_aplicavel" + motivo_na="sem_dado"). Sem essa normalizacao, o item nunca
// bate na condicao "status === nao_aplicavel" usada tanto pelo override de
// verificado_em_vistoria quanto pelo resto do relatorio, e fica pra sempre visivel como
// pendencia mesmo quando a regra deveria ser escondida.
function normalizarStatus(resultados) {
  return resultados.map(r => {
    if (STATUS_VALIDOS.has(r.status)) return r;
    return { ...r, status: "nao_aplicavel", motivo_na: r.motivo_na ?? r.status };
  });
}

// Reaplica a reclassificacao de verificado_em_vistoria a um conjunto de resultados ja
// calculados (tanto os que acabaram de sair da IA quanto os que vieram do cache). O
// hash do cache (calcularHashAnalise) NAO inclui verificado_em_vistoria — de proposito,
// pra nao invalidar o cache toda vez que alguem faz curadoria manual dessa flag via SQL
// — entao sem essa reaplicacao aqui, um cache hit devolveria pra sempre o motivo_na
// antigo, ignorando qualquer atualizacao feita depois na tabela regras_regulatorias.
function aplicarOverrideVistoria(resultados, mapaRegrasOficiais) {
  return resultados.map(r => {
    const regra = mapaRegrasOficiais.get(r.id);
    if (regra?.verificado_em_vistoria && r.status === "nao_aplicavel" && r.motivo_na !== "nao_existe" && r.motivo_na !== "dispensado") {
      return { ...r, motivo_na: "verificar_in_loco" };
    }
    return r;
  });
}

function calcularHashAnalise(textoPDF, tipoAmbiente, regras, textoMemorial, pdfBase64) {
  const textoConsiderado = String(textoPDF).slice(0, LIMITE_CARACTERES_PDF);
  const memorialConsiderado = textoMemorial ? String(textoMemorial).slice(0, LIMITE_CARACTERES_MEMORIAL) : "";
  const pdfVisualConsiderado = pdfBase64 ? String(pdfBase64) : "";
  const regrasOrdenadas = [...regras]
    .map(r => r.id + "|" + r.codigo + "|" + r.descricao + "|" + (r.norma_origem ?? ""))
    .sort()
    .join("\n");
  // v3: bump de versao para invalidar cache antigo, que pode conter resultados
  // gerados com o bug de mapeamento por id (ver analisarLote) — forcamos uma
  // nova chamada a IA em vez de reaproveitar um resultado potencialmente errado.
  // v4: prompt agora pede motivo_na (nao_existe/sem_dado) para filtrar pendencias reais
  // v5: prompt agora pede no_limite (conforme com margem estreita) e valores encontrados na justificativa
  // v6: nova categoria motivo_na "dispensado" (dispensa legal, ex: blindagem de raio-x); reforco dos
  // exemplos de "nao_existe" (cilindro portatil vs compressor fixo, rampa inexistente) e de sinonimos/
  // simbolos (area de manobra com Ø = diametro de rotacao); regras com verificado_em_vistoria=true agora
  // usam motivo_na "verificar_in_loco" quando falta dado, em vez de "sem_dado"
  // v7: fallback server-side — se a IA marcar nao_aplicavel sem preencher motivo_na, mas a
  // justificativa mencionar "dispensad...", classifica como "dispensado" mesmo assim (a IA às
  // vezes acerta o raciocínio no texto mas esquece de preencher o campo estruturado)
  // v8: override de verificado_em_vistoria agora cobre qualquer motivo_na (inclusive null),
  // nao so "sem_dado" — a IA as vezes marca nao_aplicavel sem preencher motivo_na nenhum
  // v9: max_tokens de 4096 para 8192 (resposta de lote grande estava sendo truncada, causando
  // JSON malformado) + retry de 3 tentativas na chamada/parse de cada lote
  // v10: prompt agora exige verificar item por item em regras com multiplos itens/exigencias na
  // mesma descricao (aplicado separadamente, branch fix/regras-compostas-multiplos-itens)
  // v11: quando o cliente manda o PDF original em base64, ele passa a ser anexado como bloco
  // "document" nativo (visao da Anthropic sobre o desenho, nao so o texto extraido) — inclui no
  // hash pra nao reaproveitar cache de uma analise que rodou so com texto
  // v12: prompt agora deixa explicito que "Sala de DM/processamento" e "Laboratorio de Protese
  // Dentaria" sao ambientes diferentes - a IA ocasionalmente (visto em ~1 de 5 execucoes)
  // confundia os dois e reprovava a Sala de DM por nao ter decantacao de gesso, arquivo de
  // requisicoes etc., exigencias que sao exclusivas de um laboratorio dedicado
  // v13: instrucao de leitura visual de porta agora descreve tambem o simbolo de "linha reta +
  // seta" (alem do arco de quarto de circulo) - projeto real (CClínica Brasil/Goiás) usava esse
  // estilo e a IA nao reconheceu como indicacao de porta de giro, mantendo NBR9050-017 como
  // pendencia mesmo com a cota e o simbolo presentes no desenho
  const base = "v13\n" + tipoAmbiente + "\n---REGRAS---\n" + regrasOrdenadas + "\n---PDF---\n" + textoConsiderado + "\n---MEMORIAL---\n" + memorialConsiderado + "\n---PDFVISUAL---\n" + pdfVisualConsiderado;
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

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// O projeto Supabase (plano gratuito) pode ficar momentaneamente lento/instavel
// apos periodos sem uso (ex: "Gateway Timeout" na primeira consulta apos hibernar).
// Tenta novamente algumas vezes com espera crescente antes de desistir.
async function buscarRegrasOficiaisComRetry(supabaseServidor, idsRegras, tentativas = 3) {
  let ultimoErro = null;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const { data, error } = await supabaseServidor
      .from("regras_regulatorias")
      .select("id, codigo, descricao, norma_origem, categoria, verificado_em_vistoria")
      .in("id", idsRegras);
    if (!error) return { data, error: null };
    ultimoErro = error;
    console.warn(`[analisar] tentativa ${tentativa}/${tentativas} falhou ao buscar regras oficiais:`, error);
    if (tentativa < tentativas) await esperar(800 * tentativa);
  }
  return { data: null, error: ultimoErro };
}

async function analisarLote(apiKey, textoPDF, tipoAmbiente, regras, numeroLote, totalLotes, textoMemorial, pdfBase64) {
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

  const temPdfVisual = !!pdfBase64;
  const instrucoesPdfVisual = temPdfVisual
    ? "LEITURA VISUAL DO PDF ANEXADO:\n" +
      "- Alem do TEXTO DO PROJETO acima (extraido automaticamente e por isso as vezes incompleto ou desorganizado), " +
      "voce recebeu o arquivo PDF original da prancha anexado nesta mensagem, com visao sobre o desenho tecnico " +
      "completo.\n" +
      "- Use a visao sobre o PDF para verificar detalhes que so aparecem graficamente, nao no texto extraido: tipo " +
      "de abertura de porta e a direcao do batente (portas de giro podem ser desenhadas de formas diferentes " +
      "dependendo do escritorio/software: como um arco de quarto de circulo saindo do batente, OU como uma linha " +
      "reta simples com uma pequena seta na ponta indicando o sentido de abertura - repare no sentido da seta ou " +
      "do arco em relacao a parede pra saber se abre pra dentro ou pra fora do ambiente; ausencia de arco/seta " +
      "e presenca de trilho/friso paralelo a parede geralmente indica porta de correr); presenca de " +
      "tela/protecao contra vetores em aberturas externas; cotas de rampas, larguras e outras medidas desenhadas " +
      "mas nao escritas como texto; simbolos de instalacao hidraulica/eletrica (pontos de agua, registros, " +
      "tomadas) proximos a moveis e equipamentos.\n" +
      "- Ao usar uma informacao lida visualmente do PDF que nao aparece no texto extraido, diga isso na " +
      "justificativa (ex: \"Desenho mostra arco de abertura de porta indicando porta de giro, nao correr\"), pra " +
      "deixar claro que veio da leitura do desenho.\n" +
      "- Se uma medida so puder ser estimada por comparacao de escala no desenho (sem cota numerica escrita nem no " +
      "desenho nem no texto), seja conservador: so marque conforme se a diferenca for grande o suficiente pra ter " +
      "certeza visual; na duvida, marque sem_dado em vez de arriscar uma leitura de escala imprecisa.\n\n"
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
    instrucoesPdfVisual +
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
    "DISTINCAO ENTRE AMBIENTES PARECIDOS (NAO CONFUNDA):\n" +
    "- \"Sala de Processamento de Dispositivos Medicos\" (tambem chamada Sala de DM, ou CME) e \"Laboratorio de " +
    "Protese Dentaria\" sao ambientes DIFERENTES, com propositos distintos, mesmo compartilhando elementos como " +
    "pia e bancada.\n" +
    "- Regras que mencionam explicitamente \"laboratorio\" (ex: bancada de trabalho, pia com decantacao de gesso, " +
    "arquivo de requisicoes de servico) referem-se exclusivamente a um Laboratorio de Protese Dentaria dedicado. " +
    "NUNCA avalie essas regras contra a Sala de DM/processamento/CME, mesmo que o projeto nao tenha um " +
    "laboratorio separado.\n" +
    "- Se o projeto nao tem um ambiente claramente identificado como \"Laboratorio de Protese\" (nomeado assim na " +
    "planta ou no memorial), marque essas regras como nao_aplicavel com motivo_na \"nao_existe\" - nunca como " +
    "nao_conforme por comparacao com outro ambiente que exista mas nao seja o laboratorio.\n\n" +
    "INSTRUCOES GERAIS:\n" +
    "- Seja consistente e literal: baseie-se apenas no que esta explicitamente escrito nos textos fornecidos, sem " +
    "suposicoes ou inferencias alem do que foi informado\n" +
    "- OBRIGATORIO: antes de marcar qualquer regra como nao_aplicavel por falta de dado (sem_dado), releia o " +
    "TEXTO DO PROJETO procurando especificamente por termos equivalentes ou sinonimos do que a regra pede — " +
    "nao conclua que falta informacao so porque o termo exato da regra nao aparece literalmente no texto. " +
    "Exemplos concretos (aplique esse mesmo raciocinio a qualquer termo parecido, mesmo que nao esteja " +
    "listado aqui):\n" +
    "  * \"abertura telada\"/\"tela\" equivale a protecao contra vetores/insetos/roedores\n" +
    "  * \"Ø\" seguido de um numero (ex: \"Ø1,5\") indica diametro — se aparecer perto de um rotulo como " +
    "\"area de manobra\" ou \"transferencias\", isso E a area/diametro de rotacao de cadeira de rodas exigida " +
    "por regras de acessibilidade; use esse valor, nao marque sem_dado\n" +
    "  * \"resíduo comum\" equivale a \"resíduo do Grupo D\"\n" +
    "- NAO invente ou reutilize siglas/abreviacoes que nao estejam escritas na propria descricao da regra sendo " +
    "avaliada (ex: nunca abrevie \"Consultorio(s) Odontologico(s) Coletivo(s)\" como \"CCO\" - essa sigla ja " +
    "significa \"Centro Cirurgico Odontologico\" em outras regras deste mesmo relatorio; escreva os nomes de " +
    "ambientes por extenso para evitar confundir o leitor)\n" +
    "- TODA regra, inclusive as marcadas como nao_aplicavel, precisa de uma justificativa objetiva de 1 frase " +
    "explicando o motivo (nunca deixe justificativa vazia ou generica)\n" +
    "- Para toda regra com status nao_aplicavel, inclua tambem um campo \"motivo_na\" com um destes tres valores " +
    "exatos:\n" +
    "  * \"nao_existe\" quando o elemento/ambiente da regra simplesmente NAO existe neste projeto e nunca " +
    "existiria (ex: piscina, playground, auditorio, consultorio coletivo quando o projeto so tem individuais, " +
    "centro cirurgico quando o projeto nao tem um) — ou seja, nenhuma informacao adicional mudaria a resposta. " +
    "Isso TAMBEM vale quando o projeto usa uma solucao diferente e incompativel com o que a regra pede (ex: a " +
    "regra fala de cilindro portatil de gas, mas o projeto so tem abrigo de compressor fixo — o cilindro " +
    "portatil nao existe nesse projeto; a regra fala de rampa, mas o projeto nao indica nenhuma rampa nem " +
    "desnivel de piso a vencer — a rampa nao existe nesse projeto). Nesses casos NAO e \"sem_dado\": o projeto " +
    "ja deixou claro, por omissao, que optou por outra solucao ou que aquele elemento nao se aplica\n" +
    "  * \"sem_dado\" quando o elemento/ambiente EXISTE no projeto mas falta uma medida ou especificacao pontual " +
    "para julgar a regra (ex: existe balcao de atendimento mas a altura nao foi informada; existe estacionamento " +
    "mas o numero de vagas PCD nao foi informado) — aqui a informacao poderia completar a analise se fosse " +
    "fornecida\n" +
    "  * \"dispensado\" quando o projeto informa uma caracteristica especifica que, pela propria norma, isenta " +
    "aquele elemento do requisito (dispensa legal explicita, nao falta de dado) — ex: RDC-1002/2025 dispensa " +
    "projeto de blindagem para consultorio odontologico individual Classe I/II com radiologia intraoral; use " +
    "\"dispensado\" apenas quando o proprio texto do projeto informar a caracteristica que da direito a essa " +
    "dispensa (ex: a classe/tipo do equipamento) — se essa caracteristica nao estiver informada, use \"sem_dado\" " +
    "em vez de presumir a dispensa\n" +
    "  * Na duvida entre as tres, use \"sem_dado\" (e melhor mostrar uma pendencia a mais do que esconder um " +
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

  // Tenta a chamada + parse do JSON até 3 vezes. Cobre dois casos: um erro passageiro da API
  // (rede, sobrecarga) e um JSON malformado/truncado na resposta (a IA ocasionalmente corta a
  // resposta ou erra a formatação numa saída longa) — pedir de novo geralmente resolve, já que
  // é um problema de geração, não algo determinístico que vai se repetir sempre.
  let bruto = null;
  let ultimoErroLote = null;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      // Quando ha pdfBase64, o PDF original vai anexado como bloco "document" (visao nativa da
      // Anthropic sobre PDF: le texto E desenho, sem precisar de OCR/pipeline separado). Marcado
      // com cache_control porque o MESMO arquivo se repete em todo lote desta analise (ate 3
      // lotes) — sem cache, o custo de imagem seria pago 3x pelo mesmo conteudo. So funciona
      // acima de um minimo de tokens (2048 pros modelos Haiku); abaixo disso e so um cache miss
      // silencioso, sem quebrar nada.
      const content = temPdfVisual
        ? [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 }, cache_control: { type: "ephemeral" } },
            { type: "text", text: prompt },
          ]
        : prompt;
      const response = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 8192,
          temperature: 0,
          system: "Especialista ANVISA/ABNT. Responda SEMPRE com JSON puro valido sem markdown, identificando cada regra pelo campo indice numerico (nunca por texto/id). Atenha-se estritamente ao escopo do ambiente informado pelo usuario, ignorando outras areas do edificio mencionadas apenas como contexto de implantacao. Quando houver memorial descritivo, use-o como fonte complementar a planta e sinalize divergencias entre os dois documentos.",
          messages: [{ role: "user", content }],
        }),
      });
      if (!response.ok) {
        const erro = await response.text();
        throw new Error("Erro API Anthropic " + response.status + " lote " + numeroLote + ": " + erro.slice(0, 200));
      }
      const data = await response.json();
      const conteudo = data.content?.[0]?.text ?? "";
      if (!conteudo) throw new Error("Lote " + numeroLote + ": resposta vazia");
      bruto = extrairJSON(conteudo);
      break;
    } catch (erroTentativa) {
      ultimoErroLote = erroTentativa;
      console.warn(`[analisar] lote ${numeroLote}: tentativa ${tentativa}/3 falhou: ${erroTentativa.message}`);
      if (tentativa < 3) await esperar(500 * tentativa);
    }
  }
  if (!bruto) throw ultimoErroLote;

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
      // Regras marcadas como verificado_em_vistoria (ex: material de construcao e acesso do abrigo
      // externo de residuos) sao conferidas pelo fiscal presencialmente, nao a partir do papel do
      // projeto. Se a IA nao achou o dado no texto (sem_dado), essa ausencia no papel e esperada e
      // nao deve virar pendencia visivel no relatorio — reclassifica para "verificar_in_loco", que o
      // front-end filtra do mesmo jeito que ja filtra "nao_existe". Isso e deterministico (baseado no
      // cadastro da regra, nao em julgamento da IA) para nao depender da IA lembrar dessa excecao.
      // Corrige de cara um status invalido (ex: "sem_dado" no lugar de "nao_aplicavel") antes
      // de qualquer checagem que dependa de status === "nao_aplicavel" — ver normalizarStatus.
      let status = r.status;
      let motivoNa = r.motivo_na ?? null;
      if (!STATUS_VALIDOS.has(status)) {
        motivoNa = motivoNa ?? status;
        status = "nao_aplicavel";
      }
      // Rede de segurança: às vezes a IA acerta o raciocínio na justificativa (menciona
      // "dispensado"/"dispensada") mas esquece de preencher o campo motivo_na correspondente
      // (fica null), fazendo a pendência vazar pro relatório mesmo com o texto já explicando a
      // dispensa. Se a justificativa cita dispensa e a IA não classificou o motivo, usa o
      // próprio texto como sinal em vez de depender só do campo estruturado.
      if (status === "nao_aplicavel" && !motivoNa && typeof r.justificativa === "string" && /dispensad/i.test(r.justificativa)) {
        motivoNa = "dispensado";
      }
      // Regras marcadas como verificado_em_vistoria (ex: material de construcao e acesso do abrigo
      // externo de residuos) sao conferidas pelo fiscal presencialmente, nao a partir do papel do
      // projeto. Qualquer status nao_aplicavel aqui vira "verificar_in_loco" (menos quando a IA ja
      // identificou nao_existe/dispensado, que sao classificacoes legitimas por si so) —
      // propositalmente NAO exige motivo_na === "sem_dado": a IA as vezes marca nao_aplicavel sem
      // preencher motivo_na nenhum (fica null), e mesmo assim isso precisa ser tratado como
      // verificar_in_loco, ja que essa e uma caracteristica da REGRA (metadado conhecido de
      // antemao), nao um julgamento que dependa da IA acertar um campo especifico.
      if (regraCorrespondente.verificado_em_vistoria && status === "nao_aplicavel" && motivoNa !== "nao_existe" && motivoNa !== "dispensado") {
        motivoNa = "verificar_in_loco";
      }
      return { id: regraCorrespondente.id, status, justificativa: r.justificativa, sugestao: r.sugestao ?? null, motivo_na: motivoNa, no_limite: r.no_limite === true };
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
  const { textoPDF, tipoAmbiente, regras: regrasRecebidas, textoMemorial, pdfBase64: pdfBase64Recebido } = req.body ?? {};
  const LIMITE_REGRAS = 150;
  if (Array.isArray(regrasRecebidas) && regrasRecebidas.length > LIMITE_REGRAS) {
    return res.status(400).json({ error: `Numero de regras excede o limite de ${LIMITE_REGRAS} por analise.` });
  }
  if (!textoPDF || !tipoAmbiente || !regrasRecebidas || !Array.isArray(regrasRecebidas)) {
    return res.status(400).json({ error: "Parametros obrigatorios ausentes." });
  }
  // Leitura visual do PDF (bloco "document" nativo) e opcional e "best-effort": se o arquivo em
  // base64 vier grande demais, so ignoramos a visao e seguimos com o texto extraido de sempre -
  // nunca falha a analise inteira por causa de um recurso adicional. O limite de ~4MB de base64
  // (~3MB de arquivo original) da margem segura abaixo do limite de payload de functions do Vercel.
  const LIMITE_PDF_BASE64 = 4 * 1024 * 1024;
  const pdfBase64 = typeof pdfBase64Recebido === "string" && pdfBase64Recebido.length > 0 && pdfBase64Recebido.length <= LIMITE_PDF_BASE64
    ? pdfBase64Recebido
    : null;
  if (typeof pdfBase64Recebido === "string" && pdfBase64Recebido.length > LIMITE_PDF_BASE64) {
    console.warn("[analisar] pdfBase64 excede o limite (" + pdfBase64Recebido.length + " bytes) - seguindo sem leitura visual.");
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
  const { data: regrasOficiais, error: erroRegras } = await buscarRegrasOficiaisComRetry(supabaseServidor, idsRegras);
  if (erroRegras) {
    console.error("[analisar] erro ao buscar regras oficiais apos varias tentativas:", erroRegras);
    return res.status(500).json({ error: "Erro ao validar regras. O banco de dados pode estar temporariamente instavel - tente novamente em instantes." });
  }
  const mapaRegrasOficiais = new Map((regrasOficiais ?? []).map(r => [r.id, r]));
  const regras = idsRegras.map(id => mapaRegrasOficiais.get(id)).filter(Boolean);
  if (regras.length === 0) {
    return res.status(400).json({ error: "Nenhuma regra valida encontrada para os IDs informados." });
  }

  const supabase = obterClienteSupabase();
  const hash = calcularHashAnalise(textoPDF, tipoAmbiente, regras, textoMemorial, pdfBase64);

  try {
    if (supabase) {
      const { data: cacheHit, error: erroCache } = await supabase
        .from(TABELA_CACHE)
        .select("resultados, resumo")
        .eq("hash", hash)
        .maybeSingle();
      if (erroCache) console.error("[cache] Erro ao consultar cache:", JSON.stringify(erroCache));
      if (cacheHit) {
        const resultadosNormalizados = normalizarStatus(cacheHit.resultados);
        const resultadosAtualizados = aplicarOverrideVistoria(resultadosNormalizados, mapaRegrasOficiais);
        return res.status(200).json({ resultados: resultadosAtualizados, resumo: cacheHit.resumo, deCache: true });
      }
    }

    const lotes = [];
    for (let i = 0; i < regras.length; i += TAMANHO_LOTE) lotes.push(regras.slice(i, i + TAMANHO_LOTE));
    const todosResultados = [];
    let ultimoResumo = "";
    for (let i = 0; i < lotes.length; i++) {
      const resultado = await analisarLote(apiKey, textoPDF, tipoAmbiente, lotes[i], i + 1, lotes.length, textoMemorial, pdfBase64);
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
