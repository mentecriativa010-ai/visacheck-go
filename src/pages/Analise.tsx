import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, Home, Folder, BookOpen, LogOut, ArrowLeft,
  CheckCircle, AlertTriangle, AlertOctagon, ChevronRight,
  ChevronLeft, Loader2, ClipboardList, BarChart2, Download,
  ChevronDown, Upload, FileText, Sparkles,
} from "lucide-react";
import { analisarProjetoComIA } from "@/lib/openrouter";

const AMBIENTE_PARA_TIPOS: Record<string, string[]> = {
  "UTI Adulto":                    ["base", "hospital_uti"],
  "UTI Pediátrica":                ["base", "hospital_uti"],
  "UTI Neonatal":                  ["base", "hospital_uti"],
  "CME":                           ["base", "hospital_cme"],
  "Centro Cirúrgico":              ["base", "hospital_cc"],
  "Radiologia":                    ["base", "hospital_radiologia"],
  "Hospital Geral":                ["base", "hospital_uti", "hospital_cme", "hospital_radiologia"],
  "Internação":                    ["base"],
  "Pronto Socorro":                ["base"],
  "Ambulatório":                   ["base"],
  "Consultório Odontológico":      ["base", "odontologia"],
  "Centro Cirúrgico Odontológico": ["base", "odontologia"],
  "Laboratório de Prótese":        ["base", "odontologia"],
  "Drogaria":                      ["base", "drogaria"],
  "Farmácia de Manipulação":       ["base", "farmacia_manipulacao"],
  "Distribuidora":                 ["distribuidora"],
  "Clínica Médica":                ["base"],
  "Laboratório":                   ["base"],
};

const GRUPOS_AMBIENTE = [
  { grupo: "Hospitalar", itens: ["UTI Adulto","UTI Pediátrica","UTI Neonatal","CME","Centro Cirúrgico","Radiologia","Hospital Geral","Internação","Pronto Socorro","Ambulatório"] },
  { grupo: "Odontologia", itens: ["Consultório Odontológico","Centro Cirúrgico Odontológico","Laboratório de Prótese"] },
  { grupo: "Farmácias / Distribuidoras", itens: ["Drogaria","Farmácia de Manipulação","Distribuidora"] },
  { grupo: "Outros", itens: ["Clínica Médica","Laboratório"] },
];

interface Regra {
  id: string; codigo: string; descricao: string;
  norma_origem: string | null; categoria: string | null;
  subcategoria: string | null; artigo_referencia: string | null;
  obrigatorio: boolean | null; valor_minimo: number | null;
  valor_maximo: number | null; unidade: string | null;
}

async function extrairTextoPDF(arquivo: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  const arrayBuffer = await arquivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let texto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const pagina = await pdf.getPage(i);
    const conteudo = await pagina.getTextContent();
    const linha = conteudo.items.map((item: unknown) => (item as { str: string }).str).join(" ");
    texto += `\n[Página ${i}]\n${linha}`;
  }
  return texto;
}

export default function Analise() {
  const navigate = useNavigate();
  const [passo, setPasso] = useState(1);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [arquivoPDF, setArquivoPDF] = useState<File | null>(null);
  const [textoPDF, setTextoPDF] = useState("");
  const [extraindoPDF, setExtraindoPDF] = useState(false);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [respostas, setRespostas] = useState<Record<string, "conforme" | "nao_conforme" | "nao_aplicavel">>({});
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [loadingRegras, setLoadingRegras] = useState(false);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [resumoIA, setResumoIA] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [projetoSalvoId, setProjetoSalvoId] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState("");
  const [erro, setErro] = useState("");

  const handlePDFChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setErro("Selecione um arquivo PDF válido."); return; }
    setArquivoPDF(file); setErro(""); setExtraindoPDF(true);
    try { setTextoPDF(await extrairTextoPDF(file)); }
    catch (err) { setErro("Erro ao extrair texto do PDF."); console.error(err); }
    finally { setExtraindoPDF(false); }
  };

  const carregarRegras = async (tipo: string): Promise<Regra[]> => {
    const tiposAlvo = AMBIENTE_PARA_TIPOS[tipo] ?? ["base"];
    const filtroTipos = tiposAlvo.map(t => `tipo_estabelecimento.eq.${t}`).join(",");
    const { data, error } = await supabase
      .from("regras_regulatorias")
      .select("id,codigo,descricao,norma_origem,categoria,subcategoria,artigo_referencia,obrigatorio,valor_minimo,valor_maximo,unidade")
      .or(`${filtroTipos},ambiente.cs.{"${tipo}"}`)
      .order("norma_origem", { ascending: true })
      .order("codigo", { ascending: true });
    if (error) throw error;
    return data ? [...new Map(data.map((r: Regra) => [r.id, r])).values()] : [];
  };

  const avancarPasso1 = async () => {
    if (!nomeProjeto.trim() || !tipoSelecionado) return;
    setLoadingRegras(true); setErro("");
    try {
      const regrasCarregadas = await carregarRegras(tipoSelecionado);
      if (regrasCarregadas.length === 0) {
        setErro(`Nenhuma regra encontrada para "${tipoSelecionado}".`);
        setLoadingRegras(false); return;
      }
      setRegras(regrasCarregadas);
      const init: Record<string, "conforme" | "nao_conforme" | "nao_aplicavel"> = {};
      regrasCarregadas.forEach(r => { init[r.id] = "nao_aplicavel"; });
      setRespostas(init);
      if (regrasCarregadas.length > 0) setCategoriaAtiva(regrasCarregadas[0].categoria ?? "");
      setLoadingRegras(false);
      if (textoPDF) {
        setAnalisandoIA(true); setPasso(2);
        try {
          const analise = await analisarProjetoComIA(textoPDF, tipoSelecionado,
            regrasCarregadas.map(r => ({ id: r.id, codigo: r.codigo, descricao: r.descricao, norma_origem: r.norma_origem }))
          );
          const novasRespostas = { ...init };
          const novasJustificativas: Record<string, string> = {};
          analise.resultados.forEach(res => {
            if (novasRespostas[res.id] !== undefined) {
              novasRespostas[res.id] = res.status;
              novasJustificativas[res.id] = res.justificativa;
            }
          });
          setRespostas(novasRespostas); setJustificativas(novasJustificativas); setResumoIA(analise.resumo);
        } catch (err) { console.error(err); setErro("Análise por IA falhou. Revise manualmente."); }
        finally { setAnalisandoIA(false); }
      } else { setPasso(2); }
    } catch (err: unknown) {
      setErro(`Erro: ${err instanceof Error ? err.message : "Desconhecido"}`);
      setLoadingRegras(false);
    }
  };

  const categorias = [...new Set(regras.map(r => r.categoria).filter(Boolean))] as string[];
  const regrasPorCategoria = regras.filter(r => r.categoria === categoriaAtiva);
  const totalConformes    = Object.values(respostas).filter(v => v === "conforme").length;
  const totalNaoConformes = Object.values(respostas).filter(v => v === "nao_conforme").length;
  const totalAplicaveis   = Object.values(respostas).filter(v => v !== "nao_aplicavel").length;
  const scoreCalculado    = totalAplicaveis > 0 ? Math.round((totalConformes / totalAplicaveis) * 100) : 0;

  const validacoesPorCategoria = categorias.map(cat => {
    const rc = regras.filter(r => r.categoria === cat);
    const ap = rc.filter(r => respostas[r.id] !== "nao_aplicavel");
    const co = rc.filter(r => respostas[r.id] === "conforme");
    const nc = rc.filter(r => respostas[r.id] === "nao_conforme");
    return { categoria: cat, total: ap.length, conformes: co.length, naoConformes: nc.length, percentual: ap.length > 0 ? Math.round((co.length / ap.length) * 100) : 100 };
  });
  const naoConformidades = regras.filter(r => respostas[r.id] === "nao_conforme");

  const salvarNoBanco = async () => {
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: proj, error: projError } = await supabase.from("projetos").insert({
        nome_projeto: nomeProjeto, tipo_estabelecimento: tipoSelecionado, user_id: user.id,
        status: scoreCalculado === 100 ? "aprovado" : totalNaoConformes > 0 ? "reprovado" : "pendente",
        score_conformidade: scoreCalculado,
      }).select("id").single();
      if (projError || !proj) throw projError;
      const validacoes = regras.filter(r => respostas[r.id] !== "nao_aplicavel").map(r => ({
        projeto_id: proj.id, regra_id: r.id,
        status: respostas[r.id] === "conforme" ? "aprovado" : "reprovado",
        observacao: observacoes[r.id] || justificativas[r.id] || (respostas[r.id] === "conforme" ? "Conforme" : "Não conformidade"),
      }));
      if (validacoes.length > 0) await supabase.from("validacoes").insert(validacoes);
      await supabase.from("pareceres").insert({
        projeto_id: proj.id,
        parecer: resumoIA || (scoreCalculado === 100 ? `"${nomeProjeto}" atende a todas as especificações para ${tipoSelecionado}.` : `Identificadas ${totalNaoConformes} não-conformidades. Score: ${scoreCalculado}%.`),
        nivel_risco: scoreCalculado === 100 ? "baixo" : scoreCalculado >= 70 ? "medio" : "alto",
      });
      setProjetoSalvoId(proj.id); setPasso(3);
    } catch (err) { console.error(err); }
    finally { setSalvando(false); }
  };

  const exportarRelatorio = () => {
    const linhas = [
      "RELATÓRIO DE CONFORMIDADE REGULATÓRIA", "VISAcheck GO", "",
      `Projeto: ${nomeProjeto}`, `Tipo: ${tipoSelecionado}`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`, `Score: ${scoreCalculado}%`,
      resumoIA ? `\nParecer IA: ${resumoIA}` : "", "",
      "VALIDAÇÕES POR CATEGORIA",
      ...validacoesPorCategoria.map(v => `  • ${v.categoria}: ${v.conformes}/${v.total} (${v.percentual}%)`),
      "", `NÃO-CONFORMIDADES (${naoConformidades.length})`,
      ...naoConformidades.map(nc => `  [${nc.norma_origem}] ${nc.codigo}\n  ${nc.descricao}${justificativas[nc.id] ? `\n  IA: ${justificativas[nc.id]}` : ""}${observacoes[nc.id] ? `\n  Obs: ${observacoes[nc.id]}` : ""}`),
      "", `Gerado pelo VISAcheck GO em ${new Date().toLocaleString("pt-BR")}`,
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `VISAcheck_${nomeProjeto.replace(/\s+/g, "_")}.txt`;
    a.click(); URL.revokeObjectURL(url);
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
        <div className="p-4 border-t border-border">
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <header className="border-b border-border bg-white py-5 px-8 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-xl font-semibold">Nova Análise Regulatória</h1>
            <p className="text-xs text-muted-foreground">Diagnóstico automático por IA — ANVISA e ABNT</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {[1,2,3].map(p => (
              <div key={p} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${passo >= p ? "bg-[#1E3A5F] text-white" : "bg-slate-100 text-slate-400"}`}>{p}</div>
                {p < 3 && <div className={`w-8 h-0.5 ${passo > p ? "bg-[#1E3A5F]" : "bg-slate-200"}`} />}
              </div>
            ))}
            <div className="ml-3 text-xs text-muted-foreground">{passo === 1 ? "Dados do projeto" : passo === 2 ? "Checklist" : "Resultado"}</div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-5xl w-full mx-auto">

          {passo === 1 && (
            <div className="max-w-lg mx-auto">
              <div className="bg-white border border-border rounded-xl p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mx-auto"><ClipboardList className="w-6 h-6 text-[#1E3A5F]" /></div>
                  <h2 className="text-lg font-bold">Dados do Projeto</h2>
                  <p className="text-sm text-muted-foreground">Preencha as informações e anexe o PDF para análise automática por IA</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Projeto</Label>
                    <Input id="nome" value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} placeholder="Ex: UPA Norte — Reforma Ala B" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Ambiente</Label>
                    <div className="relative">
                      <button type="button" onClick={() => setDropdownAberto(p => !p)} className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm text-left flex items-center justify-between shadow-sm">
                        <span className={tipoSelecionado ? "text-[#1E293B]" : "text-muted-foreground"}>{tipoSelecionado || "Selecione..."}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {dropdownAberto && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                          {GRUPOS_AMBIENTE.map(g => (
                            <div key={g.grupo}>
                              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-slate-50">{g.grupo}</div>
                              {g.itens.map(item => (
                                <button key={item} type="button" onClick={() => { setTipoSelecionado(item); setDropdownAberto(false); }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1E3A5F]/5 ${tipoSelecionado === item ? "bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold" : ""}`}>{item}</button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {tipoSelecionado && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(AMBIENTE_PARA_TIPOS[tipoSelecionado] ?? []).map(t => (
                          <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1E3A5F]/10 text-[#1E3A5F]">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Projeto Arquitetônico (PDF)</Label>
                    <label htmlFor="pdf-upload" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${arquivoPDF ? "border-green-400 bg-green-50" : "border-border hover:border-[#1E3A5F]/40 hover:bg-slate-50"}`}>
                      {extraindoPDF ? (
                        <div className="flex flex-col items-center gap-2 text-[#1E3A5F]"><Loader2 className="w-6 h-6 animate-spin" /><span className="text-xs">Extraindo texto...</span></div>
                      ) : arquivoPDF ? (
                        <div className="flex flex-col items-center gap-2 text-green-700"><FileText className="w-6 h-6" /><span className="text-xs font-semibold">{arquivoPDF.name}</span><span className="text-[10px]">{textoPDF.length} caracteres extraídos</span></div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="w-6 h-6" /><span className="text-xs">Clique para anexar o PDF</span><span className="text-[10px]">A IA analisará automaticamente</span></div>
                      )}
                      <input id="pdf-upload" type="file" accept="application/pdf" className="hidden" onChange={handlePDFChange} />
                    </label>
                    {arquivoPDF && <button type="button" onClick={() => { setArquivoPDF(null); setTextoPDF(""); }} className="text-xs text-muted-foreground hover:text-red-500">× Remover PDF</button>}
                  </div>
                </div>
                {erro && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{erro}</div>}
                <Button onClick={avancarPasso1} disabled={!nomeProjeto.trim() || !tipoSelecionado || loadingRegras || extraindoPDF} className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] text-white gap-2">
                  {loadingRegras ? <><Loader2 className="w-4 h-4 animate-spin" />Carregando...</> : arquivoPDF && textoPDF ? <><Sparkles className="w-4 h-4" />Analisar com IA<ChevronRight className="w-4 h-4" /></> : <>Iniciar Checklist Manual<ChevronRight className="w-4 h-4" /></>}
                </Button>
                {!arquivoPDF && <p className="text-center text-xs text-muted-foreground">Sem PDF: checklist manual</p>}
              </div>
            </div>
          )}

          {passo === 2 && (
            <div className="space-y-6">
              {analisandoIA && (
                <div className="bg-[#1E3A5F] text-white rounded-xl p-4 flex items-center gap-3 shadow">
                  <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                  <div><p className="text-sm font-semibold">Analisando com IA...</p><p className="text-xs text-blue-200">Verificando normas para {tipoSelecionado}</p></div>
                </div>
              )}
              {resumoIA && !analisandoIA && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div><p className="text-sm font-semibold text-green-800">Análise por IA concluída</p><p className="text-xs text-green-700 mt-1">{resumoIA}</p><p className="text-[10px] text-green-600 mt-1">Revise os itens e ajuste se necessário.</p></div>
                </div>
              )}
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div><h2 className="text-sm font-bold">{nomeProjeto}</h2><p className="text-xs text-muted-foreground">{tipoSelecionado} · {regras.length} regras{arquivoPDF && <span className="ml-2 text-[#1E3A5F] font-medium">· {arquivoPDF.name}</span>}</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Respondidas</p><p className="text-lg font-bold text-[#1E3A5F]">{totalAplicaveis}<span className="text-sm font-normal text-muted-foreground">/{regras.length}</span></p></div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="h-2 rounded-full bg-[#1E3A5F] transition-all" style={{ width: `${regras.length > 0 ? (totalAplicaveis / regras.length) * 100 : 0}%` }} /></div>
              </div>
              <div className="grid grid-cols-4 gap-6">
                <div className="col-span-1 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Categorias</p>
                  {categorias.map(cat => {
                    const rc = regras.filter(r => r.categoria === cat);
                    const resp = rc.filter(r => respostas[r.id] !== "nao_aplicavel").length;
                    return (
                      <button key={cat} onClick={() => setCategoriaAtiva(cat)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${categoriaAtiva === cat ? "bg-[#1E3A5F] text-white font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
                        <span className="block truncate">{cat}</span>
                        <span className={`text-[10px] ${categoriaAtiva === cat ? "text-blue-200" : "text-muted-foreground"}`}>{resp}/{rc.length}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="col-span-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold">{categoriaAtiva}</h3>
                    <span className="text-xs text-muted-foreground">{regrasPorCategoria.length} regras</span>
                  </div>
                  {regrasPorCategoria.map(regra => (
                    <div key={regra.id} className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${respostas[regra.id] === "conforme" ? "border-green-200 bg-green-50/30" : respostas[regra.id] === "nao_conforme" ? "border-red-200 bg-red-50/30" : "border-border"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-[#1E3A5F] bg-[#1E3A5F]/10 px-2 py-0.5 rounded">{regra.norma_origem}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{regra.codigo}</span>
                            {regra.obrigatorio && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Obrigatório</span>}
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{regra.descricao}</p>
                          {regra.artigo_referencia && <p className="text-[10px] text-muted-foreground">Ref: {regra.artigo_referencia}</p>}
                          {(regra.valor_minimo != null || regra.valor_maximo != null) && (
                            <p className="text-[10px] text-muted-foreground">
                              {regra.valor_minimo != null && `Mín: ${regra.valor_minimo}${regra.unidade ?? ""}`}
                              {regra.valor_minimo != null && regra.valor_maximo != null && " · "}
                              {regra.valor_maximo != null && `Máx: ${regra.valor_maximo}${regra.unidade ?? ""}`}
                            </p>
                          )}
                          {justificativas[regra.id] && (
                            <div className="mt-1.5 flex items-start gap-1.5"><Sparkles className="w-3 h-3 text-[#1E3A5F] flex-shrink-0 mt-0.5" /><p className="text-[10px] text-[#1E3A5F] italic">{justificativas[regra.id]}</p></div>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => setRespostas(p => ({ ...p, [regra.id]: "conforme" }))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${respostas[regra.id] === "conforme" ? "bg-green-600 text-white border-green-600" : "border-green-300 text-green-700 hover:bg-green-50"}`}>✓ Conforme</button>
                          <button onClick={() => setRespostas(p => ({ ...p, [regra.id]: "nao_conforme" }))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${respostas[regra.id] === "nao_conforme" ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-700 hover:bg-red-50"}`}>✗ Não conforme</button>
                          <button onClick={() => setRespostas(p => ({ ...p, [regra.id]: "nao_aplicavel" }))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${respostas[regra.id] === "nao_aplicavel" ? "bg-slate-500 text-white border-slate-500" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>— N/A</button>
                        </div>
                      </div>
                      {respostas[regra.id] === "nao_conforme" && (
                        <div className="mt-3 pt-3 border-t border-red-100">
                          <Label className="text-xs text-muted-foreground mb-1 block">Descreva a não conformidade (opcional)</Label>
                          <textarea rows={2} className="w-full text-xs border border-input rounded-md px-3 py-2 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Ex: Corredor com 1,0 m — mínimo exigido é 1,5 m" value={observacoes[regra.id] ?? ""} onChange={e => setObservacoes(p => ({ ...p, [regra.id]: e.target.value }))} />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => { const i = categorias.indexOf(categoriaAtiva); if (i > 0) setCategoriaAtiva(categorias[i-1]); }} disabled={categorias.indexOf(categoriaAtiva) === 0} className="gap-2"><ChevronLeft className="w-4 h-4" />Anterior</Button>
                    {categorias.indexOf(categoriaAtiva) < categorias.length - 1
                      ? <Button onClick={() => { const i = categorias.indexOf(categoriaAtiva); setCategoriaAtiva(categorias[i+1]); }} className="bg-[#1E3A5F] text-white gap-2">Próxima<ChevronRight className="w-4 h-4" /></Button>
                      : <Button onClick={salvarNoBanco} disabled={salvando || analisandoIA} className="bg-green-600 hover:bg-green-700 text-white gap-2">{salvando ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <>Finalizar<ChevronRight className="w-4 h-4" /></>}</Button>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {passo === 3 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Score</h3>
                  <span className={`text-5xl font-extrabold ${scoreCalculado >= 80 ? "text-[#16A34A]" : scoreCalculado >= 50 ? "text-[#D97706]" : "text-[#DC2626]"}`}>{scoreCalculado}%</span>
                  <div className="mt-4 w-full bg-slate-100 rounded-full h-3"><div className={`h-3 rounded-full ${scoreCalculado >= 80 ? "bg-[#16A34A]" : scoreCalculado >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"}`} style={{ width: `${scoreCalculado}%` }} /></div>
                  <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${scoreCalculado === 100 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{scoreCalculado === 100 ? "✓ APROVADO" : `${totalNaoConformes} não-conformidades`}</span>
                </div>
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm md:col-span-2">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Resumo</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{resumoIA || (scoreCalculado === 100 ? `"${nomeProjeto}" atende a todas as especificações para ${tipoSelecionado}.` : `Identificadas ${totalNaoConformes} não-conformidades em "${nomeProjeto}". Score: ${scoreCalculado}%.`)}</p>
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" /><span className="font-semibold">{totalConformes} conformes</span></div>
                    <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /><span className="font-semibold">{totalNaoConformes} não-conformes</span></div>
                    <div className="flex items-center gap-2 text-slate-500"><AlertOctagon className="w-4 h-4" /><span className="font-semibold">{regras.length - totalAplicaveis} N/A</span></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2"><BarChart2 className="w-5 h-5 text-[#1E3A5F]" /><h2 className="text-base font-bold">Validações por Categoria</h2></div>
                <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b border-border"><th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Categoria</th><th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Conformes</th><th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Pendências</th><th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase w-48">Conformidade</th><th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {validacoesPorCategoria.filter(v => v.total > 0).map(v => (
                        <tr key={v.categoria} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-medium">{v.categoria}</td>
                          <td className="px-4 py-4 text-center text-green-700 font-semibold">{v.conformes}</td>
                          <td className="px-4 py-4 text-center">{v.naoConformes > 0 ? <span className="text-red-600 font-semibold">{v.naoConformes}</span> : <span className="text-slate-400">0</span>}</td>
                          <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="flex-1 bg-slate-100 rounded-full h-2"><div className={`h-2 rounded-full ${v.percentual >= 80 ? "bg-[#16A34A]" : v.percentual >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"}`} style={{ width: `${v.percentual}%` }} /></div><span className="text-xs font-semibold w-10 text-right">{v.percentual}%</span></div></td>
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
                  {naoConformidades.map(nc => (
                    <div key={nc.id} className="bg-white border border-red-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-muted-foreground">{nc.codigo}</span><span className="text-[10px] font-bold text-[#1E3A5F] bg-slate-100 px-2 py-0.5 rounded">{nc.norma_origem}</span></div>
                          <p className="text-sm text-slate-700">{nc.descricao}</p>
                          {justificativas[nc.id] && <div className="flex items-start gap-1.5 mt-1"><Sparkles className="w-3 h-3 text-[#1E3A5F] flex-shrink-0 mt-0.5" /><p className="text-xs text-[#1E3A5F] italic">{justificativas[nc.id]}</p></div>}
                          {observacoes[nc.id] && <p className="text-xs text-slate-500 mt-1 italic">"{observacoes[nc.id]}"</p>}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200 flex-shrink-0">Não conforme</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <Button onClick={exportarRelatorio} variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar Relatório</Button>
                {projetoSalvoId && <Button onClick={() => navigate(`/projetos/${projetoSalvoId}`)} className="bg-[#1E3A5F] text-white gap-2">Ver Laudo<ChevronRight className="w-4 h-4" /></Button>}
                <Button onClick={() => navigate("/dashboard")} variant="outline">Voltar ao Dashboard</Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
