// A chave fica APENAS no Vercel (VITE_OPENROUTER_API_KEY) — nunca no código
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-exp:free";

export interface ResultadoRegra {
  id: string;
  status: "conforme" | "nao_conforme" | "nao_aplicavel";
  justificativa: string;
}

export interface RespostaAnalise {
  resultados: ResultadoRegra[];
  resumo: string;
}

export async function analisarProjetoComIA(
  textoPDF: string,
  tipoAmbiente: string,
  regras: Array<{ id: string; codigo: string; descricao: string; norma_origem: string | null }>
): Promise<RespostaAnalise> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string;
  if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY não configurada no Vercel");

  const listaRegras = regras.map(r =>
    `- ID: ${r.id} | Código: ${r.codigo} | Norma: ${r.norma_origem ?? "—"} | Descrição: ${r.descricao}`
  ).join("\n");

  const prompt = `Você é especialista em vigilância sanitária e normas ANVISA/ABNT.

Analise o projeto arquitetônico abaixo para: **${tipoAmbiente}**

TEXTO DO PROJETO:
${textoPDF.slice(0, 8000)}

REGRAS A VERIFICAR:
${listaRegras}

Responda APENAS com JSON válido, sem texto adicional:
{
  "resultados": [
    { "id": "uuid", "status": "conforme" | "nao_conforme" | "nao_aplicavel", "justificativa": "breve explicação" }
  ],
  "resumo": "resumo em 2-3 frases"
}

Marque "conforme" só se o projeto mencionar explicitamente o atendimento. Se não houver informação suficiente, marque "nao_aplicavel".`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://visacheck-go.vercel.app",
      "X-Title": "VISAcheck GO",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro OpenRouter: ${response.status}`);
  }

  const data = await response.json();
  const conteudo = data.choices?.[0]?.message?.content ?? "";
  const jsonLimpo = conteudo.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(jsonLimpo) as RespostaAnalise;
  } catch {
    throw new Error(`Resposta inválida da IA: ${conteudo.slice(0, 200)}`);
  }
}
