// Integração com API da Anthropic via Edge Function proxy — VISAcheck GO
//
// Por que um proxy?
// A API da Anthropic bloqueia chamadas diretas do navegador (CORS).
// O frontend chama /api/analisar (Edge Function no Vercel), que repassa
// para api.anthropic.com no servidor — sem expor a chave e sem CORS.

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

  const response = await fetch("/api/analisar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ textoPDF, tipoAmbiente, regras }),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(erro.error ?? `Erro ${response.status} ao chamar /api/analisar`);
  }

  const data = await response.json();

  if (!data.resultados || !data.resumo) {
    throw new Error(`Resposta inesperada do servidor: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return data as RespostaAnalise;
}
