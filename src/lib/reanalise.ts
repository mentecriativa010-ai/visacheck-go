// src/lib/reanalise.ts
// Re-análise de um projeto já existente.
//
// Fluxo: usuário envia um PDF corrigido -> a IA analisa de novo -> o laudo
// antigo (validacoes + pareceres) é apagado e substituído pelo novo -> o
// registro em `projetos` é ATUALIZADO (mesmo id), nunca duplicado.

import { supabase } from "@/integrations/supabase/client";
import { analisarProjetoComIA } from "@/lib/openrouter";

// Mesmo mapeamento usado em src/pages/Analise.tsx — mantém a mesma lógica de
// quais "tipos" de regra buscar para cada ambiente/estabelecimento.
const AMBIENTE_PARA_TIPOS: Record<string, string[]> = {
  "UTI Adulto": ["base", "hospital_uti"],
  "UTI Pediátrica": ["base", "hospital_uti"],
  "UTI Neonatal": ["base", "hospital_uti"],
  "CME": ["base", "hospital_cme"],
  "Centro Cirúrgico": ["base", "hospital_cc"],
  "Centro Cirúrgico Ambulatorial": ["base", "hospital_cca"],
  "Radiologia": ["base", "hospital_radiologia"],
  "Hospital Geral": ["base", "hospital_uti", "hospital_cme", "hospital_radiologia"],
  "Internação": ["base"],
  "Pronto Socorro": ["base"],
  "Ambulatório": ["base"],
  "Consultório Odontológico": ["base", "odontologia"],
  "Centro Cirúrgico Odontológico": ["base", "odontologia"],
  "Laboratório de Prótese": ["base", "odontologia"],
  "Drogaria": ["base", "drogaria"],
  "Farmácia de Manipulação": ["base", "farmacia_manipulacao"],
  "Distribuidora": ["distribuidora"],
  "Clínica Médica": ["base"],
  "Laboratório": ["base"],
};

interface RegraDb {
  id: string;
  codigo: string;
  descricao: string;
  norma_origem: string | null;
  categoria: string;
}

export interface ResultadoReanalise {
  scoreConformidade: number;
  status: "aprovado" | "reprovado" | "pendente";
  totalConformes: number;
  totalNaoConformes: number;
  totalRegras: number;
}

async function carregarRegras(tipoEstabelecimento: string): Promise<RegraDb[]> {
  const tiposAlvo = AMBIENTE_PARA_TIPOS[tipoEstabelecimento] ?? ["base"];
  const filtroTipos = tiposAlvo.map((t) => `tipo_estabelecimento.eq.${t}`).join(",");
  const filtroAmbiente = `ambiente.cs.{"${tipoEstabelecimento}"}`;

  const { data, error } = await supabase
    .from("regras_regulatorias")
    .select("id,codigo,descricao,norma_origem,categoria")
    .or(`${filtroTipos},${filtroAmbiente}`);

  if (error) throw error;

  const unicas = data ? [...new Map(data.map((r: any) => [r.id, r])).values()] : [];
  return unicas as RegraDb[];
}

// Mesma extração de texto usada em Analise.tsx (via pdf.js pelo CDN).
async function extrairTextoPDF(file: File): Promise<string> {
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar leitor de PDF"));
      document.head.appendChild(script);
    });
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let textoCompleto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const conteudo = await page.getTextContent();
    const textoPagina = conteudo.items.map((item: any) => item.str).join(" ");
    textoCompleto += textoPagina + "\n";
  }
  return textoCompleto.trim();
}

async function uploadPdfCorrigido(userId: string, file: File): Promise<string | null> {
  try {
    const caminho = `${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("projetos-arquivos")
      .upload(caminho, file, { contentType: "application/pdf", upsert: false });
    if (error) {
      console.error("Erro upload PDF corrigido:", error);
      return null;
    }
    return caminho;
  } catch {
    return null;
  }
}

/**
 * Roda uma nova análise por IA em cima de um PDF corrigido e ATUALIZA o
 * projeto existente (mesmo id) — nunca cria um projeto novo.
 *
 * - Apaga as `validacoes` e o `parecer` antigos ligados a esse projeto.
 * - Grava as novas validações e o novo parecer.
 * - Atualiza `status` e `score_conformidade` em `projetos`.
 * - Se o upload do novo PDF funcionar, atualiza `pdf_path`/`pdf_nome` também.
 *
 * @param onStatus callback opcional pra mostrar progresso na tela ("Lendo PDF...", etc.)
 */
export async function reanalisarProjeto(
  projetoId: string,
  tipoEstabelecimento: string,
  pdfFile: File,
  onStatus?: (msg: string) => void
): Promise<ResultadoReanalise> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  onStatus?.("Carregando regras regulatórias...");
  const regras = await carregarRegras(tipoEstabelecimento);
  if (regras.length === 0) {
    throw new Error(`Nenhuma regra encontrada para "${tipoEstabelecimento}".`);
  }

  onStatus?.("Lendo o PDF corrigido...");
  const textoPDF = await extrairTextoPDF(pdfFile);
  if (!textoPDF || textoPDF.length < 30) {
    throw new Error(
      "Não foi possível extrair texto do PDF (pode ser um PDF escaneado/imagem, sem camada de texto)."
    );
  }

  onStatus?.("IA analisando o projeto corrigido...");
  const regrasMapeadas = regras.map((r) => ({
    id: String(r.id),
    codigo: r.codigo ?? "",
    descricao: r.descricao ?? "",
    norma_origem: r.norma_origem ?? null,
  }));
  const resultado = await analisarProjetoComIA(textoPDF, tipoEstabelecimento, regrasMapeadas);

  const respostas: Record<string, "conforme" | "nao_conforme" | "nao_aplicavel"> = {};
  const observacoes: Record<string, string> = {};
  regras.forEach((r) => {
    respostas[r.id] = "nao_aplicavel";
  });
  resultado.resultados.forEach((r) => {
    if (r.status === "conforme" || r.status === "nao_conforme" || r.status === "nao_aplicavel") {
      respostas[r.id] = r.status;
    }
    if (r.justificativa) observacoes[r.id] = r.justificativa;
  });

  const totalConformes = Object.values(respostas).filter((v) => v === "conforme").length;
  const totalNaoConformes = Object.values(respostas).filter((v) => v === "nao_conforme").length;
  const totalAplicaveis = Object.values(respostas).filter((v) => v !== "nao_aplicavel").length;
  const scoreConformidade =
    totalAplicaveis > 0 ? Math.round((totalConformes / totalAplicaveis) * 100) : 0;
  const status: ResultadoReanalise["status"] =
    scoreConformidade === 100 ? "aprovado" : totalNaoConformes > 0 ? "reprovado" : "pendente";

  onStatus?.("Substituindo laudo anterior...");
  // Remove o laudo antigo ligado a esse projeto antes de gravar o novo.
  await supabase.from("validacoes").delete().eq("projeto_id", projetoId);
  await supabase.from("pareceres").delete().eq("projeto_id", projetoId);

  const validacoesNovas = regras.map((r) => {
    const resp = respostas[r.id];
    const statusValidacao =
      resp === "conforme" ? "aprovado" : resp === "nao_conforme" ? "reprovado" : "nao_aplicavel";
    const observacao =
      resp === "conforme"
        ? "Conforme verificação"
        : resp === "nao_conforme"
        ? observacoes[r.id] || "Não conformidade identificada"
        : observacoes[r.id] || "Não aplicável ao projeto/ambiente analisado.";
    return { projeto_id: projetoId, regra_id: r.id, status: statusValidacao, observacao };
  });
  if (validacoesNovas.length > 0) {
    const { error: valError } = await supabase.from("validacoes").insert(validacoesNovas);
    if (valError) throw valError;
  }

  const resumo =
    scoreConformidade === 100
      ? `Projeto reanalisado atende a todas as especificações para ${tipoEstabelecimento}.`
      : `Re-análise identificou ${totalNaoConformes} não-conformidades. Score: ${scoreConformidade}%.`;
  const { error: parecerError } = await supabase.from("pareceres").insert({
    projeto_id: projetoId,
    parecer: resumo,
    nivel_risco: scoreConformidade === 100 ? "baixo" : scoreConformidade >= 70 ? "medio" : "alto",
  });
  if (parecerError) throw parecerError;

  onStatus?.("Atualizando o projeto...");
  const novoPdfPath = await uploadPdfCorrigido(user.id, pdfFile);
  const updatePayload: Record<string, unknown> = {
    status,
    score_conformidade: scoreConformidade,
  };
  if (novoPdfPath) {
    updatePayload.pdf_path = novoPdfPath;
    updatePayload.pdf_nome = pdfFile.name;
  }
  const { error: updateError } = await supabase
    .from("projetos")
    .update(updatePayload)
    .eq("id", projetoId);
  if (updateError) throw updateError;

  return {
    scoreConformidade,
    status,
    totalConformes,
    totalNaoConformes,
    totalRegras: regras.length,
  };
}
