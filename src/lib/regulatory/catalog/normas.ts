import type { Norma } from "../types";

export interface NormaInfo {
  codigo: Norma;
  nome: string;
  escopo: string;
}

export const NORMAS: NormaInfo[] = [
  { codigo: "RDC 50", nome: "RDC 50/2002 – Projetos físicos de EAS", escopo: "Estabelecimentos Assistenciais de Saúde" },
  { codigo: "RDC 15", nome: "RDC 15/2012 – Processamento de produtos para a saúde", escopo: "CME, barreira, esterilização" },
  { codigo: "RDC 63", nome: "RDC 63/2011 – Boas práticas em serviços de saúde", escopo: "Funcional e acessibilidade operacional" },
  { codigo: "RDC 51", nome: "RDC 51/2011 – Projetos de arquitetura de EAS", escopo: "Aprovação de projeto arquitetônico" },
  { codigo: "NBR 9050", nome: "NBR 9050 – Acessibilidade", escopo: "Acessibilidade a edificações" },
  { codigo: "VISA Goiânia", nome: "VISA Goiânia", escopo: "Vigilância Sanitária Municipal" },
  { codigo: "SUVISA-GO", nome: "SUVISA-GO", escopo: "Vigilância Sanitária Estadual" },
];

export function getNorma(codigo: string): NormaInfo | undefined {
  return NORMAS.find((n) => n.codigo === codigo);
}