const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

export async function extrairTextoPDF(arquivo: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      let texto = "";
      for (let i = 0; i < bytes.length; i++) {
        const c = bytes[i];
        if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
          texto += String.fromCharCode(c);
        }
      }
      const linhasUteis = texto
        .split(/\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l.length > 5 && !/^[\d\s.()]+$/.test(l))
        .slice(0, 80)
        .join("\n");
      resolve(linhasUteis || "PDF sem texto legivel extraido.");
    };
    reader.readAsArrayBuffer(arquivo);
  });
}

export async function analisarComGroq(
  textoPDF: string,
  regras: RegraRegulatoria[]
): Promise<ResultadoAnalise> {
  if (!GEMINI_API_KEY) {
    return { resultados: [], resumo: "", score_geral: 0, erro: "Chave VITE_GEMINI_API_KEY nao configurada no Vercel." };
  }

  const lote = regras.slice(0, 40);
  const listaRegras = lote.map((r) => `[${r.codigo}] ${r.categoria}: ${r.descricao}`).join("\n");

  const prompt = `Voce e um auditor especialista em normas regulatorias de estabelecimentos de saude no Brasil (NBR 9050, RDC 1.002/2024, RDC 50).

Analise o texto abaixo extraido de um projeto arquitetonico e avalie cada regra regulatoria.

TEXTO DO PROJETO:
${textoPDF.slice(0, 2000)}

REGRAS A AVALIAR:
${listaRegras}

Responda APENAS com JSON valido neste formato exato (sem markdown, sem explicacoes fora do JSON):
{"resultados":[{"codigo":"NBR9050-001","status":"conforme","justificativa":"explicacao curta"}],"resumo":"Resumo em 2 frases"}

Use status: conforme, nao_conforme, ou nao_aplicavel. Avalie TODAS as ${lote.length} regras.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      }),
    });

    if (!response.ok) {
      const erro = await response.text();
      return { resultados: [], resumo: "", score_geral: 0, erro: `Gemini API erro ${response.status}: ${erro}` };
    }

    const data = await response.json();
    const conteudo = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: { resultados: any[]; resumo: string };
    try {
      const jsonLimpo = conteudo.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(jsonLimpo);
    } catch {
      return { resultados: [], resumo: "", score_geral: 0, erro: "Gemini retornou resposta invalida. Tente novamente." };
    }

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
    const score = aplicaveis.length > 0 ? Math.round((conformes.length / aplicaveis.length) * 100) : 0;

    return { resultados, resumo: parsed.resumo || "", score_geral: score };
  } catch (err: any) {
    return { resultados: [], resumo: "", score_geral: 0, erro: `Erro de conexao: ${err.message}` };
  }
}