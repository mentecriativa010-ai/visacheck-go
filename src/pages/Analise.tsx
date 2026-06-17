import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, Home, Folder, BookOpen, LogOut, ArrowLeft,
  CheckCircle, AlertTriangle, AlertOctagon, ChevronRight,
  ChevronLeft, Loader2, ClipboardList, BarChart2, Download,
  Zap, Upload, XCircle, Building2,
} from "lucide-react";
import { extrairTextoPDF, analisarComGroq, ResultadoAnalise } from "@/services/groqService";
import ThemeToggle from "@/components/ThemeToggle";

interface Regra {
  id: string;
  codigo: string;
  descricao: string;
  norma_origem: string | null;
  categoria: string | null;
  subcategoria: string | null;
  ambiente: string[] | null;
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

const AMBIENTES_POR_TIPO: Record<string, string[]> = {
  "Hospital Geral": [
    "Centro Cirúrgico",
    "CME",
    "UTI",
    "Pronto Socorro",
    "Internação",
    "Ambulatório",
    "Farmácia",
    "Laboratório",
    "Radiologia",
    "Geral",
  ],
  "Clínica Médica": ["Ambulatório", "Farmácia", "Laboratório", "Geral"],
  "Consultório": ["Ambulatório", "Geral"],
  "CME": ["CME", "Geral"],
  "Laboratório": ["Laboratório", "Geral"],
  "Distribuidora": ["Farmácia", "Geral"],
  "Outro": ["Geral"],
};

type EtapaIA = "idle" | "extraindo_pdf" | "analisando" | "salvando" | "concluido" | "erro";

export default function Analise() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [passo, setPasso] = useState(1);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState("Hospital Geral");
  const [ambientesSelecionados, setAmbientesSelecionados] = useState<string[]>([]);
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);

  const [etapaIA, setEtapaIA] = useState<EtapaIA>("idle");
  const [progressoIA, setProgressoIA] = useState(0);
  const [erroIA, setErroIA] = useState<string | null>(null);

  const [regras, setRegras] = useState<Regra[]>([]);
  const [respostas, setRespostas] = useState<Record<string, "conforme" | "nao_conforme" | "nao_aplicavel">>({});
  const [projetoSalvoId, setProjetoSalvoId] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState("");
  const [resultadoIA, setResultadoIA] = useState<ResultadoAnalise | null>(null);

  useEffect(() => { verificarAuth(); }, []);

  useEffect(() => {
    // Quando muda o tipo, reseta ambientes selecionados
    setAmbientesSelecionados([]);
  }, [tipoEstabelecimento]);

  const verificarAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) navigate("/login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const toggleAmbiente = (amb: string) => {
    setAmbientesSelecionados(prev =>
      prev.includes(amb) ? prev.filter(a => a !== amb) : [...prev, amb]
    );
  };

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.type !== "application/pdf") {
      alert("Por favor, selecione um arquivo PDF.");
      return;
    }
    setArquivoNome(arquivo.name);
    setErroIA(null);
  };

  const iniciarAnaliseAutomatica = async () => {
    if (!nomeProjeto.trim() || !inputRef.current?.files?.[0]) return;
    const arquivo = inputRef.current.files[0];

    setErroIA(null);
    setEtapaIA("extraindo_pdf");
    setProgressoIA(10);

    try {
      const textoPDF = await extrairTextoPDF(arquivo);

      setEtapaIA("analisando");
      setProgressoIA(30);

      // Monta query filtrando por ambientes selecionados
      let query = supabase
        .from("regras_regulatorias")
        .select("id, codigo, descricao, norma_origem, categoria, subcategoria, ambiente")
        .order("categoria", { ascending: true });

      // Se há ambientes selecionados, filtra por eles
      if (ambientesSelecionados.length > 0) {
        query = query.overlaps("ambiente", ambientesSelecionados);
      }

      const { data: regrasData, error: erroRegras } = await query;

      if (erroRegras || !regrasData || regrasData.length === 0) {
        throw new Error("Não foi possível buscar as regras do banco de dados.");
      }

      setRegras(regrasData as Regra[]);
      setProgressoIA(50);

      const analise = await analisarComGroq(textoPDF, regrasData as any);

      if (analise.erro) throw new Error(analise.erro);

      setProgressoIA(75);
      setResultadoIA(analise);

      const novasRespostas: Record<string, "conforme" | "nao_conforme" | "nao_aplicavel"> = {};
      regrasData.forEach((r: Regra) => { novasRespostas[r.id] = "nao_aplicavel"; });
      analise.resultados.forEach((res) => {
        if (novasRespostas.hasOwnProperty(res.regra_id)) {
          novasRespostas[res.regra_id] = res.status;
        }
      });
      setRespostas(novasRespostas);
      if (regrasData.length > 0) setCategoriaAtiva(regrasData[0].categoria ?? "");

      setEtapaIA("salvando");
      setProgressoIA(85);
      await salvarNoBanco(regrasData as Regra[], novasRespostas, analise.score_geral, analise.resumo);

      setProgressoIA(100);
      setEtapaIA("concluido");
      setPasso(3);
    } catch (err: any) {
      setErroIA(err.message || "Erro desconhecido na análise.");
      setEtapaIA("erro");
    }
  };

  const totalConformes = Object.values(respostas).filter(v => v === "conforme").length;
  const totalNaoConformes = Object.values(respostas).filter(v => v === "nao_conforme").length;
  const totalAplicaveis = Object.values(respostas).filter(v => v !== "nao_aplicavel").length;
  const scoreCalculado = resultadoIA?.score_geral ?? (totalAplicaveis > 0 ? Math.round((totalConformes / totalAplicaveis) * 100) : 0);

  const categorias = [...new Set(regras.map(r => r.categoria))];
  const regrasPorCategoria = regras.filter(r => r.categoria === categoriaAtiva);
  const naoConformidades = regras.filter(r => respostas[r.id] === "nao_conforme");

  const validacoesPorCategoria = categorias.map(cat => {
    const regrasCat = regras.filter(r => r.categoria === cat);
    const aplicaveis = regrasCat.filter(r => respostas[r.id] !== "nao_aplicavel");
    const conformes = regrasCat.filter(r => respostas[r.id] === "conforme");
    const naoConf = regrasCat.filter(r => respostas[r.id] === "nao_conforme");
    const pct = aplicaveis.length > 0 ? Math.round((conformes.length / aplicaveis.length) * 100) : 100;
    return { categoria: cat, total: aplicaveis.length, conformes: conformes.length, naoConformes: naoConf.length, percentual: pct };
  });

  const salvarNoBanco = async (
    regrasParam: Regra[],
    respostasParam: Record<string, "conforme" | "nao_conforme" | "nao_aplicavel">,
    score: number,
    resumo: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: proj, error: projError } = await supabase
      .from("projetos")
      .insert({
        nome_projeto: nomeProjeto,
        tipo_estabelecimento: tipoEstabelecimento,
        user_id: user.id,
        status: score === 100 ? "aprovado" : totalNaoConformes > 0 ? "reprovado" : "pendente",
        score_conformidade: score,
        resumo_executivo: resumo,
      })
      .select("id")
      .single();

    if (projError || !proj) throw projError;

    const validacoes = regrasParam
      .filter(r => respostasParam[r.id] !== "nao_aplicavel")
      .map(r => ({
        projeto_id: proj.id,
        regra_id: r.id,
        status: respostasParam[r.id] === "conforme" ? "aprovado" : "reprovado",
        observacao: respostasParam[r.id] === "conforme" ? "Conforme — análise automática por IA" : "Não conformidade identificada pela IA",
      }));

    if (validacoes.length > 0) {
      await supabase.from("validacoes").insert(validacoes);
    }

    await supabase.from("pareceres").insert({
      projeto_id: proj.id,
      parecer: resumo,
      nivel_risco: score === 100 ? "baixo" : score >= 70 ? "medio" : "alto",
    });

    setProjetoSalvoId(proj.id);
  };

  const exportarRelatorio = () => {
    const linhas = [
      `RELATÓRIO DE CONFORMIDADE REGULATÓRIA`,
      `VISAcheck GO — Diagnóstico Automático por IA`,
      ``,
      `Projeto: ${nomeProjeto}`,
      `Tipo: ${tipoEstabelecimento}`,
      `Ambientes analisados: ${ambientesSelecionados.length > 0 ? ambientesSelecionados.join(", ") : "Todos"}`,
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

  const emProgresso = etapaIA !== "idle" && etapaIA !== "concluido" && etapaIA !== "erro";
  const ambientesDisponiveis = AMBIENTES_POR_TIPO[tipoEstabelecimento] || ["Geral"];
  const podeComecar = nomeProjeto.trim() && arquivoNome && !emProgresso;

  const mensagemEtapa: Record<EtapaIA, string> = {
    idle: "",
    extraindo_pdf: "Lendo o PDF...",
    analisando: `IA analisando ${ambientesSelecionados.length > 0 ? `regras de: ${ambientesSelecionados.join(", ")}` : "todas as regras"}... (pode levar até 30s)`,
    salvando: "Salvando resultados...",
    concluido: "Análise concluída!",
    erro: "Erro na análise",
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#1E293B]">
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
           <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <header className="border-b border-border bg-white py-5 px-8 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-semibold text-[#1E293B]">Nova Análise Regulatória</h1>
            <p className="text-xs text-muted-foreground">Diagnóstico automático por IA — ANVISA e ABNT</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {[1, 2].map(p => (
              <div key={p} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${passo >= p ? "bg-[#1E3A5F] text-white" : "bg-slate-100 text-slate-400"}`}>{p}</div>
                {p < 2 && <div className={`w-8 h-0.5 ${passo > p ? "bg-[#1E3A5F]" : "bg-slate-200"}`} />}
              </div>
            ))}
            <div className="ml-3 text-xs text-muted-foreground">
              {passo === 1 ? "Dados do projeto" : "Resultado"}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-2xl w-full mx-auto">

          {passo === 1 && (
            <div className="space-y-6">
              <div className="bg-white border border-border rounded-xl p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-[#1E3A5F]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#1E293B]">Análise Automática com IA</h2>
                  <p className="text-sm text-muted-foreground">Preencha os dados e faça upload do PDF — a IA avalia as regras dos ambientes selecionados</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Projeto</Label>
                    <Input id="nome" value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} placeholder="Ex: UPA Norte — Reforma Ala B" disabled={emProgresso} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Estabelecimento</Label>
                    <select id="tipo" value={tipoEstabelecimento} onChange={e => setTipoEstabelecimento(e.target.value)} disabled={emProgresso} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      {TIPOS_ESTABELECIMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* SUBMENU DE AMBIENTES */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#1E3A5F]" />
                      <Label>Ambientes a analisar</Label>
                      <span className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                        {ambientesSelecionados.length === 0 ? "Nenhum selecionado = todos" : `${ambientesSelecionados.length} selecionado(s)`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ambientesDisponiveis.map(amb => (
                        <button
                          key={amb}
                          type="button"
                          disabled={emProgresso}
                          onClick={() => toggleAmbiente(amb)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            ambientesSelecionados.includes(amb)
                              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                              : "bg-white text-slate-600 border-slate-200 hover:border-[#1E3A5F] hover:text-[#1E3A5F]"
                          } ${emProgresso ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {amb}
                        </button>
                      ))}
                    </div>
                    {ambientesSelecionados.length === 0 && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        ⚠️ Sem seleção, todas as {ambientesDisponiveis.length} categorias serão analisadas. Selecione os ambientes do projeto para uma análise mais precisa.
                      </p>
                    )}
                  </div>

                  {/* UPLOAD DO PDF */}
                  <div className="space-y-2">
                    <Label>PDF do Projeto</Label>
                    <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleArquivo} disabled={emProgresso} />
                    <div
                      onClick={() => { if (!emProgresso) inputRef.current?.click(); }}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${arquivoNome ? "border-green-300 bg-green-50/50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"} ${emProgresso ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {arquivoNome ? (
                        <div className="flex items-center justify-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{arquivoNome}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                          <p className="text-sm text-slate-500">Clique para selecionar o PDF</p>
                          <p className="text-xs text-slate-400">Planta baixa, memorial descritivo, laudo técnico...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {emProgresso && (
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mensagemEtapa[etapaIA]}
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressoIA}%` }} />
                    </div>
                    <p className="text-xs text-blue-600">{progressoIA}% concluído</p>
                  </div>
                )}

                {etapaIA === "erro" && erroIA && (
                  <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                      <XCircle className="w-4 h-4" />
                      Erro na análise
                    </div>
                    <p className="text-xs text-red-600">{erroIA}</p>
                    <Button variant="outline" size="sm" onClick={() => { setEtapaIA("idle"); setErroIA(null); setProgressoIA(0); }} className="text-xs">
                      Tentar novamente
                    </Button>
                  </div>
                )}

                <Button
                  onClick={iniciarAnaliseAutomatica}
                  disabled={!podeComecar}
                  className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] text-white gap-2"
                >
                  {emProgresso
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando...</>
                    : <><Zap className="w-4 h-4" />Analisar com IA<ChevronRight className="w-4 h-4" /></>
                  }
                </Button>

                <p className="text-center text-xs text-slate-400">
                  Usa OpenRouter (modelo gratuito) — análise por ambientes selecionados
                </p>
              </div>
            </div>
          )}

          {passo === 3 && (
            <div className="space-y-8">
              {ambientesSelecionados.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Ambientes analisados</p>
                    <p className="text-xs text-blue-700">{ambientesSelecionados.join(" • ")}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Score de Conformidade</h3>
                  <div>
                    <span className={`text-5xl font-extrabold ${scoreCalculado >= 80 ? "text-[#16A34A]" : scoreCalculado >= 50 ? "text-[#D97706]" : "text-[#DC2626]"}`}>{scoreCalculado}%</span>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-3">
                      <div className={`h-3 rounded-full ${scoreCalculado >= 80 ? "bg-[#16A34A]" : scoreCalculado >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"}`} style={{ width: `${scoreCalculado}%` }} />
                    </div>
                    <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${scoreCalculado === 100 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {scoreCalculado === 100 ? "✔ APROVADO" : `${totalNaoConformes} não-conformidades`}
                    </span>
                  </div>
                </div>
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm md:col-span-2">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Resumo da Análise</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {resultadoIA?.resumo || (scoreCalculado === 100
                      ? `O projeto "${nomeProjeto}" atende a todas as especificações regulatórias verificadas para ${tipoEstabelecimento}.`
                      : `O diagnóstico de "${nomeProjeto}" (${tipoEstabelecimento}) identificou ${totalNaoConformes} não-conformidades. Score global: ${scoreCalculado}%.`
                    )}
                  </p>
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" /><span className="font-semibold">{totalConformes} conformes</span></div>
                    <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /><span className="font-semibold">{totalNaoConformes} não-conformes</span></div>
                    <div className="flex items-center gap-2 text-slate-500"><AlertOctagon className="w-4 h-4" /><span className="font-semibold">{regras.length - totalAplicaveis} não aplicáveis</span></div>
                  </div>
                </div>
              </div>

              {regras.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">Checklist Preenchido pela IA</h2>
                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">Você pode revisar abaixo</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Categorias</p>
                      {categorias.map(cat => {
                        const regrasCat = regras.filter(r => r.categoria === cat);
                        const respondidas = regrasCat.filter(r => respostas[r.id] !== "nao_aplicavel").length;
                        return (
                          <button key={cat} onClick={() => setCategoriaAtiva(cat ?? "")} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${categoriaAtiva === cat ? "bg-[#1E3A5F] text-white font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
                            <span className="block truncate">{cat}</span>
                            <span className={`text-[10px] ${categoriaAtiva === cat ? "text-blue-200" : "text-muted-foreground"}`}>{respondidas}/{regrasCat.length}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="col-span-3 space-y-2 max-h-96 overflow-y-auto pr-1">
                      {regrasPorCategoria.map(regra => (
                        <div key={regra.id} className={`bg-white border rounded-xl p-3 shadow-sm transition-all ${respostas[regra.id] === "conforme" ? "border-green-200 bg-green-50/30" : respostas[regra.id] === "nao_conforme" ? "border-red-200 bg-red-50/30" : "border-border"}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-[#1E3A5F] bg-[#1E3A5F]/10 px-2 py-0.5 rounded">{regra.norma_origem}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{regra.codigo}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">{regra.descricao}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => setRespostas(prev => ({ ...prev, [regra.id]: "conforme" }))} className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${respostas[regra.id] === "conforme" ? "bg-green-600 text-white border-green-600" : "border-green-300 text-green-700 hover:bg-green-50"}`}>✔</button>
                              <button onClick={() => setRespostas(prev => ({ ...prev, [regra.id]: "nao_conforme" }))} className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${respostas[regra.id] === "nao_conforme" ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-700 hover:bg-red-50"}`}>✗</button>
                              <button onClick={() => setRespostas(prev => ({ ...prev, [regra.id]: "nao_aplicavel" }))} className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${respostas[regra.id] === "nao_aplicavel" ? "bg-slate-500 text-white border-slate-500" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>N/A</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1">
                        <Button variant="outline" size="sm" onClick={() => { const i = categorias.indexOf(categoriaAtiva); if (i > 0) setCategoriaAtiva(categorias[i - 1] ?? ""); }} disabled={categorias.indexOf(categoriaAtiva) === 0} className="gap-1 text-xs"><ChevronLeft className="w-3 h-3" />Anterior</Button>
                        <Button variant="outline" size="sm" onClick={() => { const i = categorias.indexOf(categoriaAtiva); if (i < categorias.length - 1) setCategoriaAtiva(categorias[i + 1] ?? ""); }} disabled={categorias.indexOf(categoriaAtiva) === categorias.length - 1} className="gap-1 text-xs">Próxima<ChevronRight className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

              {naoConformidades.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold">Não-Conformidades ({naoConformidades.length})</h2>
                  <div className="space-y-4">
                    {naoConformidades.map(nc => (
                      <div key={nc.id} className="bg-white border border-red-200 rounded-xl p-5 shadow-sm">
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
