// src/lib/reanalise.ts
// Re-análise de um projeto já existente.
//
// Fluxo: usuário envia um PDF corrigido -> a IA analisa de novo -> o laudo
// antigo (validacoes + pareceres) é apagado e substituído pelo novo -> o
// registro em `projetos` é ATUALIZADO (mesmo id), nunca duplicado.

import { supabase } from "@/integrations/supabase/client";
import { analisarProjetoComIA } from "@/lib/openrouter";
import { carregarRegrasParaAmbiente, type RegraRegulatoria } from "@/lib/regrasAmbiente";

type RegraDb = RegraRegulatoria;

export interface ResultadoReanalise {
  scoreConformidade: number;
  status: "aprovado" | "reprovado" | "pendente";
  totalConformes: number;
  totalNaoConformes: number;
  totalRegras: number;
}

// Mesma extração de texto usada em Analise.tsx (via pdf.js pelo CDN).
async function extrairTextoPDF(file: File): Promise<string> {
  if (!(window as any).pdfjsLib) {
    const pdfjsLib: any = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.min.mjs"
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs";
    (window as any).pdfjsLib = pdfjsLib;
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
    const nomeSanitizado = file.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const caminho = `${userId}/${Date.now()}_${nomeSanitizado}`;
    const { error } = await supabase.storage
      .from("projetos-pdf")
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
  const regras: RegraDb[] = await carregarRegrasParaAmbiente(tipoEstabelecimento);
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
  const motivosNaoAplicavel: Record<string, string | null> = {};
  regras.forEach((r) => {
    respostas[r.id] = "nao_aplicavel";
  });
  resultado.resultados.forEach((r) => {
    if (r.status === "conforme" || r.status === "nao_conforme" || r.status === "nao_aplicavel") {
      respostas[r.id] = r.status;
    }
    if (r.justificativa) observacoes[r.id] = r.justificativa;
    // motivo_na só existe (e só importa) para itens nao_aplicavel — usado pra filtrar da
    // tela de Pendências os itens "óbvios"/dispensados/verificados em vistoria (ver
    // MOTIVOS_NA_OCULTOS em ProjectDetails.tsx). Sem isso, todo item nao_aplicavel virava
    // pendência visível, mesmo quando a IA já tinha identificado que não deveria aparecer.
    if (r.status === "nao_aplicavel") motivosNaoAplicavel[r.id] = (r as any).motivo_na ?? null;
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
    return {
      projeto_id: projetoId,
      regra_id: r.id,
      status: statusValidacao,
      observacao,
      motivo_na: resp === "nao_aplicavel" ? (motivosNaoAplicavel[r.id] ?? null) : null,
      no_limite: false,
    };
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
