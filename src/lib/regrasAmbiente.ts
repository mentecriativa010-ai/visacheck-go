// src/lib/regrasAmbiente.ts
//
// Fonte única de verdade para "quais regras regulatórias valem para qual
// tipo de ambiente/estabelecimento". Usado tanto pela análise nova
// (src/pages/Analise.tsx) quanto pela reanálise (src/lib/reanalise.ts).
//
// Antes cada uma tinha sua própria cópia dessa lógica, e elas foram ficando
// dessincronizadas: reanalise.ts não tinha "Clínica Odontológica" no mapa de
// ambientes, não filtrava por ativo=true (ignorando qualquer regra
// desativada) e não excluía RDC-50-2002 para odontologia — trazendo de volta
// regras já desativadas/excluídas sempre que alguém reanalisava um projeto.
// Centralizando aqui, qualquer ajuste futuro vale para as duas automaticamente.

import { supabase } from "@/integrations/supabase/client";

export const AMBIENTE_PARA_TIPOS: Record<string, string[]> = {
  "UTI Adulto":                    ["base", "hospital_uti"],
  "UTI Pediátrica":                ["base", "hospital_uti"],
  "UTI Neonatal":                  ["base", "hospital_uti"],
  "CME":                           ["base", "hospital_cme"],
  "Centro Cirúrgico":              ["base", "hospital_cc"],
  "Centro Cirúrgico Ambulatorial": ["base", "hospital_cca"],
  "Radiologia":                    ["base", "hospital_radiologia"],
  "Hospital Geral":                ["base", "hospital_uti", "hospital_cme", "hospital_radiologia"],
  "Internação":                    ["base"],
  "Pronto Socorro":                ["base"],
  "Ambulatório":                   ["base"],
  "Consultório Odontológico":      ["base", "odontologia"],
  "Clínica Odontológica":          ["base", "odontologia"],
  "Centro Cirúrgico Odontológico": ["base", "odontologia"],
  "Laboratório de Prótese":        ["base", "odontologia"],
  "Drogaria":                      ["base", "drogaria"],
  "Farmácia de Manipulação":       ["base", "farmacia_manipulacao"],
  "Distribuidora":                 ["distribuidora"],
  "Clínica Médica":                ["base"],
  "Laboratório":                   ["base"],
};

// Normas que, na prática de fiscalização (validado com Vigilância Sanitária),
// NÃO devem ser aplicadas para determinados tipo_estabelecimento — mesmo que
// existam regras cadastradas com essa norma_origem sob a tag "base" (que é
// compartilhada entre vários tipos de estabelecimento). Ex: para
// estabelecimentos odontológicos, quem rege hoje é a RDC-1002/2025 e a
// NBR-9050; a RDC-50/2002 não é usada nesse contexto, mesmo cobrindo temas
// genéricos como "portas de áreas assistenciais" que tecnicamente existem no
// texto da norma mas não se aplicam à realidade de uma clínica odontológica.
export const NORMAS_EXCLUIDAS_POR_TIPO: Record<string, string[]> = {
  odontologia: ["RDC-50-2002"],
};

export interface RegraRegulatoria {
  id: string;
  codigo: string;
  descricao: string;
  norma_origem: string | null;
  categoria: string;
  subcategoria?: string | null;
  artigo_referencia?: string | null;
  obrigatorio?: boolean | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  unidade?: string | null;
  verificado_em_vistoria?: boolean | null;
}

/**
 * Busca no Supabase as regras aplicáveis a um tipo de ambiente/estabelecimento,
 * já com os filtros de ativo=true e de exclusão de norma por tipo aplicados.
 * Usado tanto pela análise nova quanto pela reanálise — qualquer ajuste feito
 * aqui (nova regra desativada, novo tipo de ambiente, nova exclusão de norma)
 * vale para as duas automaticamente, sem risco de uma ficar desatualizada em
 * relação à outra.
 */
export async function carregarRegrasParaAmbiente(tipoEstabelecimento: string): Promise<RegraRegulatoria[]> {
  const tiposAlvo = AMBIENTE_PARA_TIPOS[tipoEstabelecimento] ?? ["base"];
  const filtroTipos = tiposAlvo.map(t => `tipo_estabelecimento.eq.${t}`).join(",");
  const filtroAmbiente = `ambiente.cs.{"${tipoEstabelecimento}"}`;

  const { data, error } = await supabase
    .from("regras_regulatorias")
    .select("id,codigo,descricao,norma_origem,categoria,subcategoria,artigo_referencia,obrigatorio,valor_minimo,valor_maximo,unidade,verificado_em_vistoria")
    .eq("ativo", true)
    .or(`${filtroTipos},${filtroAmbiente}`)
    .order("norma_origem", { ascending: true })
    .order("codigo", { ascending: true });
  if (error) throw error;

  const unicas: any[] = data ? [...new Map(data.map((r: any) => [r.id, r])).values()] : [];

  // Aplica exclusões de norma por tipo de estabelecimento (ver NORMAS_EXCLUIDAS_POR_TIPO
  // acima) — resolve casos em que uma norma tecnicamente cadastrada sob "base" não deve
  // ser usada para determinados ambientes, sem precisar recadastrar cada regra individualmente.
  const normasExcluidas = tiposAlvo.flatMap(t => NORMAS_EXCLUIDAS_POR_TIPO[t] ?? []);
  const filtradas = normasExcluidas.length > 0
    ? unicas.filter(r => !normasExcluidas.includes(r.norma_origem))
    : unicas;

  return filtradas as RegraRegulatoria[];
}
