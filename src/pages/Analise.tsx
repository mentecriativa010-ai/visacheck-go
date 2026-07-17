// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { analisarProjetoComIA } from "@/lib/openrouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, Home, Folder, BookOpen, LogOut, ArrowLeft,
  CheckCircle, AlertTriangle, AlertOctagon, ChevronRight,
  ChevronLeft, Loader2, ClipboardList, BarChart2, Download,
  ChevronDown, FileUp, Sparkles,
} from "lucide-react";

const AMBIENTE_PARA_TIPOS = {
  "UTI Adulto":                    ["base", "hospital_uti"],
  "UTI Pediátrica":                ["base", "hospital_uti"],
  "UTI Neonatal":                  ["base", "hospital_uti"],
  "CME":                           ["base", "hospital_cme"],
  "Centro Cirúrgico":              ["base", "hospital_cc"],
  "Centro Cirúrgico Ambulatorial": ["base", "hospital_cca"],
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
  { grupo: "Hospitalar", itens: ["UTI Adulto","UTI Pediátrica","UTI Neonatal","CME","Centro Cirúrgico","Centro Cirúrgico Ambulatorial","Radiologia","Hospital Geral","Internação","Pronto Socorro","Ambulatório"] },
  { grupo: "Odontologia", itens: ["Consultório Odontológico","Centro Cirúrgico Odontológico","Laboratório de Prótese"] },
  { grupo: "Farmácias / Distribuidoras", itens: ["Drogaria","Farmácia de Manipulação","Distribuidora"] },
  { grupo: "Outros", itens: ["Clínica Médica","Laboratório"] },
];

export default function Analise() {
  const navigate = useNavigate();

  const [passo, setPasso] = useState(1);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);

  // PDF
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfNome, setPdfNome] = useState("");
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [iaStatus, setIaStatus] = useState("");

  const [regras, setRegras] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [observacoes, setObservacoes] = useState({});
  const [loadingRegras, setLoadingRegras] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [projetoSalvoId, setProjetoSalvoId] = useState(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState("");
  const [erro, setErro] = useState("");
  const [gruposAbertos, setGruposAbertos] = useState({});

  // ─── Carregar regras do Supabase ──────────────────────────────────────────
  const carregarRegras = async (tipo) => {
    if (!tipo) return;
    setLoadingRegras(true);
    setRegras([]);
    setRespostas({});
    setObservacoes({});
    setErro("");
    try {
      const tiposAlvo = AMBIENTE_PARA_TIPOS[tipo] ?? ["base"];
      const filtroTipos = tiposAlvo.map(t => `tipo_estabelecimento.eq.${t}`).join(",");
      const filtroAmbiente = `ambiente.cs.{"${tipo}"}`;
      const { data, error } = await supabase
        .from("regras_regulatorias")
        .select("id,codigo,descricao,norma_origem,categoria,subcategoria,artigo_referencia,obrigatorio,valor_minimo,valor_maximo,unidade")
        .or(`${filtroTipos},${filtroAmbiente}`)
        .order("norma_origem", { ascending: true })
        .order("codigo", { ascending: true });
      if (error) throw error;
      const unicas = data ? [...new Map(data.map(r => [r.id, r])).values()] : [];
      setRegras(unicas);
      const init = {};
      unicas.forEach(r => { init[r.id] = "nao_aplicavel"; });
      setRespostas(init);
      if (unicas.length > 0) setCategoriaAtiva(unicas[0].categoria ?? "");
      else setErro(`Nenhuma regra encontrada para "${tipo}".`);
    } catch (err) {
      setErro(`Erro ao carregar regras: ${err.message}`);
    } finally {
      setLoadingRegras(false);
    }
  };

  const selecionarTipo = (tipo) => {
    setTipoSelecionado(tipo);
    setDropdownAberto(false);
    carregarRegras(tipo);
  };

  // ─── Upload PDF para Supabase Storage ─────────────────────────────────────
  const uploadPDF = async (file) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const caminho = `${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("projetos-arquivos")
        .upload(caminho, file, { contentType: "application/pdf", upsert: false });
      if (error) console.error("Erro upload PDF:", error);
      return caminho;
    } catch { return null; }
  };

  // ─── Extrai texto real do PDF usando pdf.js (via CDN) ───────────────────────
  const extrairTextoPDF = async (file) => {
    // Carrega pdf.js dinamicamente (evita precisar adicionar dependência ao projeto)
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Falha ao carregar leitor de PDF"));
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let textoCompleto = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const conteudo = await page.getTextContent();
      const textoPagina = conteudo.items.map(item => item.str).join(" ");
      textoCompleto += textoPagina + "\n";
    }

    return textoCompleto.trim();
  };

  // ─── Análise por IA — via openrouter.ts ─────────────────────────────────────
  // Ao concluir com sucesso, salva direto no banco e já leva para a página de
  // resultado (passo 3), sem exigir clique manual categoria por categoria.
  const analisarComIA = async (file, regrasCarregadas) => {
    if (!regrasCarregadas.length) return false;
    setAnalisandoIA(true);
    setIaStatus("Lendo o PDF do projeto...");
    try {
      const textoPDF = await extrairTextoPDF(file);

      if (!textoPDF || textoPDF.length < 30) {
        throw new Error("Não foi possível extrair texto do PDF (pode ser um PDF escaneado/imagem, sem camada de texto).");
      }

      setIaStatus("IA analisando o projeto arquitetônico...");

      const regrasMapeadas = regrasCarregadas.map(r => ({
        id: String(r.id),
        codigo: r.codigo ?? "",
        descricao: r.descricao ?? "",
        norma_origem: r.norma_origem ?? null,
      }));

      const resultado = await analisarProjetoComIA(textoPDF, tipoSelecionado, regrasMapeadas);

      // Monta o objeto de respostas completo aqui mesmo (não depende do estado
      // React, que ainda não foi re-renderizado neste ponto da execução).
      const respostasFinal = {};
      regrasCarregadas.forEach(r => { respostasFinal[r.id] = "nao_aplicavel"; });
      const obsFinal = {};
      resultado.resultados.forEach(r => {
        const statusMap = { conforme: "conforme", nao_conforme: "nao_conforme", nao_aplicavel: "nao_aplicavel" };
        if (statusMap[r.status]) respostasFinal[r.id] = statusMap[r.status];
        if (r.justificativa) obsFinal[r.id] = r.justificativa;
      });

      setRespostas(prev => ({ ...prev, ...respostasFinal }));
      setObservacoes(prev => ({ ...prev, ...obsFinal }));
      setIaStatus(`✓ IA analisou ${resultado.resultados.length} regras — gerando relatório...`);

      // Vai direto para a última página (resultado/relatório), sem passar pelo checklist manual.
      await salvarNoBanco(regrasCarregadas, respostasFinal, obsFinal);
      return true;
    } catch (err) {
      console.error("Erro IA:", err);
      setIaStatus(`⚠ Não foi possível analisar com IA (${err.message || "erro desconhecido"}). Prossiga com o checklist manual.`);
      return false;
    } finally {
      setAnalisandoIA(false);
    }
  };

  const avancarPasso1 = async () => {
    if (!nomeProjeto.trim() || !tipoSelecionado || !pdfFile) return;
    if (pdfFile) uploadPDF(pdfFile); // fire-and-forget para storage
    setPasso(2);

    // Aguarda as regras carregarem de fato, lendo o estado mais recente a cada checagem
    // (em vez de depender da variável `regras` capturada no closure, que fica congelada)
    if (pdfFile) {
      let regrasFrescas = [];
      for (let tentativas = 0; tentativas < 30; tentativas++) {
        if (regras.length > 0) { regrasFrescas = regras; break; }
        await new Promise(r => setTimeout(r, 300));
      }
      if (regrasFrescas.length === 0 && regras.length > 0) regrasFrescas = regras;
      // Se a IA analisar com sucesso, ela mesma já leva o usuário até o passo 3.
      // Se falhar, o usuário permanece no passo 2 para preencher manualmente.
      if (regrasFrescas.length > 0) await analisarComIA(pdfFile, regrasFrescas);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // ─── Dados derivados ───────────────────────────────────────────────────────
  const categorias = [...new Set(regras.map(r => r.categoria).filter(Boolean))];
  const regrasPorCategoria = regras.filter(r => r.categoria === categoriaAtiva);
  const totalConformes    = Object.values(respostas).filter(v => v === "conforme").length;
  const totalNaoConformes = Object.values(respostas).filter(v => v === "nao_conforme").length;
  const totalAplicaveis   = Object.values(respostas).filter(v => v !== "nao_aplicavel").length;
  const totalRespondidas  = totalAplicaveis;
  const scoreCalculado    = totalAplicaveis > 0 ? Math.round((totalConformes / totalAplicaveis) * 100) : 0;

  const validacoesPorCategoria = categorias.map(cat => {
    const regrasCat    = regras.filter(r => r.categoria === cat);
    const aplicaveis   = regrasCat.filter(r => respostas[r.id] !== "nao_aplicavel");
    const conformes    = regrasCat.filter(r => respostas[r.id] === "conforme");
    const naoConformes = regrasCat.filter(r => respostas[r.id] === "nao_conforme");
    const pct = aplicaveis.length > 0 ? Math.round((conformes.length / aplicaveis.length) * 100) : 100;
    return { categoria: cat, total: aplicaveis.length, conformes: conformes.length, naoConformes: naoConformes.length, percentual: pct };
  });

  const naoConformidades = regras.filter(r => respostas[r.id] === "nao_conforme");
  const pendenciasInformacao = regras.filter(r => respostas[r.id] === "nao_aplicavel");
  const pendenciasPorNorma = pendenciasInformacao.reduce((acc, r) => {
    const norma = r.norma_origem || "Norma não identificada";
    if (!acc[norma]) acc[norma] = [];
    acc[norma].push(r);
    return acc;
  }, {});
  const toggleGrupo = (norma) => setGruposAbertos(prev => ({ ...prev, [norma]: !prev[norma] }));

  // ─── Salvar no banco ───────────────────────────────────────────────────────
  // Aceita dados explícitos (regras/respostas/observações) como parâmetros opcionais.
  // Isso permite que a análise por IA chame esta função diretamente com os dados
  // recém-calculados, sem esperar o React re-renderizar o estado — e assim pular
  // direto para o passo 3 (resultado) em vez de exigir clique categoria por categoria.
  const salvarNoBanco = async (regrasParam, respostasParam, observacoesParam) => {
    const regrasUsar = regrasParam ?? regras;
    const respostasUsar = respostasParam ?? respostas;
    const observacoesUsar = observacoesParam ?? observacoes;

    const totalConformesCalc = Object.values(respostasUsar).filter(v => v === "conforme").length;
    const totalNaoConformesCalc = Object.values(respostasUsar).filter(v => v === "nao_conforme").length;
    const totalAplicaveisCalc = Object.values(respostasUsar).filter(v => v !== "nao_aplicavel").length;
    const scoreCalc = totalAplicaveisCalc > 0 ? Math.round((totalConformesCalc / totalAplicaveisCalc) * 100) : 0;

    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: proj, error: projError } = await supabase
        .from("projetos")
        .insert({
          nome_projeto: nomeProjeto,
          tipo_estabelecimento: tipoSelecionado,
          user_id: user.id,
          status: scoreCalc === 100 ? "aprovado" : totalNaoConformesCalc > 0 ? "reprovado" : "pendente",
          score_conformidade: scoreCalc,
        })
        .select("id").single();
      if (projError || !proj) throw projError;

      // Antes, itens "não_aplicável" eram descartados aqui (nunca chegavam a
      // ser inseridos em `validacoes`), o que fazia o relatório perder a
      // justificativa da IA sobre por que o item não se aplica ou o que falta
      // de informação no projeto para avaliá-lo. Agora TODAS as regras viram
      // uma linha em `validacoes` — inclusive as N/A — para alimentar a seção
      // "Observações / Pendências de Informação" nas telas de resultado.
      const validacoes = regrasUsar.map(r => {
        const resp = respostasUsar[r.id];
        const status = resp === "conforme" ? "aprovado" : resp === "nao_conforme" ? "reprovado" : "nao_aplicavel";
        const observacao =
          resp === "conforme" ? "Conforme verificação" :
          resp === "nao_conforme" ? (observacoesUsar[r.id] || "Não conformidade identificada") :
          (observacoesUsar[r.id] || "Não aplicável ao projeto/ambiente analisado.");
        return { projeto_id: proj.id, regra_id: r.id, status, observacao };
      });
      if (validacoes.length > 0) await supabase.from("validacoes").insert(validacoes);

      const resumo = scoreCalc === 100
        ? `O projeto "${nomeProjeto}" atende a todas as especificações para ${tipoSelecionado}.`
        : `O diagnóstico de "${nomeProjeto}" identificou ${totalNaoConformesCalc} não-conformidades. Score: ${scoreCalc}%.`;
      await supabase.from("pareceres").insert({
        projeto_id: proj.id, parecer: resumo,
        nivel_risco: scoreCalc === 100 ? "baixo" : scoreCalc >= 70 ? "medio" : "alto",
      });

      setProjetoSalvoId(proj.id);
      setPasso(3);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSalvando(false);
    }
  };

  const exportarRelatorio = () => {
    const linhas = [
      "RELATÓRIO DE CONFORMIDADE REGULATÓRIA", "VISAcheck GO", "",
      `Projeto: ${nomeProjeto}`, `Tipo: ${tipoSelecionado}`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`, `Score: ${scoreCalculado}%`, "",
      "VALIDAÇÕES POR CATEGORIA",
      ...validacoesPorCategoria.map(v => `  • ${v.categoria}: ${v.conformes}/${v.total} conformes (${v.percentual}%)`),
      "", `NÃO-CONFORMIDADES (${naoConformidades.length})`,
      ...naoConformidades.map(nc =>
        `  [${nc.norma_origem}] ${nc.codigo}\n  ${nc.descricao}` +
        (observacoes[nc.id] ? `\n  Obs: ${observacoes[nc.id]}` : "")
      ),
      "", `OBSERVAÇÕES / PENDÊNCIAS DE INFORMAÇÃO (${pendenciasInformacao.length})`,
      ...pendenciasInformacao.map(p =>
        `  [${p.norma_origem}] ${p.codigo}\n  ${p.descricao}` +
        (observacoes[p.id] ? `\n  Obs: ${observacoes[p.id]}` : "")
      ),
      "", `Relatório gerado pelo VISAcheck GO em ${new Date().toLocaleString("pt-BR")}`,
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `VISAcheck_${nomeProjeto.replace(/\s+/g,"_")}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-border bg-card flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-primary">VISAcheck GO</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50">
            <Home className="w-4 h-4" />Dashboard
          </button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50">
            <Folder className="w-4 h-4" />Meus Projetos
          </button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50">
            <BookOpen className="w-4 h-4" />Base de Normas
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-primary/5 text-primary">
            <ClipboardList className="w-4 h-4" />Nova Análise
          </button>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 pl-64 min-h-screen flex flex-col">

        {/* HEADER */}
        <header className="border-b border-border bg-card py-5 px-8 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Nova Análise Regulatória</h1>
            <p className="text-xs text-muted-foreground">Diagnóstico baseado nas normas ANVISA e ABNT</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {[1,2,3].map(p => (
              <div key={p} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${passo >= p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{p}</div>
                {p < 3 && <div className={`w-8 h-0.5 ${passo > p ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
            <div className="ml-3 text-xs text-muted-foreground">
              {passo === 1 ? "Dados do projeto" : passo === 2 ? "Checklist regulatório" : "Resultado"}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-5xl w-full mx-auto">

          {/* ── PASSO 1 ── */}
          {passo === 1 && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <ClipboardList className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Dados do Projeto</h2>
                  <p className="text-sm text-muted-foreground">Preencha as informações básicas para iniciar o diagnóstico</p>
                </div>

                <div className="space-y-4">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Projeto</Label>
                    <Input id="nome" value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} placeholder="Ex: UPA Norte — Reforma Ala B" />
                  </div>

                  {/* Tipo */}
                  <div className="space-y-2">
                    <Label>Tipo de Ambiente / Estabelecimento</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownAberto(prev => !prev)}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-left flex items-center justify-between shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <span className={tipoSelecionado ? "text-foreground" : "text-muted-foreground"}>
                          {tipoSelecionado || "Selecione o tipo de ambiente..."}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {dropdownAberto && (
                        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                          {GRUPOS_AMBIENTE.map(grupo => (
                            <div key={grupo.grupo}>
                              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                                {grupo.grupo}
                              </div>
                              {grupo.itens.map(item => (
                                <button key={item} type="button" onClick={() => selecionarTipo(item)}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${tipoSelecionado === item ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}>
                                  {item}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {tipoSelecionado && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(AMBIENTE_PARA_TIPOS[tipoSelecionado] ?? []).map(t => (
                          <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload PDF */}
                  <div className="space-y-2">
                    <Label>Projeto Arquitetônico (PDF) — obrigatório</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${pdfFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
                      onClick={() => document.getElementById("pdf-input").click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const f = e.dataTransfer.files[0];
                        if (f?.type === "application/pdf") { setPdfFile(f); setPdfNome(f.name); }
                      }}
                    >
                      <input
                        id="pdf-input" type="file" accept="application/pdf" className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) { setPdfFile(f); setPdfNome(f.name); }
                        }}
                      />
                      {pdfFile ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <FileUp className="w-5 h-5" />
                          <span className="text-sm font-medium truncate max-w-xs">{pdfNome}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <FileUp className="w-8 h-8 mx-auto text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">Arraste o PDF ou clique para selecionar</p>
                          <p className="text-xs text-muted-foreground/60">A IA irá pré-preencher o checklist automaticamente</p>
                        </div>
                      )}
                    </div>
                    {pdfFile && (
                      <button type="button" onClick={() => { setPdfFile(null); setPdfNome(""); }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                        Remover PDF
                      </button>
                    )}
                  </div>
                </div>

                {erro && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{erro}</div>
                )}

                <Button
                  onClick={avancarPasso1}
                  disabled={!nomeProjeto.trim() || !tipoSelecionado || !pdfFile || loadingRegras}
                  className="w-full gap-2"
                >
                  {loadingRegras
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Carregando regras...</>
                    : <><Sparkles className="w-4 h-4" />Iniciar com Análise IA</>
                  }
                </Button>

                {regras.length > 0 && tipoSelecionado && !loadingRegras && (
                  <p className="text-center text-xs text-muted-foreground">
                    ✓ {regras.length} regras carregadas para <strong>{tipoSelecionado}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── PASSO 2 ── */}
          {passo === 2 && (
            <div className="flex gap-6">
              {/* Status IA */}
              {(analisandoIA || iaStatus) && (
                <div className={`fixed top-20 right-6 z-30 max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm flex items-center gap-2 ${analisandoIA ? "bg-primary text-primary-foreground border-primary/50" : iaStatus.startsWith("✓") ? "bg-green-600 text-white border-green-500" : "bg-amber-500 text-white border-amber-400"}`}>
                  {analisandoIA && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
                  {!analisandoIA && <Sparkles className="w-4 h-4 flex-shrink-0" />}
                  <span>{iaStatus}</span>
                </div>
              )}

              {/* Sidebar categorias */}
              <div className="w-52 flex-shrink-0">
                <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-24">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorias</p>
                  </div>
                  <nav className="py-2">
                    {categorias.map(cat => {
                      const total = regras.filter(r => r.categoria === cat).length;
                      const respondidas = regras.filter(r => r.categoria === cat && respostas[r.id] !== "nao_aplicavel").length;
                      return (
                        <button key={cat} onClick={() => setCategoriaAtiva(cat)}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${categoriaAtiva === cat ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
                          <div>{cat}</div>
                          <div className="text-[10px] mt-0.5 opacity-60">{respondidas}/{total} respondidas</div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Checklist */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">{categoriaAtiva}</h2>
                  <span className="text-xs text-muted-foreground">{regrasPorCategoria.length} regras</span>
                </div>

                {regrasPorCategoria.map(regra => (
                  <div key={regra.id}
                    className={`bg-card border rounded-xl p-4 shadow-sm transition-all ${respostas[regra.id] === "conforme" ? "border-green-500/40" : respostas[regra.id] === "nao_conforme" ? "border-destructive/40" : "border-border"}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{regra.codigo}</span>
                          {regra.norma_origem && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{regra.norma_origem}</span>
                          )}
                          {regra.obrigatorio && (
                            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">OBRIGATÓRIO</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{regra.descricao}</p>
                        {regra.artigo_referencia && <p className="text-xs text-muted-foreground mt-1">Ref: {regra.artigo_referencia}</p>}
                        {(regra.valor_minimo != null || regra.valor_maximo != null) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {regra.valor_minimo != null && `Mín: ${regra.valor_minimo}${regra.unidade ?? ""}`}
                            {regra.valor_minimo != null && regra.valor_maximo != null && " · "}
                            {regra.valor_maximo != null && `Máx: ${regra.valor_maximo}${regra.unidade ?? ""}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {[
                        { v: "conforme",      l: "Conforme",      cls: "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" },
                        { v: "nao_conforme",  l: "Não Conforme",  cls: "border-destructive bg-destructive/10 text-destructive" },
                        { v: "nao_aplicavel", l: "N/A",           cls: "border-muted-foreground/30 bg-muted text-muted-foreground" },
                      ].map(opt => (
                        <button key={opt.v} onClick={() => setRespostas(prev => ({ ...prev, [regra.id]: opt.v }))}
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${respostas[regra.id] === opt.v ? `${opt.cls} ring-2 ring-offset-1 ring-current` : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>

                    {respostas[regra.id] === "nao_conforme" && (
                      <textarea
                        className="mt-3 w-full text-xs bg-background border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        rows={2}
                        placeholder="Descreva a não conformidade..."
                        value={observacoes[regra.id] ?? ""}
                        onChange={e => setObservacoes(prev => ({ ...prev, [regra.id]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}

                {/* Navegação entre categorias */}
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" className="gap-2"
                    onClick={() => {
                      const idx = categorias.indexOf(categoriaAtiva);
                      if (idx > 0) setCategoriaAtiva(categorias[idx - 1]);
                    }}
                    disabled={categorias.indexOf(categoriaAtiva) === 0}>
                    <ChevronLeft className="w-4 h-4" />Categoria anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {categorias.indexOf(categoriaAtiva) + 1} / {categorias.length}
                  </span>
                  {categorias.indexOf(categoriaAtiva) < categorias.length - 1 ? (
                    <Button className="gap-2"
                      onClick={() => {
                        const idx = categorias.indexOf(categoriaAtiva);
                        setCategoriaAtiva(categorias[idx + 1]);
                      }}>
                      Próxima categoria<ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => salvarNoBanco()} disabled={salvando} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                      {salvando
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                        : <>Finalizar e ver resultado<ChevronRight className="w-4 h-4" /></>
                      }
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 3 ── */}
          {passo === 3 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Score de Conformidade</h3>
                  <div>
                    <span className={`text-5xl font-extrabold ${scoreCalculado >= 80 ? "text-green-600" : scoreCalculado >= 50 ? "text-amber-600" : "text-destructive"}`}>
                      {scoreCalculado}%
                    </span>
                    <div className="mt-4 w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${scoreCalculado >= 80 ? "bg-green-600" : scoreCalculado >= 50 ? "bg-amber-500" : "bg-destructive"}`}
                        style={{ width: `${scoreCalculado}%` }}
                      />
                    </div>
                    <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${scoreCalculado === 100 ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300" : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300"}`}>
                      {scoreCalculado === 100 ? "✓ APROVADO" : `${totalNaoConformes} não-conformidades`}
                    </span>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl shadow-sm md:col-span-2">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Resumo da Análise</h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {scoreCalculado === 100
                      ? `O projeto "${nomeProjeto}" atende a todas as especificações regulatórias verificadas para ${tipoSelecionado}.`
                      : `O diagnóstico de "${nomeProjeto}" (${tipoSelecionado}) identificou ${totalNaoConformes} não-conformidades entre ${totalRespondidas} itens verificados. Score: ${scoreCalculado}%.`
                    }
                  </p>
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4" /><span className="font-semibold">{totalConformes} conformes</span></div>
                    <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /><span className="font-semibold">{totalNaoConformes} não-conformes</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><AlertOctagon className="w-4 h-4" /><span className="font-semibold">{regras.length - totalRespondidas} não aplicáveis</span></div>
                  </div>
                </div>
              </div>

              {/* Tabela por categoria */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold">Validações por Categoria</h2>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Conformes</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Pendências</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase w-48">Conformidade</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {validacoesPorCategoria.filter(v => v.total > 0).map(v => (
                        <tr key={v.categoria} className="hover:bg-muted/30">
                          <td className="px-6 py-4 font-medium">{v.categoria}</td>
                          <td className="px-4 py-4 text-center text-green-600 font-semibold">{v.conformes}</td>
                          <td className="px-4 py-4 text-center">
                            {v.naoConformes > 0 ? <span className="text-destructive font-semibold">{v.naoConformes}</span> : <span className="text-muted-foreground">0</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div className={`h-2 rounded-full ${v.percentual >= 80 ? "bg-green-600" : v.percentual >= 50 ? "bg-amber-500" : "bg-destructive"}`} style={{ width: `${v.percentual}%` }} />
                              </div>
                              <span className="text-xs font-semibold w-10 text-right">{v.percentual}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {v.naoConformes === 0 ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Não-conformidades */}
              {naoConformidades.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold">Não-Conformidades ({naoConformidades.length})</h2>
                  <div className="space-y-4">
                    {naoConformidades.map(nc => (
                      <div key={nc.id} className="bg-card border border-destructive/30 rounded-xl p-5 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">{nc.codigo}</span>
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{nc.norma_origem}</span>
                            </div>
                            <p className="text-sm text-foreground">{nc.descricao}</p>
                            {observacoes[nc.id] && <p className="text-xs text-muted-foreground mt-1 italic">"{observacoes[nc.id]}"</p>}
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20 flex-shrink-0">Não conforme</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações / Pendências de Informação */}
              {pendenciasInformacao.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">Observações / Pendências de Informação ({pendenciasInformacao.length})</h2>
                    <span className="text-xs text-muted-foreground">Agrupado por norma — clique para expandir</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(pendenciasPorNorma).map(([norma, itens]) => {
                      const aberto = !!gruposAbertos[norma];
                      return (
                        <div key={norma} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleGrupo(norma)}
                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {aberto ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{norma}</span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">{itens.length} item(ns)</span>
                          </button>
                          {aberto && (
                            <div className="border-t border-border divide-y divide-border">
                              {itens.map(p => (
                                <div key={p.id} className="px-5 py-4 space-y-1.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <span className="text-xs font-mono text-muted-foreground">{p.codigo}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border flex-shrink-0">Não aplicável</span>
                                  </div>
                                  <p className="text-sm text-foreground">{p.descricao}</p>
                                  <p className="text-xs text-muted-foreground italic">
                                    {observacoes[p.id] || "Não aplicável ao projeto/ambiente analisado."}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-4 pt-4">
                <Button onClick={exportarRelatorio} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />Exportar Relatório
                </Button>
                {projetoSalvoId && (
                  <Button onClick={() => navigate(`/projetos/${projetoSalvoId}`)} className="gap-2">
                    Ver Laudo Completo<ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={() => navigate("/dashboard")} variant="outline">Voltar ao Dashboard</Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
