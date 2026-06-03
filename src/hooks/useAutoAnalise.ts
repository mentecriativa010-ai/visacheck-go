// ============================================================
// useAutoAnalise.ts â€” Hook que orquestra o fluxo automÃ¡tico
// Coloque este arquivo em: src/hooks/useAutoAnalise.ts
// ============================================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  extrairTextoPDF,
  analisarComGroq,
  ResultadoAnalise,
  ResultadoRegra,
} from "@/services/groqService";

export type EtapaAnalise =
  | "idle"
  | "extraindo_pdf"
  | "buscando_regras"
  | "analisando"
  | "salvando"
  | "concluido"
  | "erro";

export interface ProgressoAnalise {
  etapa: EtapaAnalise;
  mensagem: string;
  percentual: number;
}

export function useAutoAnalise() {
  const [progresso, setProgresso] = useState<ProgressoAnalise>({
    etapa: "idle",
    mensagem: "",
    percentual: 0,
  });
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = (etapa: EtapaAnalise, mensagem: string, percentual: number) => {
    setProgresso({ etapa, mensagem, percentual });
  };

  // ----------------------------------------------------------------
  // FunÃ§Ã£o principal: recebe o arquivo PDF e o projeto_id
  // ----------------------------------------------------------------
  const executarAnalise = useCallback(
    async (arquivo: File, projetoId: string) => {
      setErro(null);
      setResultado(null);

      try {
        // ETAPA 1: Extrair texto do PDF
        atualizar("extraindo_pdf", "Lendo o arquivo PDF...", 10);
        const textoPDF = await extrairTextoPDF(arquivo);

        // ETAPA 2: Buscar regras do Supabase
        atualizar("buscando_regras", "Buscando regras regulatÃ³rias...", 30);
        const { data: regras, error: erroRegras } = await supabase
          .from("regras_regulatorias")
          .select("id, codigo, norma_origem, descricao, categoria, valor_minimo, unidade")
          .order("categoria")
          .order("codigo");

        if (erroRegras || !regras || regras.length === 0) {
          throw new Error("NÃ£o foi possÃ­vel buscar as regras do banco de dados.");
        }

        // ETAPA 3: Analisar com Groq
        atualizar(
          "analisando",
          `Analisando ${regras.length} regras com IA... (pode levar atÃ© 30s)`,
          50
        );
        const analise = await analisarComGroq(textoPDF, regras);

        if (analise.erro) {
          throw new Error(analise.erro);
        }

        // ETAPA 4: Salvar resultados no Supabase
        atualizar("salvando", "Salvando resultados...", 80);
        await salvarResultados(projetoId, analise);

        // ETAPA 5: ConcluÃ­do
        atualizar("concluido", "AnÃ¡lise concluÃ­da com sucesso!", 100);
        setResultado(analise);
      } catch (err: any) {
        setErro(err.message || "Erro desconhecido na anÃ¡lise.");
        atualizar("erro", err.message, 0);
      }
    },
    []
  );

  const resetar = useCallback(() => {
    setProgresso({ etapa: "idle", mensagem: "", percentual: 0 });
    setResultado(null);
    setErro(null);
  }, []);

  return { progresso, resultado, erro, executarAnalise, resetar };
}

// ----------------------------------------------------------------
// Salva os resultados no Supabase (tabela validacoes)
// ----------------------------------------------------------------
async function salvarResultados(projetoId: string, analise: ResultadoAnalise) {
  // Atualiza o projeto com o score geral
  await supabase
    .from("projetos")
    .update({
      score_conformidade: analise.score_geral,
      status: analise.score_geral === 100 ? "aprovado" : "pendente",
      resumo_executivo: analise.resumo,
    })
    .eq("id", projetoId);

  // Remove validaÃ§Ãµes antigas deste projeto
  await supabase.from("validacoes").delete().eq("projeto_id", projetoId);

  // Insere as novas validaÃ§Ãµes
  if (analise.resultados.length > 0) {
    const validacoes = analise.resultados.map((r: ResultadoRegra) => ({
      projeto_id: projetoId,
      regra_id: r.regra_id,
      status: r.status,
      observacao: r.justificativa,
    }));

    await supabase.from("validacoes").insert(validacoes);
  }
}
