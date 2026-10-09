// Fonte única para exibir normas no site: "Nome/ano" + resumo curto do assunto.

export interface NormaInfo {
  tipo: "RDC" | "NBR";
  numero: number;
  codigo: string; // nome/ano para exibição
  tema: string; // texto curto sobre o que trata a norma
}

export const NORMAS: NormaInfo[] = [
  { tipo: "RDC", numero: 50, codigo: "RDC-50/2002", tema: "Infraestrutura física de estabelecimentos de saúde" },
  { tipo: "NBR", numero: 9050, codigo: "NBR 9050:2020", tema: "Acessibilidade a edificações e espaços" },
  { tipo: "RDC", numero: 1002, codigo: "RDC-1002/2025", tema: "Boas práticas em serviços odontológicos" },
  { tipo: "RDC", numero: 7, codigo: "RDC-07/2010", tema: "Unidades de Terapia Intensiva" },
  { tipo: "RDC", numero: 15, codigo: "RDC-15/2012", tema: "Processamento de produtos para saúde (CME)" },
  { tipo: "RDC", numero: 330, codigo: "RDC-330/2019", tema: "Serviços de radiologia diagnóstica" },
  { tipo: "RDC", numero: 222, codigo: "RDC-222/2018", tema: "Gerenciamento de resíduos de serviços de saúde" },
];

// Aceita formatos como "RDC-50-2002", "RDC 50/2002", "NBR-9050-2020", "NBR 9050".
export function infoNorma(bruto?: string | null): NormaInfo | null {
  if (!bruto) return null;
  const m = String(bruto).match(/(RDC|NBR)[\s-]*0*(\d+)/i);
  if (!m) return null;
  const tipo = m[1].toUpperCase();
  const numero = parseInt(m[2], 10);
  return NORMAS.find((n) => n.tipo === tipo && n.numero === numero) ?? null;
}

// "Nome/ano — resumo curto". Se a norma não for conhecida, devolve o texto original.
export function rotuloNorma(bruto?: string | null): string {
  const info = infoNorma(bruto);
  return info ? `${info.codigo} — ${info.tema}` : String(bruto ?? "");
}

// Só "Nome/ano" (quando o resumo vai em outra linha).
export function nomeNorma(bruto?: string | null): string {
  const info = infoNorma(bruto);
  return info ? info.codigo : String(bruto ?? "");
}
