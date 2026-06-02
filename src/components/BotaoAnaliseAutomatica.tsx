// ============================================================
// BotaoAnaliseAutomatica.tsx — Componente para adicionar na
// página Analise.tsx (src/components/BotaoAnaliseAutomatica.tsx)
//
// COMO USAR na Analise.tsx:
// 1. Importe: import BotaoAnaliseAutomatica from "@/components/BotaoAnaliseAutomatica";
// 2. Adicione no Passo 1 (após o formulário de nome/tipo):
//    <BotaoAnaliseAutomatica projetoId={projetoId} onConcluido={handleAnaliseConcluida} />
// ============================================================

import { useRef, useState } from "react";
import { useAutoAnalise, EtapaAnalise } from "@/hooks/useAutoAnalise";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle, XCircle, Upload } from "lucide-react";

interface Props {
  projetoId: string;
  onConcluido?: (scoreGeral: number) => void;
}

const mensagensEtapa: Record<EtapaAnalise, string> = {
  idle: "",
  extraindo_pdf: "Lendo o PDF...",
  buscando_regras: "Buscando regras...",
  analisando: "IA analisando... (até 30s)",
  salvando: "Salvando resultados...",
  concluido: "Análise concluída!",
  erro: "Erro na análise",
};

export default function BotaoAnaliseAutomatica({ projetoId, onConcluido }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const { progresso, resultado, erro, executarAnalise, resetar } = useAutoAnalise();

  const emProgresso =
    progresso.etapa !== "idle" &&
    progresso.etapa !== "concluido" &&
    progresso.etapa !== "erro";

  const handleArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.type !== "application/pdf") {
      alert("Por favor, selecione um arquivo PDF.");
      return;
    }
    setArquivoNome(arquivo.name);
    await executarAnalise(arquivo, projetoId);
    if (resultado && onConcluido) {
      onConcluido(resultado.score_geral);
    }
  };

  // Estado: concluído com sucesso
  if (progresso.etapa === "concluido" && resultado) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-green-700 font-semibold">
          <CheckCircle className="w-5 h-5" />
          Análise automática concluída!
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{resultado.score_geral}%</div>
            <div className="text-xs text-gray-500 mt-1">Score geral</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="text-2xl font-bold text-emerald-600">
              {resultado.resultados.filter((r) => r.status === "conforme").length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Conformes</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <div className="text-2xl font-bold text-red-500">
              {resultado.resultados.filter((r) => r.status === "nao_conforme").length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Não conformes</div>
          </div>
        </div>
        {resultado.resumo && (
          <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-green-100">
            {resultado.resumo}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={resetar}
          className="text-gray-500"
        >
          Fazer nova análise
        </Button>
      </div>
    );
  }

  // Estado: erro
  if (progresso.etapa === "erro" && erro) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <XCircle className="w-5 h-5" />
          Erro na análise
        </div>
        <p className="text-sm text-red-600">{erro}</p>
        <Button variant="outline" size="sm" onClick={resetar} className="text-gray-500">
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Estado: em progresso
  if (emProgresso) {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-blue-700 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          {mensagensEtapa[progresso.etapa]}
        </div>
        {arquivoNome && (
          <p className="text-xs text-gray-500">Arquivo: {arquivoNome}</p>
        )}
        {/* Barra de progresso */}
        <div className="w-full bg-blue-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progresso.percentual}%` }}
          />
        </div>
        <p className="text-xs text-blue-600">{progresso.percentual}% concluído</p>
      </div>
    );
  }

  // Estado: idle — botão inicial
  return (
    <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 space-y-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="bg-blue-100 rounded-full p-3">
          <Zap className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-800">Análise Automática com IA</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Faça upload do PDF do projeto e a IA analisa automaticamente todas as{" "}
          <strong>regras regulatórias</strong> sem intervenção manual.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleArquivo}
      />

      <Button
        onClick={() => inputRef.current?.click()}
        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        disabled={!projetoId}
      >
        <Upload className="w-4 h-4" />
        Selecionar PDF e Analisar
      </Button>

      {!projetoId && (
        <p className="text-xs text-amber-500">
          ⚠️ Preencha o nome do projeto antes de analisar
        </p>
      )}

      <p className="text-xs text-gray-400">
        Usa Groq (LLaMA 3.3 70B) — gratuito e sem limites no plano free
      </p>
    </div>
  );
}
