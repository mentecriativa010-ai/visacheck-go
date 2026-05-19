import { PESO_SEVERIDADE } from "../types";
import type {
  EntidadeArquitetonica,
  RegraRegulatoria,
  ResultadoValidacao,
  ScoreRegulatorio,
} from "../types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function calcularSubScore(resultados: ResultadoValidacao[]): number {
  const peso = resultados
    .filter((r) => r.status === "inconforme" || r.status === "parcial")
    .reduce((acc, r) => acc + PESO_SEVERIDADE[r.severidade_efetiva], 0);
  return clamp(100 - peso);
}

export function calcularScore(
  resultados: ResultadoValidacao[],
  regras: RegraRegulatoria[],
  entidades: EntidadeArquitetonica[],
): ScoreRegulatorio {
  const regrasMap = new Map(regras.map((r) => [r.id, r]));
  const entidadesMap = new Map(entidades.map((e) => [e.id, e]));

  const score_geral = calcularSubScore(resultados);

  const porNorma: Record<string, ResultadoValidacao[]> = {};
  const porAmbiente: Record<string, ResultadoValidacao[]> = {};
  const porCategoria: Record<string, ResultadoValidacao[]> = {};

  for (const r of resultados) {
    const regra = regrasMap.get(r.regra_id);
    if (!regra) continue;
    (porNorma[regra.norma] ??= []).push(r);
    (porCategoria[regra.categoria] ??= []).push(r);
    const ent = r.entidade_id ? entidadesMap.get(r.entidade_id) : undefined;
    const amb = ent?.ambiente ?? ent?.tipo ?? regra.ambiente_aplicavel[0] ?? "geral";
    (porAmbiente[amb] ??= []).push(r);
  }

  const reduce = (obj: Record<string, ResultadoValidacao[]>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, calcularSubScore(v)]));

  return {
    score_geral,
    score_por_norma: reduce(porNorma),
    score_por_ambiente: reduce(porAmbiente),
    score_acessibilidade: calcularSubScore(porCategoria["acessibilidade"] ?? []),
    score_fluxo: calcularSubScore(porCategoria["fluxo_sanitario"] ?? []),
  };
}