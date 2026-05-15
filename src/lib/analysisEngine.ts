// Simulated sanitary analysis engine. Replace with real AI vision later.
export type Finding = {
  norma: string;
  descricao_problema: string;
  sugestao: string;
  severidade: "critico" | "atencao" | "conforme";
  coordenada_x: number; // 0-1 (relative)
  coordenada_y: number; // 0-1 (relative)
  pagina: number;
  peso: number;
};

const CATALOG: Omit<Finding, "coordenada_x" | "coordenada_y" | "pagina">[] = [
  { norma: "RDC 50/2002", descricao_problema: "Largura de porta de acesso a sala de procedimento abaixo de 1,10 m.", sugestao: "Ampliar vão para mínimo de 1,10 m conforme RDC 50, seção de circulação.", severidade: "critico", peso: 18 },
  { norma: "RDC 50/2002", descricao_problema: "Ausência de lavatório obrigatório em sala de curativo.", sugestao: "Instalar lavatório com torneira sem acionamento manual junto à entrada.", severidade: "critico", peso: 20 },
  { norma: "RDC 15/2012", descricao_problema: "Fluxo de material limpo cruzando com fluxo sujo na CME.", sugestao: "Reorganizar layout garantindo barreira física entre área suja e limpa.", severidade: "critico", peso: 22 },
  { norma: "NBR 9050", descricao_problema: "Sanitário acessível sem área de transferência lateral mínima.", sugestao: "Garantir 0,80 x 1,20 m de área livre lateral ao vaso sanitário.", severidade: "critico", peso: 15 },
  { norma: "RDC 50/2002", descricao_problema: "Ventilação natural insuficiente em sala de espera.", sugestao: "Aumentar área de janela para 1/8 da área de piso ou prever ventilação mecânica.", severidade: "atencao", peso: 8 },
  { norma: "RDC 63/2011", descricao_problema: "Sinalização de rota de fuga ausente em corredor técnico.", sugestao: "Incluir sinalização de emergência conforme NBR 13434.", severidade: "atencao", peso: 6 },
  { norma: "RDC 51/2011", descricao_problema: "Sala de inalação sem tomadas suficientes para equipamentos.", sugestao: "Prever no mínimo 4 tomadas dedicadas com aterramento por leito.", severidade: "atencao", peso: 5 },
  { norma: "Código de Obras Goiânia", descricao_problema: "Pé-direito da recepção abaixo de 2,70 m.", sugestao: "Ajustar pé-direito para mínimo de 2,70 m em áreas de permanência prolongada.", severidade: "atencao", peso: 7 },
  { norma: "SUVISA-GO", descricao_problema: "DML (Depósito de Material de Limpeza) ausente no setor.", sugestao: "Prever DML com tanque e ponto de água/esgoto a cada 200 m² de área.", severidade: "critico", peso: 14 },
  { norma: "NBR 9050", descricao_problema: "Rampa com inclinação superior a 8,33%.", sugestao: "Reduzir inclinação para no máximo 8,33% ou prever plataforma elevatória.", severidade: "atencao", peso: 9 },
];

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function runSimulatedAnalysis(seedSource: string): { findings: Finding[]; score: number; status: "aprovado" | "parcial" | "reprovado" } {
  const seed = Array.from(seedSource).reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = rng(seed);
  const count = 3 + Math.floor(rand() * 5); // 3-7
  const shuffled = [...CATALOG].sort(() => rand() - 0.5).slice(0, count);
  const findings: Finding[] = shuffled.map((f) => ({
    ...f,
    coordenada_x: 0.1 + rand() * 0.8,
    coordenada_y: 0.1 + rand() * 0.8,
    pagina: 1,
  }));
  const penalty = findings.reduce((acc, f) => acc + f.peso, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const status: "aprovado" | "parcial" | "reprovado" = score >= 85 ? "aprovado" : score >= 60 ? "parcial" : "reprovado";
  return { findings, score, status };
}
