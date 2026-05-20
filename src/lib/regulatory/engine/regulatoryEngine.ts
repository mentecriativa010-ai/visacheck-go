import { supabase } from "@/integrations/supabase/client";
import { carregarRegras } from "../rules";
import { executarRegra } from "../rules/validators";
import { calcularScore } from "./scoring";
import { gerarChecklist } from "./checklist";
import { gerarParecer } from "./parecer";
import type {
  EntidadeArquitetonica,
  Parecer,
  RegraRegulatoria,
  ResultadoValidacao,
  ScoreRegulatorio,
} from "../types";

export interface AnalysisResult {
  resultados: ResultadoValidacao[];
  score: ScoreRegulatorio;
  parecer: Parecer;
  regras: RegraRegulatoria[];
  entidades: EntidadeArquitetonica[];
}

export function analyze(
  entidades: EntidadeArquitetonica[],
  regras: RegraRegulatoria[],
): AnalysisResult {
  const resultados = regras.flatMap((r) => executarRegra(r, entidades));
  const score = calcularScore(resultados, regras, entidades);
  const checklist = gerarChecklist(resultados, regras);
  const parecer = gerarParecer(resultados, regras, score, checklist);
  return { resultados, score, parecer, regras, entidades };
}

async function carregarEntidades(projetoId: string): Promise<EntidadeArquitetonica[]> {
  const { data, error } = await supabase
    .from("entidades_arquitetonicas")
    .select("*")
    .eq("projeto_id", projetoId);
  if (error) throw error;
  return (data ?? []) as unknown as EntidadeArquitetonica[];
}

export async function runAnalysisForProject(projetoId: string): Promise<AnalysisResult> {
  const [regras, entidades] = await Promise.all([
    carregarRegras(),
    carregarEntidades(projetoId),
  ]);

  const result = analyze(entidades, regras);

  await supabase.from("validacoes").delete().eq("projeto_id", projetoId);

  if (result.resultados.length > 0) {
    await supabase.from("validacoes").insert(
      result.resultados.map((r) => ({
        projeto_id: projetoId,
        regra_id: r.regra_id,
        entidade_id: r.entidade_id ?? null,
        status: r.status,
        severidade_efetiva: r.severidade_efetiva,
        valor_observado: r.valor_observado ?? null,
        detalhes: r.detalhes as unknown as import("@/integrations/supabase/client").Database["public"]["Tables"]["validacoes"]["Insert"]["detalhes"],
      })),
    );
  }

  await supabase.from("scores").insert({
    projeto_id: projetoId,
    score_geral: result.score.score_geral,
    score_por_norma: result.score.score_por_norma,
    score_por_ambiente: result.score.score_por_ambiente,
    score_acessibilidade: result.score.score_acessibilidade,
    score_fluxo: result.score.score_fluxo,
  });

  await supabase.from("pareceres").insert({
    projeto_id: projetoId,
    status_final: result.parecer.status_final,
    risco_sanitario: result.parecer.risco_sanitario,
    impacto_regulatorio: result.parecer.impacto_regulatorio,
    resumo_executivo: result.parecer.resumo_executivo,
    checklist: result.parecer.checklist as unknown as import("@/integrations/supabase/client").Database["public"]["Tables"]["pareceres"]["Insert"]["checklist"],
  });

  await supabase
    .from("projetos")
    .update({ score_conformidade: result.score.score_geral })
    .eq("id", projetoId);

  return result;
}