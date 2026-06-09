const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface RegraRegulatoria {
  id: string; codigo: string; norma_origem: string;
  descricao: string; categoria: string;
  valor_minimo?: number; unidade?: string;
}
export interface ResultadoRegra {
  regra_id: string; codigo: string; descricao: string; categoria: string;
  status: "conforme" | "nao_conforme" | "nao_aplicavel"; justificativa: string;
}
export interface ResultadoAnalise {
  resultados: ResultadoRegra[]; resumo: string; score_geral: number; erro?: string;
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
        if ((c >= 32 && c <= 126) || c === 10 || c === 13) texto += String.fromCharCode(c);
      }
      const linhas = texto.split(/\n|\r/).map((l) => l.trim())
        .filter((l) => l.length > 5 && !/^[\d\s.()]+$/.test(l)).slice(0, 50).join("\n");
      resolve(linhas || "PDF sem texto legivel.");
    };
    reader.readAsArrayBuffer(arquivo);
  });
}

async function analisarLote(textoPDF: string, lote: RegraRegulatoria[]): Promise<ResultadoRegra[]> {
  if (!GEMINI_API_KEY) return [];
  const listaRegras = lote.map((r) => `[${r.codigo}] ${r.descricao}`).join("\n");
  const prompt = `Auditor de normas regulatorias de saude no Brasil. Analise o projeto e avalie as regras.
Responda APENAS JSON: {"resultados":[{"codigo":"X","status":"conforme","justificativa":"texto curto"}]}
Status: conforme, nao_conforme, nao_aplicavel.
PROJETO: ${textoPDF.slice(0, 800)}
REGRAS: ${listaRegras}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const conteudo = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonLimpo = conteudo.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonLimpo);
    return parsed.resultados.map((r: any) => {
      const regra = lote.find((rg) => rg.codigo === r.codigo);
      return {
        regra_id: regra?.id || r.codigo, codigo: r.codigo,
        descricao: regra?.descricao || r.codigo, categoria: regra?.categoria || "Geral",
        status: r.status || "nao_aplicavel", justificativa: r.justificativa || "",
      };
    });
  } catch { return []; }
}

export async function analisarComGroq(textoPDF: string, regras: RegraRegulatoria[]): Promise<ResultadoAnalise> {
  if (!GEMINI_API_KEY) {
    return { resultados: [], resumo: "", score_geral: 0, erro: "Chave VITE_GEMINI_API_KEY nao configurada." };
  }

  const TAMANHO_LOTE = 15;
  const todosResultados: ResultadoRegra[] = [];

  for (let i = 0; i < regras.length; i += TAMANHO_LOTE) {
    const lote = regras.slice(i, i + TAMANHO_LOTE);
    const resultadosLote = await analisarLote(textoPDF, lote);
    todosResultados.push(...resultadosLote);
    if (i + TAMANHO_LOTE < regras.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const aplicaveis = todosResultados.filter((r) => r.status !== "nao_aplicavel");
  const conformes = aplicaveis.filter((r) => r.status === "conforme");
  const score = aplicaveis.length > 0 ? Math.round((conformes.length / aplicaveis.length) * 100) : 0;
  const resumo = `Analisadas ${todosResultados.length} regras. Score de conformidade: ${score}%. ${conformes.length} conformes, ${aplicaveis.length - conformes.length} nao conformes.`;

  return { resultados: todosResultados, resumo, score_geral: score };
}