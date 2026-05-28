import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, Home, Folder, BookOpen, LogOut, ArrowLeft,
  CheckCircle, AlertTriangle, AlertOctagon, ChevronRight,
  ChevronLeft, Loader2, ClipboardList, BarChart2, Download,
} from "lucide-react";

interface Regra {
  id: string;
  codigo: string;
  descricao: string;
  norma_origem: string;
  categoria: string;
  subcategoria: string;
}

}

const TIPOS_ESTABELECIMENTO = [
  "Hospital Geral",
  "Clínica Médica",
  "Consultório",
  "CME",
  "Laboratório",
  "Distribuidora",
  "Outro",
];

export default function Analise() {
  const navigate = useNavigate();
  const [passo, setPasso] = useState(1);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState("Hospital Geral");
  const [regras, setRegras] = useState<Regra[]>([]);
  const [respostas, setRespostas] = useState<Record<string, "conforme" | "nao_conforme" | "nao_aplicavel">>({});
  const [loadingRegras, setLoadingRegras] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [projetoSalvoId, setProjetoSalvoId] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState("");

  useEffect(() => {
    verificarAuth();
  }, []);

  const verificarAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) navigate("/login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const carregarRegras = async () => {
    setLoadingRegras(true);
    try {
      const { data, error } = await supabase
        .from("regras_regulatorias")
        .select("id, codigo, descricao, norma_origem, categoria, subcategoria")
        .order("categoria", { ascending: true });
      if (!error && data) {
        setRegras(data as Regra[]);
        // Inicializa todas as respostas como "nao_aplicavel"
        const init: Record<string, "conforme" | "nao_conforme" | "nao_aplicavel"> = {};
        data.forEach((r: Regra) => { init[r.id] = "nao_aplicavel"; });
        setRespostas(init);
        // Define primeira categoria ativa
        if (data.length > 0) setCategoriaAtiva(data[0].categoria);
      }
    } finally {
      setLoadingRegras(false);
    }
  };

  const avancarPasso1 = async () => {
    if (!nomeProjeto.trim()) return;
    await carregarRegras();
    setPasso(2);
  };

  const categorias = [...new Set(regras.map(r => r.categoria))];

  const regrasPorCategoria = regras.filter(r => r.categoria === categoriaAtiva);

  const totalRespondidas = Object.values(respostas).filter(v => v !== "nao_aplicavel").length;
  const totalAplicaveis = Object.values(respostas).filter(v => v !== "nao_aplicavel").length;
  const totalConformes = Object.values(respostas).filter(v => v === "conforme").length;
  const totalNaoConformes = Object.values(respostas).filter(v => v === "nao_conforme").length;

  const scoreCalculado = totalAplicaveis > 0
    ? Math.round((totalConformes / totalAplicaveis) * 100)
    : 0;

  const validacoesPorCategoria = categorias.map(cat => {
    const regrasCat = regras.filter(r => r.categoria === cat);
    const aplicaveis = regrasCat.filter(r => respostas[r.id] !== "nao_aplicavel");
    const conformes = regrasCat.filter(r => respostas[r.id] === "conforme");
    const naoConformes = regrasCat.filter(r => respostas[r.id] === "nao_conforme");
    const pct = aplicaveis.length > 0 ? Math.round((conformes.length / aplicaveis.length) * 100) : 100;
    return { categoria: cat, total: aplicaveis.length, conformes: conformes.length, naoConformes: naoConformes.length, percentual: pct };
  });

  const naoConformidades = regras.filter(r => respostas[r.id] === "nao_conforme");

  const salvarNoBanco = async () => {
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: proj, error: projError } = await supabase
        .from("projetos")
        .insert({
          nome_projeto: nomeProjeto,
          tipo_estabelecimento: tipoEstabelecimento,
          user_id: user.id,
          status: scoreCalculado === 100 ? "aprovado" : totalNaoConformes > 0 ? "reprovado" : "pendente",
          score_conformidade: scoreCalculado,
        })
        .select("id")
        .single();

      if (projError || !proj) throw projError;

      // Insere validações
      const validacoes = regras
        .filter(r => respostas[r.id] !== "nao_aplicavel")
        .map(r => ({
          projeto_id: proj.id,
          regra_id: r.id,
          status: respostas[r.id] === "conforme" ? "aprovado" : "reprovado",
          observacao: respostas[r.id] === "conforme" ? "Conforme verificação manual" : "Não conformidade identificada",
        }));

      if (validacoes.length > 0) {
        await supabase.from("validacoes").insert(validacoes);
      }

      // Insere parecer
      const resumo = scoreCalculado === 100
        ? `O projeto "${nomeProjeto}" atende a todas as especificações regulatórias verificadas para ${tipoEstabelecimento}.`
        : `O diagnóstico de "${nomeProjeto}" identificou ${totalNaoConformes} não-conformidades. Score: ${scoreCalculado}%.`;

      await supabase.from("pareceres").insert({
        projeto_id: proj.id,
        parecer: resumo,
        nivel_risco: scoreCalculado === 100 ? "baixo" : scoreCalculado >= 70 ? "medio" : "alto",
      });

      setProjetoSalvoId(proj.id);
      setPasso(3);
    } catch (err) {
      console.error("Erro ao salvar análise:", err);
    } finally {
      setSalvando(false);
    }
  };

  const exportarRelatorio = () => {
    const linhas = [
      `RELATÓRIO DE CONFORMIDADE REGULATÓRIA`,
      `VISAcheck GO — Diagnóstico Manual`,
      ``,
      `Projeto: ${nomeProjeto}`,
      `Tipo: ${tipoEstabelecimento}`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      `Score: ${scoreCalculado}%`,
      ``,
      `VALIDAÇÕES POR CATEGORIA`,
      ...validacoesPorCategoria.map(v => `  • ${v.categoria}: ${v.conformes}/${v.total} conformes (${v.percentual}%)`),
      ``,
      `NÃO-CONFORMIDADES (${naoConformidades.length})`,
      ...naoConformidades.map(nc => `  [${nc.norma_origem}] ${nc.codigo}\n  ${nc.descricao}`),
      ``,
      `Relatório gerado pelo VISAcheck GO em ${new Date().toLocaleString("pt-BR")}`,
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VISAcheck_${nomeProjeto.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#1E293B]">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-border bg-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#1E3A5F]" />
          <span className="text-xl font-bold tracking-tight text-[#1E3A5F]">VISAcheck GO</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-50"><Home className="w-4 h-4" />Dashboard</button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-50"><Folder className="w-4 h-4" />Meus Projetos</button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-50"><BookOpen className="w-4 h-4" />Base de Normas</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[#1E3A5F]/5 text-[#1E3A5F]"><ClipboardList className="w-4 h-4" />Nova Análise</button>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="border-b border-border bg-white py-5 px-8 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-semibold text-[#1E293B]">Nova Análise Regulatória</h1>
            <p className="text-xs text-muted-foreground">Diagnóstico manual baseado nas normas ANVISA e ABNT</p>
          </div>
          {/* INDICADOR DE PASSOS */}
          <div className="ml-auto flex items-center gap-2">
            {[1, 2, 3].map(p => (
              <div key={p} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${passo >= p ? "bg-[#1E3A5F] text-white" : "bg-slate-100 text-slate-400"}`}>{p}</div>
                {p < 3 && <div className={`w-8 h-0.5 ${passo > p ? "bg-[#1E3A5F]" : "bg-slate-200"}`} />}
              </div>
            ))}
            <div className="ml-3 text-xs text-muted-foreground">
              {passo === 1 ? "Dados do projeto" : passo === 2 ? "Checklist regulatório" : "Resultado"}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-5xl w-full mx-auto">

          {/* PASSO 1: DADOS DO PROJETO */}
          {passo === 1 && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-white border border-border rounded-xl p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mx-auto">
                    <ClipboardList className="w-6 h-6 text-[#1E3A5F]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#1E293B]">Dados do Projeto</h2>
                  <p className="text-sm text-muted-foreground">Preencha as informações básicas para iniciar o diagnóstico</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Projeto</Label>
                    <Input id="nome" value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} placeholder="Ex: UPA Norte — Reforma Ala B" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Estabelecimento</Label>
                    <select id="tipo" value={tipoEstabelecimento} onChange={e => setTipoEstabelecimento(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      {TIPOS_ESTABELECIMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={avancarPasso1} disabled={!nomeProjeto.trim() || loadingRegras} className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] text-white gap-2">
                  {loadingRegras ? <><Loader2 className="w-4 h-4 animate-spin" />Carregando regras...</> : <>Iniciar Checklist<ChevronRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* PASSO 2: CHECKLIST */}
          {passo === 2 && (
            <div className="space-y-6">
              {/* PROGRESSO */}
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#1E293B]">{nomeProjeto}</h2>
                    <p className="text-xs text-muted-foreground">{tipoEstabelecimento} · {regras.length} regras a verificar</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Respondidas</p>
                    <p className="text-lg font-bold text-[#1E3A5F]">{totalRespondidas}<span className="text-sm font-normal text-muted-foreground">/{regras.length}</span></p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-[#1E3A5F] transition-all duration-300" style={{ width: `${(totalRespondidas / regras.length) * 100}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {/* MENU DE CATEGORIAS */}
                <div className="col-span-1 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Categorias</p>
                  {categorias.map(cat => {
                    const regrasCat = regras.filter(r => r.categoria === cat);
                    const respondidas = regrasCat.filter(r => respostas[r.id] !== "nao_aplicavel").length;
                    const todas = regrasCat.length;
                    return (
                      <button key={cat} onClick={() => setCategoriaAtiva(cat)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${categoriaAtiva === cat ? "bg-[#1E3A5F] text-white font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
                        <span className="block truncate">{cat}</span>
                        <span className={`text-[10px] ${categoriaAtiva === cat ? "text-blue-200" : "text-muted-foreground"}`}>{respondidas}/{todas}</span>
                      </button>
                    );
                  })}
                </div>

                {/* REGRAS DA CATEGORIA */}
                <div className="col-span-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#1E293B]">{categoriaAtiva}</h3>
                    <span className="text-xs text-muted-foreground">{regrasPorCategoria.length} regras</span>
                  </div>
                  {regrasPorCategoria.map(regra => (
                    <div key={regra.id} className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${respostas[regra.id] === "conforme" ? "border-green-200 bg-green-50/30" : respostas[regra.id] === "nao_conforme" ? "border-red-200 bg-red-50/30" : "border-border"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-[#1E3A5F] bg-[#1E3A5F]/10 px-2 py-0.5 rounded">{regra.norma_origem}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{regra.codigo}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{regra.descricao}</p>
                        </div>
                        {/* BOTÕES DE RESPOSTA */}
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setRespostas(prev => ({ ...prev, [regra.id]: "conforme" }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${respostas[regra.id] === "conforme" ? "bg-green-600 text-white border-green-600" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                          >✓ Conforme</button>
                          <button
                            onClick={() => setRespostas(prev => ({ ...prev, [regra.id]: "nao_conforme" }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${respostas[regra.id] === "nao_conforme" ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-700 hover:bg-red-50"}`}
                          >✗ Não conforme</button>
                          <button
                            onClick={() => setRespostas(prev => ({ ...prev, [regra.id]: "nao_aplicavel" }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${respostas[regra.id] === "nao_aplicavel" ? "bg-slate-500 text-white border-slate-500" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}
                          >— N/A</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* NAVEGAÇÃO ENTRE CATEGORIAS */}
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => { const i = categorias.indexOf(categoriaAtiva); if (i > 0) setCategoriaAtiva(categorias[i - 1]); }} disabled={categorias.indexOf(categoriaAtiva) === 0} className="gap-2">
                      <ChevronLeft className="w-4 h-4" />Anterior
                    </Button>
                    {categorias.indexOf(categoriaAtiva) < categorias.length - 1 ? (
                      <Button onClick={() => { const i = categorias.indexOf(categoriaAtiva); setCategoriaAtiva(categorias[i + 1]); }} className="bg-[#1E3A5F] text-white gap-2">
                        Próxima categoria<ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button onClick={salvarNoBanco} disabled={salvando} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        {salvando ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <>Finalizar e ver resultado<ChevronRight className="w-4 h-4" /></>}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3: RESULTADO */}
          {passo === 3 && (
            <div className="space-y-8">
              {/* SCORE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Score de Conformidade</h3>
                  <div>
                    <span className={`text-5xl font-extrabold ${scoreCalculado >= 80 ? "text-[#16A34A]" : scoreCalculado >= 50 ? "text-[#D97706]" : "text-[#DC2626]"}`}>{scoreCalculado}%</span>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-3">
                      <div className={`h-3 rounded-full ${scoreCalculado >= 80 ? "bg-[#16A34A]" : scoreCalculado >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"}`} style={{ width: `${scoreCalculado}%` }} />
                    </div>
                    <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${scoreCalculado === 100 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {scoreCalculado === 100 ? "✓ APROVADO" : `${totalNaoConformes} não-conformidades`}
                    </span>
                  </div>
                </div>
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm md:col-span-2">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Resumo da Análise</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {scoreCalculado === 100
                      ? `O projeto "${nomeProjeto}" atende a todas as especificações regulatórias verificadas para ${tipoEstabelecimento}. Nenhuma não-conformidade foi identificada.`
                      : `O diagnóstico de "${nomeProjeto}" (${tipoEstabelecimento}) identificou ${totalNaoConformes} não-conformidades entre ${totalRespondidas} itens verificados. Score global: ${scoreCalculado}%.`
                    }
                  </p>
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" /><span className="font-semibold">{totalConformes} conformes</span></div>
                    <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /><span className="font-semibold">{totalNaoConformes} não-conformes</span></div>
                    <div className="flex items-center gap-2 text-slate-500"><AlertOctagon className="w-4 h-4" /><span className="font-semibold">{regras.length - totalRespondidas} não aplicáveis</span></div>
                  </div>
                </div>
              </div>

              {/* VALIDAÇÕES POR CATEGORIA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#1E3A5F]" />
                  <h2 className="text-base font-bold">Validações por Categoria</h2>
                </div>
                <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Conformes</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Pendências</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase w-48">Conformidade</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {validacoesPorCategoria.filter(v => v.total > 0).map(v => (
                        <tr key={v.categoria} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-medium">{v.categoria}</td>
                          <td className="px-4 py-4 text-center text-green-700 font-semibold">{v.conformes}</td>
                          <td className="px-4 py-4 text-center">{v.naoConformes > 0 ? <span className="text-red-600 font-semibold">{v.naoConformes}</span> : <span className="text-slate-400">0</span>}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2">
                                <div className={`h-2 rounded-full ${v.percentual >= 80 ? "bg-[#16A34A]" : v.percentual >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"}`} style={{ width: `${v.percentual}%` }} />
                              </div>
                              <span className="text-xs font-semibold w-10 text-right">{v.percentual}%</span>
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
              {naoConformidades.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold">Não-Conformidades ({naoConformidades.length})</h2>
                  <div className="space-y-4">
                    {naoConformidades.map(nc => (
                      <div key={nc.id} className="bg-white border border-red-200 rounded-xl p-5 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">{nc.codigo}</span>
                              <span className="text-[10px] font-bold text-[#1E3A5F] bg-slate-100 px-2 py-0.5 rounded">{nc.norma_origem}</span>
                            </div>
                            <p className="text-sm text-slate-700">{nc.descricao}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200 flex-shrink-0">Não conforme</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AÇÕES */}
              <div className="flex gap-4 pt-4">
                <Button onClick={exportarRelatorio} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />Exportar Relatório
                </Button>
                {projetoSalvoId && (
                  <Button onClick={() => navigate(`/projetos/${projetoSalvoId}`)} className="bg-[#1E3A5F] text-white gap-2">
                    Ver Laudo Completo<ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={() => navigate("/dashboard")} variant="outline">
                  Voltar ao Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
