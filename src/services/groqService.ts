const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface RegraRegulatoria {
  id: string;
  codigo: string;
  norma_origem: string;
  descricao: string;
  categoria: string;
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
        if ((c >= 32 && c <= 126) || c === 10 || c === 13)
          texto += String.fromCharCode(c);
      }
        const linhas = texto
        .split(/\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l.length > 2)
        .filter((l) => /[a-zA-ZÀ-ú=²%,./]/.test(l))
        .slice(0, 500)
        .join("\n");
      resolve(linhas || "PDF sem texto legivel.");
    };
    reader.readAsArrayBuffer(arquivo);
  });
}

async function analisarLote(
  textoPDF: string,
  lote: RegraRegulatoria[]
): Promise<ResultadoRegra[]> {
  if (!OPENROUTER_API_KEY) return [];
  const listaRegras = lote.map((r) => `[${r.codigo}] ${r.descricao}`).join("\n");
  const prompt = `Voce e um auditor de normas regulatorias de estabelecimentos de saude no Brasil. Seja criterioso e justo: use nao_conforme APENAS quando o texto do projeto claramente contradiz a regra. Se o texto nao menciona a regra ou nao ha informacao suficiente para avaliar, use nao_aplicavel. Use conforme quando o texto confirma ou é compativel com a regra.
Analise o texto do projeto arquitetonico e avalie CADA UMA das regras abaixo, na ordem.
Responda APENAS com JSON valido, sem markdown:
[{"codigo":"COD1","status":"conforme","justificativa":"motivo curto"}]
Use status: conforme quando confirmado, nao_conforme APENAS quando claramente violado, nao_aplicavel quando sem informacao suficiente. O array deve ter exatamente ${lote.length} itens, na mesma ordem das regras abaixo. Nao escreva nada antes ou depois do array.

TEXTO DO PROJETO:
${textoPDF.slice(0, 3000)}

REGRAS A AVALIAR:
${listaRegras}`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://visacheck-go.vercel.app",
        "X-Title": "VISAcheck GO",
      },
      body: JSON.stringify({
        model: "google/gemma-3-4b-it:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const conteudo = data.choices?.[0]?.message?.content || "";
    const jsonLimpo = conteudo.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonLimpo);
    return (Array.isArray(parsed) ? parsed : (parsed.resultados || [parsed])).map((r: any) => {
      const regra = lote.find((rg) => rg.codigo === r.codigo);
      return {
        regra_id: regra?.id || r.codigo,
        codigo: r.codigo,
        descricao: regra?.descricao || r.codigo,
        categoria: regra?.categoria || "Geral",
        status: r.status || "nao_aplicavel",
        justificativa: r.justificativa || "",
      };
    });
  } catch {
    return [];
  }
}

export async function analisarComGroq(
  textoPDF: string,
  regras: RegraRegulatoria[]
): Promise<ResultadoAnalise> {
  if (!OPENROUTER_API_KEY) {
    return {
      resultados: [],
      resumo: "",
      score_geral: 0,
      erro: "Chave VITE_OPENROUTER_API_KEY nao configurada no Vercel.",
    };
  }

  const TAMANHO_LOTE = 15;
  const todosResultados: ResultadoRegra[] = [];

  for (let i = 0; i < regras.length; i += TAMANHO_LOTE) {
    const lote = regras.slice(i, i + TAMANHO_LOTE);
    const resultadosLote = await analisarLote(textoPDF, lote);
    todosResultados.push(...resultadosLote);
    if (i + TAMANHO_LOTE < regras.length) {
      await new Promise((resolve) => setTimeout(resolve, 6000));
    }
  }

  const aplicaveis = todosResultados.filter((r) => r.status !== "nao_aplicavel");
  const conformes = aplicaveis.filter((r) => r.status === "conforme");
  const score =
    aplicaveis.length > 0
      ? Math.round((conformes.length / aplicaveis.length) * 100)
      : 0;
  const resumo = `Analisadas ${todosResultados.length} regras regulatorias. Score de conformidade: ${score}%. ${conformes.length} conformes e ${aplicaveis.length - conformes.length} nao conformes identificadas.`;

  return { resultados: todosResultados, resumo, score_geral: score };
}
