import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck, Home, Folder, BookOpen, LogOut, Plus, CheckCircle2, Clock,
  Search, Loader2, AlertCircle, FileText, HelpCircle, Info, Trash2, RefreshCw,
} from "lucide-react";

interface Projeto {
  id: string;
  nome_projeto: string;
  tipo_estabelecimento: string;
  status: "pendente" | "analisando" | "aprovado" | "parcial" | "reprovado";
  created_at: string;
  score_conformidade: number;
}

interface Regra {
  id: string;
  codigo: string;
  descricao: string;
  norma_origem: string;
  categoria: string;
  subcategoria: string;
}

function getStatusEfetivo(proj: Projeto): Projeto["status"] {
  if (proj.score_conformidade === 100 || proj.status === "aprovado") return "aprovado";
  if (proj.score_conformidade >= 50) return "parcial";
  if (proj.status === "analisando") return "analisando";
  if (proj.score_conformidade > 0 && proj.score_conformidade < 50) return "reprovado";
  return proj.status;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "projetos" | "normas">("dashboard");
  const [userName, setUserName] = useState("Usuário");
  const [loadingUser, setLoadingUser] = useState(true);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(true);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [loadingRegras, setLoadingRegras] = useState(false);
  const [novoProjetoOpen, setNovoProjetoOpen] = useState(false);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState("Hospital Geral");
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [arquivoName, setArquivoName] = useState("");
  const [criandoProjeto, setCriandoProjeto] = useState(false);
  const [erroCriar, setErroCriar] = useState("");
  const [filtroNomeProjeto, setFiltroNomeProjeto] = useState("");
  const [filtroStatusProjeto, setFiltroStatusProjeto] = useState<string>("todos");
  const [filtroNorma, setFiltroNorma] = useState<string>("todas");
  const [filtroBuscaRegra, setFiltroBuscaRegra] = useState("");
  const [projetosSelecionados, setProjetosSelecionados] = useState<string[]>([]);
  const [deletandoProjetos, setDeletandoProjetos] = useState(false);
  const [confirmarDelete, setConfirmarDelete] = useState(false);

  // NOVO: estado para reanálise
  const [reanaliseOpen, setReanaliseOpen] = useState(false);
  const [arquivoReanalise, setArquivoReanalise] = useState("");
  const [arquivoReanaliseFile, setArquivoReanaliseFile] = useState<File | null>(null);
  const [rodandoReanalise, setRodandoReanalise] = useState(false);

  useEffect(() => { fetchUserDataAndProjects(); }, []);

  useEffect(() => {
    if (activeTab === "normas" && regras.length === 0) fetchRegras();
    setProjetosSelecionados([]);
  }, [activeTab]);

  const fetchUserDataAndProjects = async () => {
    try {
      setLoadingUser(true);
      setLoadingProjetos(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { navigate("/login"); return; }

      const { data: profile } = await supabase.from("perfis").select("nome").eq("id", user.id).maybeSingle();
      if (profile?.nome) {
        setUserName(profile.nome);
      } else {
        setUserName(user.email?.split("@")[0] || "Usuário");
      }
      setLoadingUser(false);

      const { data: projetosData, error: projetosError } = await supabase
        .from("projetos")
        .select("id, nome_projeto, tipo_estabelecimento, status, created_at, score_conformidade")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!projetosError && projetosData) setProjetos(projetosData as Projeto[]);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err);
    } finally {
      setLoadingProjetos(false);
      setLoadingUser(false);
    }
  };

  const fetchRegras = async () => {
    try {
      setLoadingRegras(true);
      const { data, error } = await supabase
        .from("regras_regulatorias")
        .select("id, codigo, descricao, norma_origem, categoria, subcategoria");
      if (!error && data) setRegras(data as Regra[]);
    } catch (err) {
      console.error("Erro ao buscar regras:", err);
    } finally {
      setLoadingRegras(false);
    }
  };

  const handleDeletarSelecionados = async () => {
    if (!projetosSelecionados.length) return;
    try {
      setDeletandoProjetos(true);
      await supabase.from("validacoes").delete().in("projeto_id", projetosSelecionados);
      await supabase.from("pareceres").delete().in("projeto_id", projetosSelecionados);
      await supabase.from("projetos").delete().in("id", projetosSelecionados);
      setProjetosSelecionados([]);
      setConfirmarDelete(false);
      fetchUserDataAndProjects();
    } catch (err) {
      console.error("Erro ao deletar projetos:", err);
    } finally {
      setDeletandoProjetos(false);
    }
  };

  // NOVO: handler de reanálise
  const handleReanalise = async () => {
    if (projetosSelecionados.length !== 1) return;
    const projetoId = projetosSelecionados[0];
    try {
      setRodandoReanalise(true);
      if (arquivoReanaliseFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fileExt = arquivoReanaliseFile.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}.${fileExt}`;
          await supabase.storage.from("projetos-pdf").upload(filePath, arquivoReanaliseFile);
          await supabase.from("projetos").update({ pdf_path: filePath, pdf_nome: arquivoReanaliseFile.name }).eq("id", projetoId);
        }
      }
      await supabase.from("validacoes").delete().eq("projeto_id", projetoId);
      await supabase.from("pareceres").delete().eq("projeto_id", projetoId);
      await supabase.from("projetos").update({ status: "pendente", score_conformidade: 0 }).eq("id", projetoId);
      setReanaliseOpen(false);
      setArquivoReanalise("");
      setArquivoReanaliseFile(null);
      setProjetosSelecionados([]);
      fetchUserDataAndProjects();
      navigate(`/projetos/${projetoId}`);
    } catch (err) {
      console.error("Erro ao rodar reanálise:", err);
    } finally {
      setRodandoReanalise(false);
    }
  };

  const toggleSelecionado = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjetosSelecionados(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleTodos = (lista: Projeto[]) => {
    const ids = lista.map(p => p.id);
    const todosSelecionados = ids.every(id => projetosSelecionados.includes(id));
    if (todosSelecionados) {
      setProjetosSelecionados(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setProjetosSelecionados(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProjeto.trim()) { setErroCriar("Por favor, preencha o nome do projeto."); return; }
    try {
      setCriandoProjeto(true);
      setErroCriar("");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      let pdfPath = null;
      let pdfNome = null;
      if (arquivoSelecionado) {
        const fileExt = arquivoSelecionado.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("projetos-pdf").upload(filePath, arquivoSelecionado);
        if (!uploadError) { pdfPath = filePath; pdfNome = arquivoSelecionado.name; }
      }

      const { data: newProj, error } = await supabase
        .from("projetos")
        .insert({ nome_projeto: nomeProjeto.trim(), tipo_estabelecimento: tipoEstabelecimento, user_id: user.id, status: "pendente", score_conformidade: 0, pdf_path: pdfPath, pdf_nome: pdfNome })
        .select("id")
        .single();

      if (error || !newProj) throw error || new Error("Falha ao criar o projeto.");
      setNovoProjetoOpen(false);
      setNomeProjeto("");
      setTipoEstabelecimento("Hospital Geral");
      setArquivoName("");
      setArquivoSelecionado(null);
      fetchUserDataAndProjects();
      navigate(`/projetos/${newProj.id}`);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      setErroCriar(err.message || "Ocorreu um erro ao criar o projeto.");
    } finally {
      setCriandoProjeto(false);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  const totalProjetos = projetos.length;
  const aprovadosCount = projetos.filter(p => p.score_conformidade === 100 || p.status === "aprovado").length;
  const analisandoCount = projetos.filter(p => p.status === "analisando").length;
  const pendentesCount = projetos.filter(p => p.status === "pendente" && p.score_conformidade !== 100).length;

  const projetosFiltrados = projetos.filter((proj) => {
    const bateNome = proj.nome_projeto.toLowerCase().includes(filtroNomeProjeto.toLowerCase());
    const statusEfetivo = getStatusEfetivo(proj);
    const bateStatus = filtroStatusProjeto === "todos" || statusEfetivo === filtroStatusProjeto;
    return bateNome && bateStatus;
  });

  const projetosRecentes = projetos.slice(0, 5);
  const regrasFiltradas = regras.filter((regra) => {
    const bateNorma = filtroNorma === "todas" || regra.norma_origem === filtroNorma;
    const busca = filtroBuscaRegra.toLowerCase();
    return bateNorma && (regra.descricao.toLowerCase().includes(busca) || regra.codigo.toLowerCase().includes(busca) || regra.categoria.toLowerCase().includes(busca));
  });
  const normasDisponiveis = Array.from(new Set(regras.map((r) => r.norma_origem)));

  const getStatusBadge = (proj: Projeto) => {
    const status = getStatusEfetivo(proj);
    switch (status) {
      case "aprovado": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-[#16A34A] border border-green-200"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />APROVADO</span>;
      case "analisando": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1E3A5F] border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F]" />Em análise</span>;
      case "parcial": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Parcial</span>;
      case "reprovado": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#DC2626] border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />Reprovado</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-[#64748B] border border-gray-200"><span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />Pendente</span>;
    }
  };

  // Barra de ações quando há selecionados
  const BarraAcoes = ({ lista }: { lista: Projeto[] }) => (
    projetosSelecionados.length > 0 ? (
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 gap-3 flex-wrap">
        <span className="text-sm text-slate-700 font-medium">{projetosSelecionados.length} projeto(s) selecionado(s)</span>
        <div className="flex gap-2">
          {/* NOVO: botão Reanálise aparece só quando 1 projeto selecionado */}
          {projetosSelecionados.length === 1 && (
            <Button onClick={() => setReanaliseOpen(true)} className="bg-[#1E3A5F] hover:bg-[#162d4a] text-white gap-2 h-8 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />Reanálise
            </Button>
          )}
          <Button onClick={() => setConfirmarDelete(true)} disabled={deletandoProjetos} className="bg-red-600 hover:bg-red-700 text-white gap-2 h-8 text-xs">
            <Trash2 className="w-3.5 h-3.5" />Excluir selecionados
          </Button>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-primary">VISAcheck GO</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "dashboard" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"}`}><Home className="w-4 h-4" />Dashboard</button>
          <button onClick={() => setActiveTab("projetos")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "projetos" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"}`}><Folder className="w-4 h-4" />Meus Projetos</button>
          <button onClick={() => setActiveTab("normas")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "normas" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"}`}><BookOpen className="w-4 h-4" />Base de Normas</button>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-red-50 transition-all duration-200"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <header className="border-b border-border bg-white py-5 px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-[#1E293B]">{loadingUser ? <span className="h-6 w-32 bg-slate-100 animate-pulse rounded block" /> : `Olá, ${userName}`}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Seja bem-vindo ao portal de diagnósticos do VISAcheck GO.</p>
          </div>
          <Button onClick={() => navigate("/analise")} className="gap-2 bg-primary hover:bg-primary-hover text-white shadow-sm">
            <Plus className="w-4 h-4" />Novo Projeto
          </Button>
        </header>

        <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: "Total de Projetos", value: totalProjetos, icon: <Folder className="w-5 h-5" />, bg: "bg-slate-50 text-[#1E3A5F]" },
              { label: "Aprovados", value: aprovadosCount, icon: <CheckCircle2 className="w-5 h-5" />, bg: "bg-green-50 text-[#16A34A]" },
              { label: "Em Análise", value: analisandoCount, icon: <Search className="w-5 h-5" />, bg: "bg-blue-50 text-primary" },
              { label: "Pendentes", value: pendentesCount, icon: <Clock className="w-5 h-5" />, bg: "bg-gray-50 text-slate-600" },
            ].map(({ label, value, icon, bg }) => (
              <div key={label} className="bg-white border border-border p-6 rounded-xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
                  <p className="text-2xl font-bold text-[#1E293B]">{loadingProjetos ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : value}</p>
                </div>
                <div className={`p-3 ${bg} rounded-lg`}>{icon}</div>
              </div>
            ))}
          </section>

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#1E293B]">Projetos Recentes</h2>
                {projetos.length > 5 && <button onClick={() => setActiveTab("projetos")} className="text-xs font-semibold text-primary hover:underline">Ver todos ({projetos.length})</button>}
              </div>
              {loadingProjetos ? (
                <div className="bg-white border border-border rounded-xl p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : projetos.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-12 text-center shadow-sm">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-12 h-12 bg-slate-50 text-muted-foreground rounded-full flex items-center justify-center mx-auto"><Folder className="w-6 h-6" /></div>
                    <h3 className="text-base font-semibold">Nenhum projeto cadastrado</h3>
                    <p className="text-sm text-muted-foreground">Clique em + Novo Projeto para começar.</p>
                    <Button onClick={() => navigate("/analise")} className="bg-primary hover:bg-primary-hover text-white gap-2"><Plus className="w-="w-4 h-4" />Começar agora</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <BarraAcoes lista={projetosRecentes} />
                  <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-slate-50/50">
                          <th className="px-4 py-4 w-10"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 cursor-pointer" checked={projetosRecentes.length > 0 && projetosRecentes.every(p => projetosSelecionados.includes(p.id))} onChange={() => toggleTodos(projetosRecentes)} /></th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Nome</th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Tipo de Estabelecimento</th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {projetosRecentes.map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer" onClick={() => navigate(`/projetos/${proj.id}`)}>
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-gray-300 cursor-pointer" checked={projetosSelecionados.includes(proj.id)} onChange={(e) => toggleSelecionado(proj.id, e as any)} /></td>
                            <td className="px-6 py-4"><span className="font-semibold text-sm text-[#1E293B] block">{proj.nome_projeto}</span></td>
                            <td className="px-6 py-4 text-sm text-slate-600">{proj.tipo_estabelecimento || "Não informado"}</td>
                            <td className="px-6 py-4">{getStatusBadge(proj)}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(proj.created_at).toLocaleDateString("pt-BR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "projetos" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-lg font-bold text-[#1E293B]">Lista Geral de Projetos</h2>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar pelo nome..." value={filtroNomeProjeto} onChange={(e) => setFiltroNomeProjeto(e.target.value)} className="pl-9" />
                  </div>
                  <select value={filtroStatusProjeto} onChange={(e) => setFiltroStatusProjeto(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="todos">Todos os Status</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="analisando">Em análise</option>
                    <option value="parcial">Parcial</option>
                    <option value="pendente">Pendente</option>
                    <option value="reprovado">Reprovado</option>
                  </select>
                </div>
              </div>
              {loadingProjetos ? (
                <div className="bg-white border border-border rounded-xl p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : projetosFiltrados.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-12 text-center shadow-sm">
                  <Info className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-base font-semibold">Nenhum projeto encontrado</h3>
                  <Button variant="outline" onClick={() => { setFiltroNomeProjeto(""); setFiltroStatusProjeto("todos"); }} className="mt-3">Limpar Filtros</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <BarraAcoes lista={projetosFiltrados} />
                  <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-slate-50/50">
                          <th className="px-4 py-4 w-10"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 cursor-pointer" checked={projetosFiltrados.length > 0 && projetosFiltrados.every(p => projetosSelecionados.includes(p.id))} onChange={() => toggleTodos(projetosFiltrados)} /></th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Nome do Projeto</th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Estabelecimento</th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Pontuação</th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Criado em</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {projetosFiltrados.map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer" onClick={() => navigate(`/projetos/${proj.id}`)}>
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-gray-300 cursor-pointer" checked={projetosSelecionados.includes(proj.id)} onChange={(e) => toggleSelecionado(proj.id, e as any)} /></td>
                            <td className="px-6 py-4"><span className="font-semibold text-sm text-[#1E293B] block">{proj.nome_projeto}</span></td>
                            <td className="px-6 py-4 text-sm text-slate-600">{proj.tipo_estabelecimento || "Não informado"}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${proj.score_conformidade >= 80 ? "text-green-600" : proj.score_conformidade >= 50 ? "text-amber-600" : "text-red-600"}`}>{proj.score_conformidade ?? 0}%</span>
                                <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${proj.score_conformidade >= 80 ? "bg-green-600" : proj.score_conformidade >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${proj.score_conformidade ?? 0}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(proj)}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(proj.created_at).toLocaleDateString("pt-BR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "normas" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-[#1E293B]">Base de Regras e Normas</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Consulte as diretrizes regulatórias utilizadas na análise.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar regra..." value={filtroBuscaRegra} onChange={(e) => setFiltroBuscaRegra(e.target.value)} className="pl-9" />
                  </div>
                  <select value={filtroNorma} onChange={(e) => setFiltroNorma(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="todas">Todas as Normas</option>
                    {normasDisponiveis.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </select>
                </div>
              </div>
              {loadingRegras ? (
                <div className="bg-white border border-border rounded-xl p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : regrasFiltradas.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-12 text-center">
                  <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-base font-semibold">Nenhuma regra encontrada</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regrasFiltradas.map((r) => (
                    <div key={r.id} className="bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{r.norma_origem}</span>
                          <span className="text-xs text-muted-foreground block font-mono">{r.codigo}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">{r.categoria}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3">{r.descricao}</p>
                      {r.subcategoria && <p className="text-[10px] text-muted-foreground mt-2">{r.subcategoria}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL NOVO PROJETO */}
      <Dialog open={novoProjetoOpen} onOpenChange={setNovoProjetoOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2"><FileText className="w-5 h-5" />Novo Diagnóstico Regulatório</DialogTitle>
            <DialogDescription>Insira os dados do projeto para iniciar a análise automatizada.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Nome do Projeto</Label>
              <Input id="proj-name" value={nomeProjeto} onChange={(e) => setNomeProjeto(e.target.value)} placeholder="Ex: Clínicas Reunidas - Bloco A" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="establishment-type">Tipo de Estabelecimento</Label>
              <select id="establishment-type" value={tipoEstabelecimento} onChange={(e) => setTipoEstabelecimento(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="Hospital Geral">Hospital Geral</option>
                <option value="Clínica Médica">Clínica Médica / Ambulatório</option>
                <option value="Consultório">Consultório Individual</option>
                <option value="CME">CME (Central de Materiais)</option>
                <option value="Laboratório">Laboratório de Análises</option>
                <option value="Distribuidora">Distribuidora de Produtos de Saúde</option>
                <option value="Outro">Outro Estabelecimento de Saúde</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-file">Anexar Prancha Arquitetônica (PDF / DWG)</Label>
              <div className="flex gap-2">
                <Input id="proj-file-dummy" type="text" placeholder="Selecione um arquivo..." value={arquivoName} readOnly className="bg-slate-50 cursor-pointer flex-1" onClick={() => document.getElementById("real-file-input")?.click()} />
                <Button type="button" variant="outline" onClick={() => document.getElementById("real-file-input")?.click()}>Procurar</Button>
              </div>
              <input id="real-file-input" type="file" accept=".pdf,.dwg,.dxf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setArquivoSelecionado(file); setArquivoName(file.name); } }} />
              <p className="text-[10px] text-muted-foreground">Arquivos suportados: PDF ou DWG até 50MB.</p>
            </div>
            {erroCriar && <div className="bg-red-50 text-[#DC2626] border border-red-100 rounded-lg p-3 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span className="text-xs">{erroCriar}</span></div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNovoProjetoOpen(false)} disabled={criandoProjeto}>Cancelar</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-hover text-white gap-2" disabled={criandoProjeto}>
                {criandoProjeto ? <><Loader2 className="w-4 h-4 animate-spin" />Criando...</> : <>Iniciar Análise<Plus className="w-4 h-4" /></>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL REANÁLISE */}
      {reanaliseOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-[#1E3A5F]" />
              <h2 className="text-base font-bold text-[#1E293B]">Reanálise Regulatória</h2>
            </div>
            <p className="text-sm text-slate-600">Anexe o projeto corrigido para substituir o anterior e iniciar uma nova análise completa.</p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Projeto corrigido (PDF / DWG)</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Selecione o arquivo corrigido..." value={arquivoReanalise} readOnly className="flex-1 h-9 px-3 rounded-md border border-input bg-slate-50 text-sm cursor-pointer" onClick={() => document.getElementById("reanalise-file")?.click()} />
                <button type="button" onClick={() => document.getElementById("reanalise-file")?.click()} className="px-3 h-9 rounded-md border border-input text-sm hover:bg-slate-50">Procurar</button>
              </div>
              <input id="reanalise-file" type="file" accept=".pdf,.dwg,.dxf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setArquivoReanaliseFile(file); setArquivoReanalise(file.name); } }} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <strong>Atenção:</strong> Os resultados anteriores serão substituídos completamente.
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setReanaliseOpen(false); setArquivoReanalise(""); setArquivoReanaliseFile(null); }} disabled={rodandoReanalise} className="flex-1 h-9 rounded-md border border-input text-sm hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button onClick={handleReanalise} disabled={rodandoReanalise} className="flex-1 h-9 rounded-md bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] disabled:opacity-50 flex items-center justify-center gap-2">
                {rodandoReanalise ? <><Loader2 className="w-4 h-4 animate-spin" />Processando...</> : <><RefreshCw className="w-4 h-4" />Iniciar Reanálise</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR DELEÇÃO */}
      {confirmarDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div>
                <h2 className="text-base font-bold text-[#1E293B]">Excluir projetos</h2>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Tem certeza que deseja excluir <strong>{projetosSelecionados.length} projeto(s)</strong>? Todos os dados serão removidos permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarDelete(false)} disabled={deletandoProjetos} className="flex-1 h-9 rounded-md border border-input text-sm hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button onClick={handleDeletarSelecionados} disabled={deletandoProjetos} className="flex-1 h-9 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deletandoProjetos ? <><Loader2 className="w-4 h-4 animate-spin" />Excluindo...</> : <><Trash2 className="w-4 h-4" />Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
