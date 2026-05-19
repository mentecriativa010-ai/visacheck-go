import type { TipoEntidade } from "../types";

export interface AmbienteInfo {
  codigo: TipoEntidade;
  nome: string;
  grupo:
    | "estrutural"
    | "circulacao"
    | "sanitario"
    | "assistencial"
    | "apoio"
    | "esterilizacao"
    | "biosseguranca"
    | "infraestrutura";
  descricao: string;
}

export const AMBIENTES: AmbienteInfo[] = [
  { codigo: "parede", nome: "Parede", grupo: "estrutural", descricao: "Elemento de vedação vertical" },
  { codigo: "porta", nome: "Porta", grupo: "circulacao", descricao: "Vão de acesso entre ambientes" },
  { codigo: "corredor", nome: "Corredor", grupo: "circulacao", descricao: "Via de circulação horizontal" },
  { codigo: "circulacao", nome: "Circulação", grupo: "circulacao", descricao: "Área de fluxo de pessoas" },
  { codigo: "sanitario", nome: "Sanitário", grupo: "sanitario", descricao: "Sanitário comum" },
  { codigo: "sanitario_pcd", nome: "Sanitário PCD", grupo: "sanitario", descricao: "Sanitário acessível NBR 9050" },
  { codigo: "lavatorio", nome: "Lavatório", grupo: "sanitario", descricao: "Bancada de higienização" },
  { codigo: "consultorio", nome: "Consultório", grupo: "assistencial", descricao: "Sala de atendimento clínico" },
  { codigo: "recepcao", nome: "Recepção", grupo: "apoio", descricao: "Área de acolhimento" },
  { codigo: "cme", nome: "CME", grupo: "esterilizacao", descricao: "Central de Material Esterilizado" },
  { codigo: "expurgo", nome: "Expurgo", grupo: "biosseguranca", descricao: "Área de descarte de material contaminado" },
  { codigo: "esterilizacao", nome: "Esterilização", grupo: "esterilizacao", descricao: "Sala de esterilização" },
  { codigo: "area_limpa", nome: "Área Limpa", grupo: "biosseguranca", descricao: "Área limpa do fluxo CME" },
  { codigo: "area_contaminada", nome: "Área Contaminada", grupo: "biosseguranca", descricao: "Área suja/contaminada do fluxo CME" },
  { codigo: "ventilacao", nome: "Ventilação", grupo: "infraestrutura", descricao: "Sistema de ventilação/exaustão" },
];

export function getAmbiente(codigo: string): AmbienteInfo | undefined {
  return AMBIENTES.find((a) => a.codigo === codigo);
}