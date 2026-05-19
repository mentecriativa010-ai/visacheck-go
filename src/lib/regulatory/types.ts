/**
 * Tipos do Motor Regulatório SanitaryAI.
 * Fonte única de verdade para entidades, regras, validações, scores e parecer.
 */

export type Severidade = "informativo" | "atencao" | "critico" | "bloqueante";

export type RegraCategoria =
  | "acessibilidade"
  | "fluxo_sanitario"
  | "dimensional"
  | "ventilacao"
  | "funcional"
  | "estrutural"
  | "biosseguranca"
  | "operacao"
  | "esterilizacao";

export type TipoValidacao =
  | "dimensional"
  | "presencial"
  | "fluxo"
  | "barreira"
  | "ventilacao"
  | "area_minima";

export type ValidacaoStatus =
  | "conforme"
  | "parcial"
  | "inconforme"
  | "nao_aplicavel";

export type ParecerStatus =
  | "aprovado"
  | "parcialmente_conforme"
  | "revisao_necessaria"
  | "reprovado";

export type Norma =
  | "NBR 9050"
  | "RDC 50"
  | "RDC 15"
  | "RDC 63"
  | "RDC 51"
  | "VISA Goiânia"
  | "SUVISA-GO";

/** Tipos de entidade arquitetônica detectáveis em um projeto. */
export type TipoEntidade =
  | "parede"
  | "porta"
  | "corredor"
  | "circulacao"
  | "sanitario"
  | "sanitario_pcd"
  | "consultorio"
  | "cme"
  | "expurgo"
  | "recepcao"
  | "esterilizacao"
  | "lavatorio"
  | "ventilacao"
  | "area_limpa"
  | "area_contaminada";

export interface EntidadeArquitetonica {
  id: string;
  projeto_id: string;
  tipo: TipoEntidade | string;
  ambiente?: string | null;
  coord_x: number;
  coord_y: number;
  largura?: number | null;
  altura?: number | null;
  pagina: number;
  metadados: Record<string, unknown>;
}

export interface ParametrosRegra {
  campo?: "largura" | "altura" | "area";
  operador?: ">=" | "<=" | "==" | ">" | "<";
  valor?: number;
  unidade?: string;
  obrigatorio?: boolean;
  min_quantidade?: number;
  dependencia?: TipoEntidade | string;
  contexto?: string;
  separacao?: "obrigatoria" | "opcional";
  cruzamento?: "permitido" | "proibido";
  barreira?: "obrigatoria" | "opcional";
  entre?: string[];
  isolado?: boolean;
  acessivel?: boolean;
  renovacoes_h?: number;
  continuidade?: "obrigatoria" | "opcional";
  desnivel_max?: number;
  [key: string]: unknown;
}

export interface RegraRegulatoria {
  id: string;
  codigo: string;
  nome: string;
  norma: Norma | string;
  categoria: RegraCategoria;
  ambiente_aplicavel: string[];
  tipo_validacao: TipoValidacao;
  parametros: ParametrosRegra;
  severidade: Severidade;
  descricao: string;
  sugestao_corretiva: string;
  ativa: boolean;
}

export interface ResultadoValidacao {
  regra_id: string;
  entidade_id?: string | null;
  status: ValidacaoStatus;
  severidade_efetiva: Severidade;
  valor_observado?: number | null;
  detalhes: Record<string, unknown>;
}

export interface ScoreRegulatorio {
  score_geral: number;
  score_por_norma: Record<string, number>;
  score_por_ambiente: Record<string, number>;
  score_acessibilidade: number;
  score_fluxo: number;
}

export interface ChecklistItem {
  norma: string;
  status: "conforme" | "parcial" | "inconforme" | "pendente";
  total: number;
  conformes: number;
  inconformes: number;
}

export interface Parecer {
  status_final: ParecerStatus;
  risco_sanitario: "baixo" | "moderado" | "alto" | "critico";
  impacto_regulatorio: string;
  resumo_executivo: string;
  checklist: ChecklistItem[];
}

/** Pesos de severidade usados pelo scoring. */
export const PESO_SEVERIDADE: Record<Severidade, number> = {
  informativo: 0,
  atencao: 5,
  critico: 15,
  bloqueante: 40,
};