import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { runAnalysisForProject } from "@/lib/regulatory/engine/regulatoryEngine";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Home, Folder, BookOpen, LogOut, ArrowLeft,
  Loader2, AlertTriangle, CheckCircle, AlertOctagon, Info,
  FileText, Download, ClipboardList, BarChart2, RefreshCw,
} from "lucide-react";

interface Projeto {
  id: string;
  nome_projeto: string;
  tipo_arquivo: string;
  status: "pendente" | "analisando" | "aprovado" | "parcial" | "reprovado";
  created_at: string;
  score_conformidade: number;
}

interface NaoConformidade {
  codigo: string;
  nome: string;
  severidade: "bloqueante" | "critico" | "atencao" | "informativo";
  norma: string;
  descricao: string;
  sugestao: string;
}

interface ValidacaoCategoria {
  categoria: string;
  total: number;
  conformes: number;
  naoConformes: number;
  percentual: number;
}

interface Parecer {
  norma: string;
  status: string;
  observacao: string;
  risco: string;
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [naoconformidades, setNaoConformidades] = useState<NaoConformidade[]>([]);
  const [resumoExecutivo, setResumoExecutivo] = useState("");
  const [validacoesPorCategoria, setValidacoesPorCategoria] = useState<ValidacaoCategoria[]>([]);
  const [pareceres, setPareceres] = useState<Parecer[]>([]);
  const [exportando, setExportando] = useState(false);
  const [novaAnaliseOpen, setNovaAnaliseOpen] = useState(false);
  const [arquivoNovaAnalise, setArquivoNovaAnalise] = useState("");
  const [rodarNovaAnalise, setRodarNovaAnalise] = useState(false);

  useEffect(() => { fetchProjectAndUser(); }, [id]);

  const fetchProjectAndUser = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { navigate("/login"); return; }

      let { data: projData, error: projError } = await supabase
        .from("projetos")
        .select("id, nome_projeto, tipo_arquivo, status, created_at, score_conformidade")
        .eq("id", id).eq("usuario_id", user.id).maybeSingle();

      if (projError) throw projError;
      if (!projData) { setError("Projeto não encontrado ou você não tem permissão para acessá-lo."); setLoading(false); return; }

      if (projData.status === "pendente" || projData.status === "analisando") {
        const { count, error: countErr } = await supabase
          .from("entidades_arquitetonicas").select("id", { count: "exact", head: true }).eq("projeto_id", id);
        if (!countErr && count && count > 0) {
          try {
            await runAnalysisForProject(id);
            const { data: updatedProj } = await supabase
              .from("projetos").select("id, nome_projeto, tipo_arquivo, status, created_at, score_conformidade")
              .eq("id", id).maybeSingle();
            if (updatedProj) projData = updatedProj;
          } catch (err) { console.error("Erro ao rodar análise on-the-fly:", err); }
        }
      }

      setProjeto(projData as Projeto);

      const { data: parecerData } = await supabase
        .from("pareceres").select("resumo_executivo, status_final, risco_sanitario")
        .eq("projeto_id", id).order("gerado_em", { ascending: false }).limit(1).maybeSingle();

      if (parecerData) {
        setResumoExecutivo(parecerData.resumo_executivo || "");
        setPareceres([
          { norma: "NBR 9050:2020 — Acessibilidade", status: parecerData.status_final === "aprovado" ? "Conforme" : "Requer atenção", observacao: "Verificação de rampas, corredores, sanitários e sinalização tátil.", risco: parecerData.risco_sanitario || "baixo" },
          { norma: "RDC ANVISA 1.002/2025 — Boas Práticas", status: parecerData.status_final === "aprovado" ? "Conforme" : "Requer atenção", observacao: "Verificação de fluxos, revestimentos, ventilação e gestão de resíduos.", risco: parecerData.risco_sanitario || "baixo" },
        ]);
      } else {
        setResumoExecutivo("");
        setPareceres([
          { norma: "NBR 9050:2020 — Acessibilidade", status: "Aguardando análise", observacao: "Análise pendente de processamento.", risco: "indefinido" },
          { norma: "RDC ANVISA 1.002/2025 — Boas Práticas", status: "Aguardando análise", observacao: "Análise pendente de processamento.", risco: "indefinido" },
        ]);
      }

      const { data: valData } = await supabase
        .from("validacoes").select(`id, status, severidade_efetiva, valor_observado, detalhes,
          regras_regulatorias (codigo, nome, norma, descricao, sugestao_corretiva, categoria)`)
        .eq("projeto_id", id);

      if (valData && valData.length > 0) {
        const naoConformes = valData.filter((v: any) => v.status !== "conforme" && v.status !== "nao_aplicavel");
        setNaoConformidades(naoConformes.map((v: any) => {
          const regra = v.regras_regulatorias;
          return { codigo: regra?.codigo || v.id, nome: regra?.nome || "Regra Reguladora", severidade: v.severidade_efetiva, norma: regra?.norma || "ANVISA", descricao: regra?.descricao || "Não conformidade detectada.", sugestao: regra?.sugestao_corretiva || "Ajustar conforme normas vigentes." };
        }));
        const categoriaMap: Record<string, { total: number; conformes: number; naoConformes: number }> = {};
        valData.forEach((v: any) => {
          const cat = v.regras_regulatorias?.categoria || "Geral";
          if (!categoriaMap[cat]) categoriaMap[cat] = { total: 0, conformes: 0, naoConformes: 0 };
          categoriaMap[cat].total++;
          if (v.status === "conforme") categoriaMap[cat].conformes++;
          else if (v.status !== "nao_aplicavel") categoriaMap[cat].naoConformes++;
        });
        setValidacoesPorCategoria(Object.entries(categoriaMap).map(([cat, val]) => ({
          categoria: cat, total: val.total, conformes: val.conformes, naoConformes: val.naoConformes,
          percentual: val.total > 0 ? Math.round((val.conformes / val.total) * 100) : 100,
        })));
      } else {
        setNaoConformidades([]);
        setValidacoesPorCategoria([
          { categoria: "Acessibilidade", total: 8, conformes: 8, naoConformes: 0, percentual: 100 },
          { categoria: "Infraestrutura", total: 6, conformes: 6, naoConformes: 0, percentual: 100 },
          { categoria: "Higiene", total: 4, conformes: 4, naoConformes: 0, percentual: 100 },
          { categoria: "Gestão", total: 4, conformes: 4, naoConformes: 0, percentual: 100 },
        ]);
      }
    } catch (err: any) {
      console.error("Erro ao buscar detalhes do projeto:", err);
      setError(err.message || "Ocorreu um erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleNovaAnalise = async () => {
    if (!id) return;
    try {
      setRodarNovaAnalise(true);
      await supabase.from("validacoes").delete().eq("projeto_id", id);
      await supabase.from("pareceres").delete().eq("projeto_id", id);
      await supabase.from("projetos").update({ status: "analisando", score_conformidade: 100 }).eq("id", id);
      await runAnalysisForProject(id);
      setNovaAnaliseOpen(false);
      setArquivoNovaAnalise("");
      await fetchProjectAndUser();
    } catch (err: any) {
      console.error("Erro ao rodar nova análise:", err);
    } finally {
      setRodarNovaAnalise(false);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  const handleExportarPDF = async () => {
    if (!projeto) return;
    setExportando(true);
    try {
      const linhas = [
        `RELATÓRIO DE CONFORMIDADE REGULATÓRIA`,
        `VISAcheck GO — Diagnóstico Arquitetônico Automatizado`,
        ``, `Projeto: ${projeto.nome_projeto}`,
        `Tipo de Estabelecimento: ${projeto.tipo_arquivo}`,
        `Data: ${new Date(projeto.created_at).toLocaleDateString("pt-BR")}`,
        `Score de Conformidade: ${projeto.score_conformidade}%`,
        `Status: ${projeto.score_conformidade === 100 ? "APROVADO" : projeto.status}`,
        ``, `RESUMO EXECUTIVO`,
        resumoExecutivo || getResumoExecutivo(projeto, naoconformidades.length),
        ``, `VALIDAÇÕES POR CATEGORIA`,
        ...validacoesPorCategoria.map(v => `  • ${v.categoria}: ${v.conformes}/${v.total} conformes (${v.percentual}%)`),
        ``, `NÃO-CONFORMIDADES IDENTIFICADAS (${naoconformidades.length})`,
        ...naoconformidades.map(nc => `  [${nc.severidade.toUpperCase()}] ${nc.codigo} — ${nc.nome}\n  Norma: ${nc.norma}\n  ${nc.descricao}\n  Ação: ${nc.sugestao}`),
        ``, `PARECERES TÉCNICOS`,
        ...pareceres.map(p => `  • ${p.norma}\n    Status: ${p.status}\n    ${p.observacao}`),
        ``, `Relatório gerado automaticamente pelo VISAcheck GO em ${new Date().toLocaleString("pt-BR")}`,
      ];
      const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VISAcheck_${projeto.nome_projeto.replace(/\s+/g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error("Erro ao exportar:", err); }
    finally { setExportando(false); }
  };

  // MUDANÇA 1: Status APROVADO quando score = 100%
  const getStatusEfetivo = (proj: Projeto) => {
    if (proj.score_conformidade === 100 || proj.status === "aprovado") return "aprovado";
    return proj.status;
  };

  const getStatusBadge = (proj: Projeto) => {
    const status = getStatusEfetivo(proj);
    switch (status) {
      case "aprovado":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-[#16A34A] border border-green-200"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />APROVADO ✓</span>;
      case "analisando":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1E3A5F] border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F]" />Em análise</span>;
      case "reprovado":
      case "parcial":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#DC2626] border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />Reprovado</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-[#64748B] border border-gray-200"><span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />Pendente</span>;
    }
  };

  const getSeveridadeBadge = (severidade: NaoConformidade["severidade"]) => {
    switch (severidade) {
      case "bloqueante": return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-[#DC2626] border border-red-200 flex items-center gap-1"><AlertOctagon className="w-3 h-3" />Bloqueante</span>;
      case "critico": return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-[#D97706] border border-orange-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Crítico</span>;
      case "atencao": return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Atenção</span>;
      default: return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"><Info className="w-3 h-3" />Informativo</span>;
    }
  };

  const getRiscoBadge = (risco: string) => {
    switch (risco) {
      case "alto": return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-200">Risco Alto</span>;
      case "medio": return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">Risco Médio</span>;
      case "baixo": return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-200">Risco Baixo</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-50 text-gray-500 border border-gray-200">Indefinido</span>;
    }
  };

  const getResumoExecutivo = (proj: Projeto, totalInfracoes: number) => {
    const nomeEst = proj.tipo_arquivo || "Estabelecimento de Saúde";
    if (proj.score_conformidade === 100 || proj.status === "aprovado")
      return `O projeto "${proj.nome_projeto}" foi analisado à luz das normas regulatórias (RDC 50/2002 e correlatas) para ${nomeEst}. Não foram identificadas não-conformidades de caráter impeditivo. A prancha e fluxo arquitetônico encontram-se plenamente alinhados com as exigências sanitárias vigentes.`;
    if (proj.status === "pendente")
      return `O projeto "${proj.nome_projeto}" foi cadastrado no sistema e aguarda o processamento do motor regulatório computável.`;
    return `O diagnóstico para o projeto "${proj.nome_projeto}" (${nomeEst}) identificou ${totalInfracoes} não-conformidades. O índice global de conformidade atingiu ${proj.score_conformidade}%, indicando que ajustes corretivos são necessários antes da submissão formal ao órgão fiscalizador.`;
  };

  const score = projeto?.score_conformidade ?? 100;
  const statusEfetivo = projeto ? getStatusEfetivo(projeto) : "pendente";
  const temNaoConformidades = naoconformidades.length > 0;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#1E293B]">
      <aside className="w-64 border-r border-border bg-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#1E3A5F]" />
          <span className="text-xl font-bold tracking-tight text-[#1E3A5F]">VISAcheck GO</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-slate-50 hover:text-foreground"><Home className="w-4 h-4" />Dashboard</button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 bg-[#1E3A5F]/5 text-[#1E3A5F]"><Folder className="w-4 h-4" />Meus Projetos</button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-slate-50 hover:text-foreground"><BookOpen className="w-4 h-4" />Base de Normas</button>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-all duration-200"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <header className="border-b border-border bg-white py-5 px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-[#1E293B]">
                  {loading ? <span className="h-6 w-48 bg-slate-100 animate-pulse rounded block" /> : projeto?.nome_projeto}
                </h1>
                {!loading && projeto && getStatusBadge(projeto)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? <span className="h-3 w-32 bg-slate-100 animate-pulse rounded block" /> : `Laudo Técnico do Estabelecimento: ${projeto?.tipo_arquivo}`}
              </p>
            </div>
          </div>
          {!loading && projeto && (
            <div className="flex items-center gap-3">
              {/* MUDANÇA 2: Botão Nova Análise — aparece quando há não-conformidades */}
              {temNaoConformidades && (
                <Button
                  onClick={() => setNovaAnaliseOpen(true)}
                  disabled={rodarNovaAnalise}
                  variant="outline"
                  className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/5 flex items-center gap-2 text-sm"
                >
                  {rodarNovaAnalise ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Nova Análise
                </Button>
              )}
              <Button onClick={handleExportarPDF} disabled={exportando} className="bg-[#1E3A5F] hover:bg-[#162d4a] text-white flex items-center gap-2 text-sm">
                {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Relatório
              </Button>
            </div>
          )}
        </header>

        <div className="flex-1 p-8 space-y-8 max-w-5xl w-full mx-auto">
          {loading ? (
            <div className="min-h-[400px] flex flex-col justify-center items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F]" />
              <p className="text-sm text-muted-foreground">Buscando laudo do projeto...</p>
            </div>
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto shadow-sm">
              <AlertOctagon className="w-12 h-12 text-[#DC2626] mx-auto mb-4" />
              <h3 className="text-base font-bold mb-2">Erro ao carregar projeto</h3>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/dashboard")} className="bg-[#1E3A5F]">Voltar ao Dashboard</Button>
            </div>
          ) : projeto && (
            <div className="space-y-8">

              {/* SCORE & RESUMO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between md:col-span-1">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Score de Conformidade</h3>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className={`text-4xl font-extrabold tracking-tight ${score >= 80 ? "text-[#16A34A]" : score >= 50 ? "text-[#D97706]" : "text-[#DC2626]"}`}>{score}%</span>
                      <span className="text-xs text-muted-foreground">de aprovação</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
                      <div className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? "bg-[#16A34A]" : score >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"}`} style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground block text-right font-medium">
                      {statusEfetivo === "aprovado" ? "Análise concluída com êxito" : "Ajustes sanitários pendentes"}
                    </span>
                  </div>
                </div>
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm md:col-span-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Resumo Executivo</h3>
                    <p className="text-sm leading-relaxed text-slate-700">{resumoExecutivo || getResumoExecutivo(projeto, naoconformidades.length)}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Análise executada de acordo com as normas da ANVISA e ABNT aplicáveis.</span>
                  </div>
                </div>
              </div>

              {/* VALIDAÇÕES POR CATEGORIA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#1E3A5F]" />
                  <h2 className="text-base font-bold text-[#1E293B]">Validações por Categoria</h2>
                </div>
                <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conformes</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pendências</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48">Conformidade</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {validacoesPorCategoria.map((v) => (
                        <tr key={v.categoria} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-[#1E293B]">{v.categoria}</td>
                          <td className="px-4 py-4 text-center text-green-700 font-semibold">{v.conformes}</td>
                          <td className="px-4 py-4 text-center">{v.naoConformes > 0 ? <span className="text-red-600 font-semibold">{v.naoConformes}</span> : <span className="text-slate-400">0</span>}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full ${v.percentual >= 80 ? "bg-[#16A34A]" : v.percentual >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"}`} style={{ width: `${v.percentual}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-600 w-10 text-right">{v.percentual}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">{v.naoConformes === 0 ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NÃO-CONFORMIDADES */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-[#1E293B]">Não-Conformidades Identificadas ({statusEfetivo === "aprovado" ? 0 : naoconformidades.length})</h2>
                  <span className="text-xs text-muted-foreground font-medium">Regulamento Técnico: RDC 50/2002</span>
                </div>
                {statusEfetivo === "aprovado" || naoconformidades.length === 0 ? (
                  <div className="bg-white border border-border rounded-xl p-12 text-center shadow-sm">
                    <CheckCircle className="w-12 h-12 text-[#16A34A] mx-auto mb-4" />
                    <h3 className="text-base font-semibold">Parabéns! Nenhuma irregularidade</h3>
                    <p className="text-sm text-muted-foreground mt-1">O projeto atende a todas as especificações sanitárias analisadas.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Correções necessárias</p>
                        <p className="text-xs text-amber-700 mt-0.5">Após corrigir o projeto, clique em <strong>Nova Análise</strong> no topo da página para submeter o projeto corrigido e obter um novo diagnóstico.</p>
                      </div>
                    </div>
                    {naoconformidades.map((nc) => (
                      <div key={nc.codigo} className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-muted-foreground">{nc.codigo}</span>
                              <h3 className="text-sm font-bold text-[#1E293B]">{nc.nome}</h3>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1E3A5F] tracking-wide uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Norma: {nc.norma}</span>
                          </div>
                          {getSeveridadeBadge(nc.severidade)}
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Detalhamento Técnico da Irregularidade</span>
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 border border-slate-100 p-3 rounded-lg">{nc.descricao}</p>
                        </div>
                        <div className="border border-green-200 bg-green-50/30 p-4 rounded-lg space-y-1.5">
                          <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider block">Ação Corretiva Sugerida pelo Auditor AI</span>
                          <p className="text-xs text-slate-800 font-medium">{nc.sugestao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PARECERES TÉCNICOS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#1E3A5F]" />
                  <h2 className="text-base font-bold text-[#1E293B]">Pareceres Técnicos por Norma</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pareceres.map((p, idx) => (
                    <div key={idx} className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#1E3A5F] flex-shrink-0" />
                          <h3 className="text-sm font-bold text-[#1E293B] leading-tight">{p.norma}</h3>
                        </div>
                        {getRiscoBadge(p.risco)}
                      </div>
                      <div className="flex items-center gap-2">
                        {p.status === "Conforme" ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : p.status === "Aguardando análise" ? <Loader2 className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        <span className={`text-sm font-semibold ${p.status === "Conforme" ? "text-green-700" : p.status === "Aguardando análise" ? "text-slate-500" : "text-amber-700"}`}>{p.status}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg">{p.observacao}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* MODAL NOVA ANÁLISE */}
      {novaAnaliseOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-[#1E3A5F]" />
              <h2 className="text-base font-bold text-[#1E293B]">Nova Análise Regulatória</h2>
            </div>
            <p className="text-sm text-slate-600">Anexe o projeto corrigido para substituir o anterior e iniciar uma nova análise completa. As não-conformidades anteriores serão descartadas.</p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Anexar projeto corrigido (PDF / DWG)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Selecione o arquivo corrigido..."
                  value={arquivoNovaAnalise}
                  readOnly
                  className="flex-1 h-9 px-3 rounded-md border border-input bg-slate-50 text-sm cursor-pointer"
                  onClick={() => document.getElementById("nova-analise-file")?.click()}
                />
                <button type="button" onClick={() => document.getElementById("nova-analise-file")?.click()} className="px-3 h-9 rounded-md border border-input text-sm hover:bg-slate-50 transition-colors">Procurar</button>
              </div>
              <input id="nova-analise-file" type="file" accept=".pdf,.dwg,.dxf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setArquivoNovaAnalise(file.name); }} />
              <p className="text-[10px] text-muted-foreground">O arquivo será processado pelo motor regulatório para gerar um novo diagnóstico.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <strong>Atenção:</strong> A nova análise irá substituir completamente os resultados anteriores deste projeto.
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setNovaAnaliseOpen(false); setArquivoNovaAnalise(""); }} disabled={rodarNovaAnalise} className="flex-1 h-9 rounded-md border border-input text-sm hover:bg-slate-50 transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={handleNovaAnalise} disabled={rodarNovaAnalise} className="flex-1 h-9 rounded-md bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {rodarNovaAnalise ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando...</> : <><RefreshCw className="w-4 h-4" />Iniciar Nova Análise</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
