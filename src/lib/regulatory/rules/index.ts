import { supabase } from "@/integrations/supabase/client";
import type { RegraRegulatoria } from "../types";

export async function carregarRegras(): Promise<RegraRegulatoria[]> {
  const { data, error } = await supabase
    .from("regras_regulatorias")
    .select("*")
    ;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    parametros: (r.parametros ?? {}) as RegraRegulatoria["parametros"],
  }));
}

export function filtrarPorAmbientes(
  regras: RegraRegulatoria[],
  ambientes: string[],
): RegraRegulatoria[] {
  const set = new Set(ambientes);
  return regras.filter((r) => r.ambiente_aplicavel.some((a) => set.has(a)));
}