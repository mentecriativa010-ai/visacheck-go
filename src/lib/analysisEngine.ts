// Simulated sanitary analysis engine. Replace with real AI vision later.
export type Severidade = "critico" | "atencao" | "conforme";

export type Finding = {
  norma: string;
  ambiente: string;
  descricao_problema: string;
  sugestao: string;
  severidade: Severidade;
  coordenada_x: number; // 0-1 (relative)
  coordenada_y: number; // 0-1 (relative)
  pagina: number;
  peso: number;
};

type CatalogItem = Omit<Finding, "coordenada_x" | "coordenada_y" | "pagina">;

const CATALOG: CatalogItem[] = [
  { norma: "RDC 50/2002", ambiente: "Sala de Procedimento", descricao_problema: "Largura de porta de acesso abaixo do mínimo regulamentar de 1,10 m.", sugestao: "Ampliar vão para no mínimo 1,10 m conforme RDC 50, item de circulação.", severidade: "critico", peso: 18 },
  { norma: "RDC 50/2002", ambiente: "Sala de Curativo", descricao_problema: "Ausência de lavatório clínico obrigatório junto à entrada.", sugestao: "Instalar lavatório com torneira de acionamento não manual e dispenser de sabão líquido.", severidade: "critico", peso: 20 },
  { norma: "RDC 15/2012", ambiente: "C.M.E.", descricao_problema: "Fluxo de material limpo cruzando com fluxo sujo (sem barreira física).", sugestao: "Reorganizar o layout garantindo barreira física entre área suja, intermediária e limpa.", severidade: "critico", peso: 22 },
  { norma: "NBR 9050", ambiente: "Sanitário PCD", descricao_problema: "Área de transferência lateral ao vaso sanitário inferior a 0,80 × 1,20 m.", sugestao: "Reposicionar o vaso garantindo 0,80 × 1,20 m de área livre lateral para transferência.", severidade: "critico", peso: 15 },
  { norma: "RDC 50/2002", ambiente: "Sala de Espera", descricao_problema: "Ventilação natural insuficiente — janelas abaixo de 1/8 da área de piso.", sugestao: "Ampliar área de janelas ou prever ventilação mecânica com renovação ≥ 6 vol/h.", severidade: "atencao", peso: 8 },
  { norma: "RDC 63/2011", ambiente: "Corredor Técnico", descricao_problema: "Sinalização de rota de fuga ausente em trecho de circulação.", sugestao: "Incluir sinalização fotoluminescente conforme NBR 13434 a cada 15 m.", severidade: "atencao", peso: 6 },
  { norma: "RDC 51/2011", ambiente: "Sala de Inalação", descricao_problema: "Quantidade de tomadas insuficiente para equipamentos por leito.", sugestao: "Prever no mínimo 4 tomadas dedicadas com aterramento por leito de inalação.", severidade: "atencao", peso: 5 },
  { norma: "Código de Obras Goiânia", ambiente: "Recepção", descricao_problema: "Pé-direito inferior a 2,70 m em área de permanência prolongada.", sugestao: "Ajustar pé-direito para mínimo de 2,70 m no setor de recepção e espera.", severidade: "atencao", peso: 7 },
  { norma: "SUVISA-GO", ambiente: "Setor de Atendimento", descricao_problema: "DML (Depósito de Material de Limpeza) ausente no setor.", sugestao: "Prever DML com tanque, ponto de água e esgoto a cada 200 m² de área construída.", severidade: "critico", peso: 14 },
  { norma: "NBR 9050", ambiente: "Rampa de Acesso", descricao_problema: "Rampa de acesso com inclinação superior a 8,33%.", sugestao: "Reduzir inclinação para no máximo 8,33% ou prever plataforma elevatória acessível.", severidade: "atencao", peso: 9 },
  { norma: "RDC 50/2002", ambiente: "Consultório Médico", descricao_problema: "Pia clínica posicionada fora da zona de paramentação.", sugestao: "Reposicionar pia próxima à entrada, antes da zona de atendimento ao paciente.", severidade: "atencao", peso: 6 },
  { norma: "RDC 15/2012", ambiente: "Expurgo", descricao_problema: "Ausência de antecâmara entre expurgo e área limpa.", sugestao: "Prever antecâmara com dupla porta e pressão negativa controlada.", severidade: "critico", peso: 16 },
];

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export type AnalysisResult = {
  findings: Finding[];
  score: number;
  status: "aprovado" | "parcial" | "reprovado";
  breakdown: {
    porSeveridade: Record<Severidade, number>;
    porNorma: Record<string, { total: number; criticos: number; atencao: number }>;
    porAmbiente: Record<string, number>;
  };
};

export function runSimulatedAnalysis(seedSource: string): AnalysisResult {
  const seed = Array.from(seedSource).reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = rng(seed);
  const count = 4 + Math.floor(rand() * 5); // 4-8
  const shuffled = [...CATALOG].sort(() => rand() - 0.5).slice(0, count);
  const findings: Finding[] = shuffled.map((f) => ({
    ...f,
    coordenada_x: 0.12 + rand() * 0.76,
    coordenada_y: 0.12 + rand() * 0.76,
    pagina: 1,
  }));
  const penalty = findings.reduce((acc, f) => acc + f.peso, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const status: AnalysisResult["status"] = score >= 85 ? "aprovado" : score >= 60 ? "parcial" : "reprovado";

  const porSeveridade: Record<Severidade, number> = { critico: 0, atencao: 0, conforme: 0 };
  const porNorma: Record<string, { total: number; criticos: number; atencao: number }> = {};
  const porAmbiente: Record<string, number> = {};
  for (const f of findings) {
    porSeveridade[f.severidade]++;
    porNorma[f.norma] ??= { total: 0, criticos: 0, atencao: 0 };
    porNorma[f.norma].total++;
    if (f.severidade === "critico") porNorma[f.norma].criticos++;
    if (f.severidade === "atencao") porNorma[f.norma].atencao++;
    porAmbiente[f.ambiente] = (porAmbiente[f.ambiente] || 0) + 1;
  }

  return { findings, score, status, breakdown: { porSeveridade, porNorma, porAmbiente } };
}

// Derive ambiente deterministically when not persisted (legacy rows)
export function deriveAmbiente(seed: string): string {
  const ambientes = Array.from(new Set(CATALOG.map((c) => c.ambiente)));
  const h = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  return ambientes[h % ambientes.length];
}

export const ANALYSIS_STEPS: { label: string; detail: string; duration: number }[] = [
  { label: "Pré-processamento", detail: "Normalizando geometria e escala da planta", duration: 600 },
  { label: "Detecção de ambientes", detail: "Identificando setores, paredes e fluxos", duration: 900 },
  { label: "Engine regulatória", detail: "Carregando RDC 50 · RDC 15 · NBR 9050 · SUVISA-GO", duration: 800 },
  { label: "Validação sanitária", detail: "Cruzando layout com 142 critérios normativos", duration: 1100 },
  { label: "Classificação de severidade", detail: "Pesando inconformidades críticas e de atenção", duration: 700 },
  { label: "Score consolidado", detail: "Calculando score sanitário final", duration: 500 },
];

export function statusLabel(s: string) {
  return { aprovado: "Aprovado", parcial: "Parcialmente Conforme", reprovado: "Reprovado", analisando: "Em análise", pendente: "Pendente" }[s] ?? s;
}
