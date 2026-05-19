import type { ChecklistItem, RegraRegulatoria, ResultadoValidacao } from "../types";
import { NORMAS } from "../catalog/normas";

export function gerarChecklist(
  resultados: ResultadoValidacao[],
  regras: RegraRegulatoria[],
): ChecklistItem[] {
  const regrasMap = new Map(regras.map((r) => [r.id, r]));
  const buckets: Record<string, ResultadoValidacao[]> = {};

  for (const r of resultados) {
    const regra = regrasMap.get(r.regra_id);
    if (!regra) continue;
    (buckets[regra.norma] ??= []).push(r);
  }

  return NORMAS.map((n) => {
    const items = buckets[n.codigo] ?? [];
    const total = items.length;
    const inconformes = items.filter(
      (i) => i.status === "inconforme" || i.status === "parcial",
    ).length;
    const conformes = items.filter((i) => i.status === "conforme").length;
    let status: ChecklistItem["status"] = "pendente";
    if (total === 0) status = "pendente";
    else if (inconformes === 0) status = "conforme";
    else if (inconformes < total) status = "parcial";
    else status = "inconforme";
    return { norma: n.codigo, status, total, conformes, inconformes };
  });
}