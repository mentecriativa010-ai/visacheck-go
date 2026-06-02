// ============================================================
// groqService.ts — Análise automática de PDF via Groq (grátis)
// Coloque este arquivo em: src/services/groqService.ts
// ============================================================

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Pegue sua chave grátis em: https://console.groq.com
// Depois adicione no .env: VITE_GROQ_API_KEY=gsk_xxxxx
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export interface RegraRegulatoria {
  id: string;
  codigo: string;
  norma_origem: string;
  descricao: string;
  categoria: string;
  valor_minimo?: number;
  unidade?: string;
}

export interface ResultadoRegra {
  regra_id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  status: "conforme" | "nao_conforme" | "nao_aplicavel";
  justificativa: string;
}

export interface ResultadoAnalise {
  resultados: ResultadoRegra[];
  resumo: string;
  score_geral: number;
  erro?: string;
}

// ----------------------------------------------------------------
// Extrai o texto do PDF usando FileReader (sem biblioteca externa)
// ----------------------------------------------------------------
export async function extrairTextoPDF(arquivo: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Converte o ArrayBuffer para string e tenta extrair texto legível
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      let texto = "";
      for (let i = 0; i < bytes.length; i++) {
        const c = bytes[i];
        // Captura caracteres ASCII legíveis
        if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
          texto += String.fromCharCode(c);
        }
      }
      // Filtra linhas com conteúdo real (>5 chars)
      const linhasUteis = texto
        .split(/\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l.length > 5 && !/^[\d\s.()]+$/.test(l))
        .slice(0, 300) // Limita para não estourar tokens
        .join("\n");

      resolve(linhasUteis || "PDF sem texto legível extraído.");
    };
    reader.readAsArrayBuffer(arquivo);
  });
}

// ----------------------------------------------------------------
// Analisa o texto extraído cruzando com as regras via Groq
// ----------------------------------------------------------------
export async function analisarComGroq(
  textoPDF: string,
  regras: RegraRegulatoria[]
): Promise<ResultadoAnalise> {
  if (!GROQ_API_KEY) {
    return {
      resultados: [],
      resumo: "",
      score_geral: 0,
      erro: "Chave VITE_GROQ_API_KEY não configurada no .env",
    };
  }

  // Monta lista compacta de regras para o prompt
  const listaRegras = regras
    .map(
      (r) =>
        `[${r.codigo}] ${r.categoria}: ${r.descricao}${r.valor_minimo ? ` (mínimo: ${r.valor_minimo}${r.unidade || ""})` : ""}`
    )
    .join("\n");

  const prompt = `Você é um auditor especialista em normas regulatórias de estabelecimentos de saúde no Brasil (NBR 9050, RDC 1.002/2024, RDC 50).

Analise o texto abaixo extraído de um projeto arquitetônico e avalie cada regra regulatória.

TEXTO DO PROJETO:
${textoPDF.slice(0, 6000)}

REGRAS A AVALIAR:
${listaRegras}

Responda APENAS com JSON válido neste formato exato (sem markdown, sem explicações fora do JSON):
{
  "resultados": [
    {
      "codigo": "NBR9050-001",
      "status": "conforme" | "nao_conforme" | "nao_aplicavel",
      "justificativa": "explicação curta de 1 linha"
    }
  ],
  "resumo": "Resumo executivo da análise em 2-3 frases"
}

Regras importantes:
- Use "nao_aplicavel" quando a regra não se aplica ao tipo de estabelecimento
- Use "conforme" quando o projeto atende claramente a norma
- Use "nao_conforme" quando há evidência de violação ou dado insuficiente para confirmar conformidade
- Avalie TODAS as ${regras.length} regras listadas`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const erro = await response.text();
      return {
        resultados: [],
        resumo: "",
        score_geral: 0,
        erro: `Groq API erro ${response.status}: ${erro}`,
      };
    }

    const data = await response.json();
    const conteudo = data.choices?.[0]?.message?.content || "";

    // Parse do JSON retornado
    let parsed: { resultados: any[]; resumo: string };
    try {
      const jsonLimpo = conteudo.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(jsonLimpo);
    } catch {
      return {
        resultados: [],
        resumo: "",
        score_geral: 0,
        erro: "Groq retornou resposta inválida. Tente novamente.",
      };
    }

    // Mapeia resultados para o formato completo
    const resultados: ResultadoRegra[] = parsed.resultados.map((r: any) => {
      const regra = regras.find((rg) => rg.codigo === r.codigo);
      return {
        regra_id: regra?.id || r.codigo,
        codigo: r.codigo,
        descricao: regra?.descricao || r.codigo,
        categoria: regra?.categoria || "Geral",
        status: r.status || "nao_aplicavel",
        justificativa: r.justificativa || "",
      };
    });

    const aplicaveis = resultados.filter((r) => r.status !== "nao_aplicavel");
    const conformes = aplicaveis.filter((r) => r.status === "conforme");
    const score =
      aplicaveis.length > 0
        ? Math.round((conformes.length / aplicaveis.length) * 100)
        : 0;

    return {
      resultados,
      resumo: parsed.resumo || "",
      score_geral: score,
    };
  } catch (err: any) {
    return {
      resultados: [],
      resumo: "",
      score_geral: 0,
      erro: `Erro de conexão: ${err.message}`,
    };
  }
}
