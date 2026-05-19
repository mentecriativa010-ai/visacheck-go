export type PipelineEtapaId =
  | "upload"
  | "parsing"
  | "analise_regulatoria"
  | "validacao"
  | "revisao_tecnica"
  | "relatorio";

export interface PipelineEtapa {
  id: PipelineEtapaId;
  ordem: number;
  titulo: string;
  descricao: string;
}

export const PIPELINE: PipelineEtapa[] = [
  { id: "upload", ordem: 1, titulo: "Upload realizado", descricao: "Arquivo recebido e armazenado." },
  { id: "parsing", ordem: 2, titulo: "Parsing iniciado", descricao: "Extração de entidades arquitetônicas." },
  { id: "analise_regulatoria", ordem: 3, titulo: "Análise regulatória", descricao: "Cruzamento com regras computáveis." },
  { id: "validacao", ordem: 4, titulo: "Validação concluída", descricao: "Resultado das regras consolidado." },
  { id: "revisao_tecnica", ordem: 5, titulo: "Revisão técnica", descricao: "Parecer técnico gerado." },
  { id: "relatorio", ordem: 6, titulo: "Relatório emitido", descricao: "Relatório final disponível para download." },
];

export function proximaEtapa(atual: PipelineEtapaId): PipelineEtapa | null {
  const i = PIPELINE.findIndex((e) => e.id === atual);
  return PIPELINE[i + 1] ?? null;
}