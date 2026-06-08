const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export interface RegraRegulatoria {
  id: string; codigo: string; norma_origem: string;
  descricao: string; categoria: string;
  valor_minimo?: number; unidade?: string;
}
export interface ResultadoRegra {
  regra_id: string; codigo: string; descricao: string;
  categoria: string; status: "conforme" | "nao_conforme" | "nao_aplicavel";
  justificativa: string;
}
export interface ResultadoAnalise {
  resultados: ResultadoRegra[]; resumo: string;
  score_geral: number; erro?: string;
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
      const linhas = texto.split(/\n|\r/).map(l => l.trim())
        .filter(l => l.length > 5 && !/^[\d\s.()]+$/.test(l)).slice(0, 60).join("\n");
      resolve(linhas || "PDF sem texto legivel.");
    };
    reader.readAsArrayBuffer(arquivo);
  });
}

export async function analisarComGroq(textoPDF: string, regras: RegraRegulatoria[]): Promise<ResultadoAnalise> {
  const lote = regras.slice(0, 35);
  const listaRegras = lote.map(r => `[${r.codigo}] ${r.categoria}: ${r.descricao}`).join("\n");
  const prompt = `Voce e um auditor de normas regulatorias de saude no Brasil (NBR 9050, RDC 50).
Analise o texto do projeto e avalie cada regra. Responda APENAS JSON valido:
{"resultados":[{"codigo":"X","status":"conforme","justificativa":"texto"}],"resumo":"2 frases"}
Status: conforme, nao_conforme, nao_aplicavel.

TEXTO: ${textoPDF.slice(0, 1500)}

REGRAS: ${listaRegras}`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }]
      }),
    });
    if (!response.ok) {
      const erro = await response.text();
      return { resultados: [], resumo: "", score_geral: 0, erro: `Claude API erro ${response.status}: ${erro}` };
    }
    const data = await response.json();
    const conteudo = data.content?.[0]?.text || "";
    let parsed: { resultados: any[]; resumo: string };
    try {
      parsed = JSON.parse(conteudo.replace(/```json|```/g, "").trim());
    } catch {
      return { resultados: [], resumo: "", score_geral: 0, erro: "Resposta invalida da API." };
    }
    const resultados: ResultadoRegra[] = parsed.resultados.map((r: any) => {
      const regra = regras.find(rg => rg.codigo === r.codigo);
      return { regra_id: regra?.id || r.codigo, codigo: r.codigo,
        descricao: regra?.descricao || r.codigo, categoria: regra?.categoria || "Geral",
        status: r.status || "nao_aplicavel", justificativa: r.justificativa || "" };
    });
    const aplicaveis = resultados.filter(r => r.status !== "nao_aplicavel");
    const conformes = aplicaveis.filter(r => r.status === "conforme");
    const score = aplicaveis.length > 0 ? Math.round((conformes.length / aplicaveis.length) * 100) : 0;
    return { resultados, resumo: parsed.resumo || "", score_geral: score };
  } catch (err: any) {
    return { resultados: [], resumo: "", score_geral: 0, erro: `Erro: ${err.message}` };
  }
}