import type {
  ChecklistItem,
  Parecer,
  ParecerStatus,
  RegraRegulatoria,
  ResultadoValidacao,
  ScoreRegulatorio,
} from "../types";

function severidadeRank(r: ResultadoValidacao): number {
  return { informativo: 0, atencao: 1, critico: 2, bloqueante: 3 }[r.severidade_efetiva];
}

function classificar(resultados: ResultadoValidacao[]): {
  status: ParecerStatus;
  risco: Parecer["risco_sanitario"];
} {
  const bloqueantes = resultados.filter(
    (r) => r.status !== "conforme" && r.severidade_efetiva === "bloqueante",
  ).length;
  const criticos = resultados.filter(
    (r) => r.status !== "conforme" && r.severidade_efetiva === "critico",
  ).length;

  if (bloqueantes > 0) return { status: "reprovado", risco: "critico" };
  if (criticos > 3) return { status: "revisao_necessaria", risco: "alto" };
  if (criticos > 0) return { status: "parcialmente_conforme", risco: "moderado" };
  return { status: "aprovado", risco: "baixo" };
}

export function gerarParecer(
  resultados: ResultadoValidacao[],
  regras: RegraRegulatoria[],
  score: ScoreRegulatorio,
  checklist: ChecklistItem[],
): Parecer {
  const { status, risco } = classificar(resultados);
  const regrasMap = new Map(regras.map((r) => [r.id, r]));
  const principais = resultados
    .filter((r) => r.status !== "conforme")
    .sort((a, b) => severidadeRank(b) - severidadeRank(a))
    .slice(0, 3)
    .map((r) => regrasMap.get(r.regra_id)?.nome ?? r.regra_id);

  const impactos: Record<ParecerStatus, string> = {
    aprovado: "Projeto apto à aprovação sanitária.",
    parcialmente_conforme: "Projeto aprovável com ajustes pontuais em itens críticos.",
    revisao_necessaria: "Projeto requer revisão técnica antes do protocolo regulatório.",
    reprovado: "Projeto contém inconformidades bloqueantes — não passível de aprovação.",
  };

  const resumo =
    `Score geral ${score.score_geral}/100. ` +
    `Acessibilidade ${score.score_acessibilidade}/100, ` +
    `Fluxo sanitário ${score.score_fluxo}/100. ` +
    (principais.length
      ? `Principais não conformidades: ${principais.join("; ")}.`
      : "Nenhuma não conformidade relevante identificada.");

  return {
    status_final: status,
    risco_sanitario: risco,
    impacto_regulatorio: impactos[status],
    resumo_executivo: resumo,
    checklist,
  };
}