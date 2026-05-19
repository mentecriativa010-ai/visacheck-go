import type { RegraCategoria } from "../types";

export interface CategoriaInfo {
  codigo: RegraCategoria;
  nome: string;
  descricao: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  { codigo: "acessibilidade", nome: "Acessibilidade", descricao: "Conformidade com NBR 9050 e rotas acessíveis." },
  { codigo: "fluxo_sanitario", nome: "Fluxo Sanitário", descricao: "Separação de fluxos limpo, sujo e contaminado." },
  { codigo: "dimensional", nome: "Dimensional", descricao: "Dimensões mínimas de ambientes e elementos." },
  { codigo: "ventilacao", nome: "Ventilação", descricao: "Renovação de ar e exaustão." },
  { codigo: "funcional", nome: "Funcional", descricao: "Adequação operacional dos ambientes." },
  { codigo: "estrutural", nome: "Estrutural", descricao: "Elementos estruturais e vedações." },
  { codigo: "biosseguranca", nome: "Biossegurança", descricao: "Barreiras físicas e contenção." },
  { codigo: "operacao", nome: "Operação", descricao: "Boas práticas operacionais." },
  { codigo: "esterilizacao", nome: "Esterilização", descricao: "CME, autoclaves e processamento." },
];

export function getCategoria(codigo: RegraCategoria): CategoriaInfo | undefined {
  return CATEGORIAS.find((c) => c.codigo === codigo);
}