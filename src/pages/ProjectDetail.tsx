import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ZoomIn, ZoomOut, FileText, AlertTriangle, AlertCircle, CheckCircle2,
  ArrowLeft, Printer, Maximize2, Crosshair, Layers, Filter, Activity,
  Download, RefreshCcw, Share2, ChevronRight, ChevronLeft, Gauge,
  Clock, ShieldCheck, Cpu, FileCheck2, Sparkles, MessageSquare,
} from "lucide-react";
import { deriveAmbiente, statusLabel as fmtStatus, runSimulatedAnalysis, ANALYSIS_STEPS } from "@/lib/analysisEngine";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Severidade = "critico" | "atencao" | "conforme";
type Analise = {
  id: string; norma: string; descricao_problema: string; sugestao: string;
  severidade: Severidade; coordenada_x: number; coordenada_y: number; pagina: number;
};
type Projeto = {
  id: string; nome_projeto: string; status: string; score_conformidade: number;
  arquivo_path: string | null; tipo_arquivo: string; created_at: string; updated_at: string;
  usuario_id: string;
};
type Profile = { nome: string | null; crea_cau: string | null; profissao: string | null; razao_social: string | null };

const sevAccent: Record<Severidade, string> = {
  critico: "hsl(var(--destructive))",
  atencao: "hsl(var(--warning))",
  conforme: "hsl(var(--success))",
};
const sevBg: Record<Severidade, string> = {
  critico: "bg-destructive/15 text-destructive border-destructive/30",
  atencao: "bg-warning/15 text-warning border-warning/30",
  conforme: "bg-success/15 text-success border-success/30",
};
const sevDot: Record<Severidade, string> = {
  critico: "text-destructive", atencao: "text-warning", conforme: "text-success",
};
const sevIcon = { critico: AlertCircle, atencao: AlertTriangle, conforme: CheckCircle2 } as const;

function extractAmbiente(a: Analise): string {
  const m = a.descricao_problema.match(/^\[([^\]]+)\]\s*/);
  if (m) return m[1];
  return deriveAmbiente(a.id + a.norma);
}
function cleanDesc(d: string) { return d.replace(/^\[[^\]]+\]\s*/, ""); }

export default function ProjectDetail() {
  const { id } = useParams();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [selected, setSelected] = useState<Analise | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sevFilter, setSevFilter] = useState<Severidade | "todas">("todas");
  const [groupBy, setGroupBy] = useState<"norma" | "ambiente" | "nenhum">("nenhum");
  const [cursorXY, setCursorXY] = useState<{ x: number; y: number } | null>(null);
  const [scanning, setScanning] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessStep, setReprocessStep] = useState(0);
  const [rightTab, setRightTab] = useState<"status" | "timeline" | "resumo">("status");
  const [rightOpen, setRightOpen] = useState(true);
  const pageWrap = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id) return;
    const { data: p } = await supabase.from("projetos").select("*").eq("id", id).maybeSingle();
    setProjeto(p as Projeto);
    const { data: a } = await supabase.from("analises").select("*").eq("projeto_id", id);
    setAnalises((a as Analise[]) || []);
    if (p?.usuario_id) {
      const { data: pr } = await supabase.from("profiles").select("nome, crea_cau, profissao, razao_social").eq("id", p.usuario_id).maybeSingle();
      setProfile(pr as Profile);
    }
    if (p?.arquivo_path && (p as any).tipo_arquivo === "PDF") {
      const { data: signed } = await supabase.storage.from("projetos").createSignedUrl((p as any).arquivo_path, 3600);
      setFileUrl(signed?.signedUrl ?? null);
    }
  };

  useEffect(() => {
    load();
    const t = setTimeout(() => setScanning(false), 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filtered = useMemo(() => analises.filter(a => sevFilter === "todas" || a.severidade === sevFilter), [analises, sevFilter]);

  const grouped = useMemo(() => {
    if (groupBy === "nenhum") return [{ key: "Todas as inconformidades", items: filtered }];
    const map = new Map<string, Analise[]>();
    for (const a of filtered) {
      const k = groupBy === "norma" ? a.norma : extractAmbiente(a);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  const counts = {
    critico: analises.filter(a => a.severidade === "critico").length,
    atencao: analises.filter(a => a.severidade === "atencao").length,
    conforme: analises.filter(a => a.severidade === "conforme").length,
  };

  const normasUsadas = useMemo(() => Array.from(new Set(analises.map(a => a.norma))), [analises]);
  const ambientesAfetados = useMemo(() => Array.from(new Set(analises.map(a => extractAmbiente(a)))), [analises]);

  const handleDownload = async () => {
    if (!projeto?.arquivo_path) return;
    const { data } = await supabase.storage.from("projetos").createSignedUrl(projeto.arquivo_path, 60, { download: true });
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado", { description: "Compartilhe com sua equipe técnica." });
  };

  const handleReprocess = async () => {
    if (!projeto) return;
    setReprocessing(true);
    setReprocessStep(0);
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setReprocessStep(i);
      await new Promise((r) => setTimeout(r, ANALYSIS_STEPS[i].duration));
    }
    await supabase.from("analises").delete().eq("projeto_id", projeto.id);
    const result = runSimulatedAnalysis(projeto.id + Date.now());
    const rows = result.findings.map((f) => ({
      projeto_id: projeto.id,
      norma: f.norma, descricao_problema: `[${f.ambiente}] ${f.descricao_problema}`, sugestao: f.sugestao,
      severidade: f.severidade, coordenada_x: f.coordenada_x, coordenada_y: f.coordenada_y, pagina: f.pagina,
    }));
    await supabase.from("analises").insert(rows);
    await supabase.from("projetos").update({ status: result.status, score_conformidade: result.score, updated_at: new Date().toISOString() }).eq("id", projeto.id);
    setReprocessing(false);
    setSelected(null);
    await load();
    toast.success(`Reanálise concluída · Score ${result.score}%`, { description: `${result.findings.length} ocorrências detectadas.` });
  };

  if (!projeto) {
    return (
      <div className="h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4 animate-pulse text-primary" /> Carregando workspace...</div>
      </div>
    );
  }

  const responsavel = profile?.nome || profile?.razao_social || "—";
  const profissao = profile?.profissao ? profile.profissao.charAt(0).toUpperCase() + profile.profissao.slice(1) : "Profissional";
  const created = new Date(projeto.created_at);
  const updated = new Date(projeto.updated_at);

  const statusToneClass = projeto.status === "aprovado" ? "text-success" : projeto.status === "parcial" ? "text-warning" : projeto.status === "reprovado" ? "text-destructive" : "text-primary";

  const timelineEvents = [
    { icon: FileCheck2, label: "Upload recebido", detail: `${projeto.tipo_arquivo} · ${projeto.nome_projeto}`, time: created },
    { icon: Cpu, label: "Parsing iniciado", detail: "Normalização de geometria e escala", time: new Date(created.getTime() + 1500) },
    { icon: ShieldCheck, label: "Normas cruzadas", detail: `${normasUsadas.length} normas regulatórias aplicadas`, time: new Date(created.getTime() + 3500) },
    { icon: AlertCircle, label: "Inconsistências detectadas", detail: `${analises.length} ocorrências identificadas`, time: new Date(created.getTime() + 5200) },
    { icon: Gauge, label: "Score consolidado", detail: `${projeto.score_conformidade}% de conformidade`, time: new Date(created.getTime() + 6800) },
    { icon: Sparkles, label: "Análise concluída", detail: `Status final: ${fmtStatus(projeto.status)}`, time: updated },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-border bg-card/40 backdrop-blur shrink-0">
        <div className="h-14 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/app/projects"><Button variant="ghost" size="sm" className="h-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div className="h-6 w-px bg-border" />
            <div className="min-w-0 flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate text-sm flex items-center gap-2">
                  {projeto.nome_projeto}
                  <Badge variant="outline" className="font-mono text-[10px] h-5">{projeto.tipo_arquivo}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> ENGINE ATIVO</span>
                  <span>·</span>
                  <span className={statusToneClass}>{fmtStatus(projeto.status).toUpperCase()}</span>
                  <span>·</span>
                  <span className="tabular-nums">SCORE {projeto.score_conformidade}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center bg-surface/60 rounded-md border border-border/60">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.4, s - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
              <button onClick={() => setScale(1)} className="text-[11px] font-mono w-14 text-center hover:text-primary tabular-nums">{Math.round(scale * 100)}%</button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.min(3, s + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
              <div className="h-5 w-px bg-border" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(1)} title="Ajustar"><Maximize2 className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="h-6 w-px bg-border mx-1" />
            <Button variant="ghost" size="sm" className="h-8" onClick={handleReprocess} disabled={reprocessing}>
              <RefreshCcw className={`h-3.5 w-3.5 ${reprocessing ? "animate-spin" : ""}`} /> Reprocessar
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Baixar
            </Button>
            <Link to={`/app/projects/${projeto.id}/report`}>
              <Button size="sm" className="h-8 ml-1"><Printer className="h-3.5 w-3.5" /> Relatório</Button>
            </Link>
          </div>
        </div>

        {/* Meta strip */}
        <div className="h-9 px-4 border-t border-border/40 bg-surface/20 flex items-center gap-6 text-[10px] font-mono uppercase tracking-wider text-muted-foreground overflow-x-auto">
          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> UPLOAD <span className="text-foreground">{format(created, "dd/MM/yyyy HH:mm")}</span></div>
          <div className="flex items-center gap-1.5">RESPONSÁVEL <span className="text-foreground normal-case tracking-normal">{responsavel}</span> <span className="opacity-60">· {profissao}</span></div>
          {profile?.crea_cau && <div className="flex items-center gap-1.5">CREA/CAU <span className="text-foreground tabular-nums">{profile.crea_cau}</span></div>}
          <div className="flex items-center gap-1.5">PROC <span className="text-success">CONCLUÍDO</span></div>
          <div className="flex items-center gap-1.5">OCORRÊNCIAS <span className="text-foreground tabular-nums">{analises.length}</span></div>
          <div className="flex items-center gap-1.5">NORMAS <span className="text-foreground tabular-nums">{normasUsadas.length}</span></div>
          <div className="flex items-center gap-1.5">AMBIENTES <span className="text-foreground tabular-nums">{ambientesAfetados.length}</span></div>
          <div className="ml-auto flex items-center gap-1.5">ID <span className="text-foreground">{projeto.id.slice(0, 8)}</span></div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Viewer */}
        <div className="flex-1 relative overflow-auto" style={{ cursor: "crosshair" }}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            setCursorXY({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          onMouseLeave={() => setCursorXY(null)}
        >
          {/* CAD grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border) / 0.35) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border) / 0.35) 1px, transparent 1px),
                linear-gradient(hsl(var(--border) / 0.15) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border) / 0.15) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
            }}
          />
          {cursorXY && (
            <>
              <div className="absolute top-0 bottom-0 w-px bg-primary/30 pointer-events-none" style={{ left: cursorXY.x }} />
              <div className="absolute left-0 right-0 h-px bg-primary/30 pointer-events-none" style={{ top: cursorXY.y }} />
            </>
          )}

          <div className="relative min-h-full p-8 grid place-items-start justify-center">
            {fileUrl ? (
              <div ref={pageWrap} className="relative shadow-card bg-white">
                <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="p-12 text-sm text-muted-foreground">Renderizando planta...</div>}>
                  <Page pageNumber={1} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
                </Document>

                <AnimatePresence>
                  {(scanning || reprocessing) && (
                    <motion.div
                      initial={{ top: "0%" }} animate={{ top: "100%" }} exit={{ opacity: 0 }}
                      transition={{ duration: 2.2, ease: "linear", repeat: reprocessing ? Infinity : 0 }}
                      className="absolute left-0 right-0 h-12 pointer-events-none"
                      style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.25), transparent)" }}
                    />
                  )}
                </AnimatePresence>

                {filtered.filter(a => a.pagina === 1).map((a, i) => {
                  const Icon = sevIcon[a.severidade];
                  const isActive = selected?.id === a.id;
                  const isHover = hoveredId === a.id;
                  return (
                    <motion.button
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: scanning ? 2.2 + i * 0.08 : i * 0.04, type: "spring", stiffness: 200, damping: 18 }}
                      onClick={() => setSelected(a)}
                      onMouseEnter={() => setHoveredId(a.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                      style={{ left: `${a.coordenada_x * 100}%`, top: `${a.coordenada_y * 100}%` }}
                    >
                      <div className="absolute inset-0 -m-3 pointer-events-none transition-opacity"
                        style={{ opacity: isActive || isHover ? 1 : 0 }}>
                        {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2",
                          "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((c) => (
                          <span key={c} className={`absolute h-2 w-2 ${c}`} style={{ borderColor: sevAccent[a.severidade] }} />
                        ))}
                      </div>
                      <span className="absolute inset-0 rounded-full animate-ping opacity-40"
                        style={{ background: sevAccent[a.severidade] }} />
                      <span className="relative h-7 w-7 rounded-full grid place-items-center ring-2 ring-background shadow-lg transition-transform group-hover:scale-110"
                        style={{ background: sevAccent[a.severidade] }}>
                        <Icon className="h-3.5 w-3.5 text-background" />
                      </span>
                      {/* Hover tooltip */}
                      <AnimatePresence>
                        {isHover && !isActive && (
                          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-60 pointer-events-none">
                            <div className="glass rounded-md p-2.5 text-left">
                              <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: sevAccent[a.severidade] }}>{a.norma} · {extractAmbiente(a)}</div>
                              <div className="text-[11px] leading-snug text-foreground">{cleanDesc(a.descricao_problema)}</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <Card className="glass p-12 text-center max-w-md mt-12">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <div className="font-medium">Visualização indisponível</div>
                <div className="text-sm text-muted-foreground mt-1">Apenas PDFs possuem viewer nesta etapa. Arquivos DWG/DXF estão armazenados e serão lidos pelo engine CAD nativo.</div>
              </Card>
            )}
          </div>

          {/* Bottom status bar */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground pointer-events-none">
            <div className="flex items-center gap-3 bg-card/70 backdrop-blur px-3 py-1.5 rounded border border-border/60">
              <Crosshair className="h-3 w-3" />
              {cursorXY ? `x ${Math.round(cursorXY.x)} · y ${Math.round(cursorXY.y)}` : "—"}
            </div>
            <div className="flex items-center gap-3 bg-card/70 backdrop-blur px-3 py-1.5 rounded border border-border/60">
              <span className="text-destructive">● {counts.critico} críticas</span>
              <span className="text-warning">● {counts.atencao} atenção</span>
              <span>· pág 1{numPages > 1 ? ` de ${numPages}` : ""}</span>
            </div>
          </div>
        </div>

        {/* Inconformidades sidebar */}
        <aside className="w-[360px] border-l border-border bg-card/40 backdrop-blur flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-sm">Inconformidades</h2>
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{filtered.length}/{analises.length}</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Análise sanitária regulatória</div>

            <div className="grid grid-cols-4 gap-1 mt-3 p-1 rounded-md bg-surface/60 border border-border/60">
              {[
                { k: "todas", l: "Todas", n: analises.length },
                { k: "critico", l: "Crítico", n: counts.critico },
                { k: "atencao", l: "Atenção", n: counts.atencao },
                { k: "conforme", l: "OK", n: counts.conforme },
              ].map((b) => (
                <button key={b.k} onClick={() => setSevFilter(b.k as any)}
                  className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${sevFilter === b.k ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {b.l} <span className="opacity-60 tabular-nums">{b.n}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3 w-3" />
              <span>Agrupar:</span>
              {[{ k: "nenhum", l: "—" }, { k: "norma", l: "Norma" }, { k: "ambiente", l: "Ambiente" }].map((g) => (
                <button key={g.k} onClick={() => setGroupBy(g.k as any)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${groupBy === g.k ? "text-primary bg-primary/10" : "hover:text-foreground"}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="glass m-3 p-3.5 border-l-4" style={{ borderLeftColor: sevAccent[selected.severidade] }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={sevBg[selected.severidade]} variant="outline">{selected.severidade}</Badge>
                    <button onClick={() => setSelected(null)} className="text-[10px] text-muted-foreground hover:text-foreground font-mono uppercase">fechar</button>
                  </div>
                  <div className="font-mono text-[10px] text-primary uppercase tracking-wider mb-1">{selected.norma} · {extractAmbiente(selected)}</div>
                  <div className="text-sm font-medium mb-2 leading-snug">{cleanDesc(selected.descricao_problema)}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">Sugestão técnica: </span>{selected.sugestao}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                    <span>coord [{(selected.coordenada_x * 100).toFixed(1)}, {(selected.coordenada_y * 100).toFixed(1)}] · pág {selected.pagina}</span>
                    <button className="flex items-center gap-1 hover:text-foreground opacity-50" title="Em breve"><MessageSquare className="h-3 w-3" /> comentar</button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto">
            {grouped.map(({ key, items }) => (
              <div key={key}>
                {groupBy !== "nenhum" && (
                  <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-surface/30 border-y border-border/40 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Filter className="h-3 w-3" /> {key}</span>
                    <span className="tabular-nums">{items.length}</span>
                  </div>
                )}
                <div className="divide-y divide-border/40">
                  {items.map((a) => {
                    const Icon = sevIcon[a.severidade];
                    const isActive = selected?.id === a.id;
                    return (
                      <button key={a.id} onClick={() => setSelected(a)}
                        onMouseEnter={() => setHoveredId(a.id)} onMouseLeave={() => setHoveredId(null)}
                        className={`w-full text-left p-3.5 hover:bg-surface/40 transition-colors flex gap-3 ${isActive ? "bg-surface/60 border-l-2 border-primary" : ""}`}>
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${sevDot[a.severidade]}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] text-primary uppercase tracking-wider flex items-center justify-between">
                            <span>{a.norma}</span>
                            <span className="text-muted-foreground">{extractAmbiente(a)}</span>
                          </div>
                          <div className="text-[13px] leading-snug mt-1">{cleanDesc(a.descricao_problema)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {analises.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Nenhuma análise gerada.</div>}
          </div>
        </aside>

        {/* Right context panel */}
        <aside className={`${rightOpen ? "w-[340px]" : "w-10"} border-l border-border bg-card/40 backdrop-blur flex flex-col shrink-0 transition-[width] duration-300`}>
          <button onClick={() => setRightOpen((v) => !v)}
            className="h-10 w-full border-b border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface/40 transition-colors">
            {rightOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {rightOpen && (
            <>
              <div className="flex border-b border-border bg-surface/20">
                {[
                  { k: "status", l: "Status", Icon: Gauge },
                  { k: "timeline", l: "Timeline", Icon: Clock },
                  { k: "resumo", l: "Resumo", Icon: ShieldCheck },
                ].map(({ k, l, Icon }) => (
                  <button key={k} onClick={() => setRightTab(k as any)}
                    className={`flex-1 px-2 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-b-2 ${rightTab === k ? "text-primary border-primary bg-primary/5" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                    <Icon className="h-3 w-3" /> {l}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {rightTab === "status" && (
                  <>
                    {/* Score gauge */}
                    <div className="relative rounded-lg border border-border/60 bg-surface/30 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Gauge className="h-3 w-3" /> Score sanitário</div>
                      <div className="flex items-end gap-2 mb-3">
                        <span className={`text-4xl font-mono font-semibold tabular-nums ${statusToneClass}`}>{projeto.score_conformidade}</span>
                        <span className="text-sm text-muted-foreground mb-1.5">/ 100</span>
                      </div>
                      <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${projeto.score_conformidade}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                          className="h-full rounded-full" style={{ background: projeto.status === "aprovado" ? "hsl(var(--success))" : projeto.status === "parcial" ? "hsl(var(--warning))" : "hsl(var(--destructive))" }} />
                      </div>
                      <div className={`mt-2 text-[11px] font-mono uppercase tracking-wider ${statusToneClass}`}>{fmtStatus(projeto.status)}</div>
                    </div>

                    {/* Severity distribution */}
                    <div className="rounded-lg border border-border/60 bg-surface/30 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Distribuição de severidade</div>
                      <div className="space-y-2.5">
                        {([
                          { k: "critico" as Severidade, l: "Crítico", n: counts.critico },
                          { k: "atencao" as Severidade, l: "Atenção", n: counts.atencao },
                          { k: "conforme" as Severidade, l: "Conforme", n: counts.conforme },
                        ]).map((row) => {
                          const max = Math.max(1, counts.critico + counts.atencao + counts.conforme);
                          return (
                            <div key={row.k}>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: sevAccent[row.k] }} /> {row.l}</span>
                                <span className="font-mono tabular-nums text-muted-foreground">{row.n}</span>
                              </div>
                              <div className="h-1 bg-border/40 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${(row.n / max) * 100}%`, background: sevAccent[row.k] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Engine status */}
                    <div className="rounded-lg border border-border/60 bg-surface/30 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><Cpu className="h-3 w-3" /> Engine regulatória</div>
                      <div className="space-y-2 text-[11px] font-mono">
                        {[
                          { l: "RDC 50/2002", st: "ativo" },
                          { l: "RDC 15/2012", st: "ativo" },
                          { l: "RDC 63/2011", st: "ativo" },
                          { l: "NBR 9050", st: "ativo" },
                          { l: "COE Goiânia", st: "ativo" },
                          { l: "SUVISA-GO", st: "ativo" },
                        ].map((r) => (
                          <div key={r.l} className="flex items-center justify-between">
                            <span className="text-foreground">{r.l}</span>
                            <span className="flex items-center gap-1 text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> {r.st}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/40 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                        <span>142 critérios validados</span>
                        <span className="text-success">100%</span>
                      </div>
                    </div>
                  </>
                )}

                {rightTab === "timeline" && (
                  <div className="relative">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-border/60" />
                    <div className="space-y-4">
                      {timelineEvents.map((ev, i) => {
                        const Icon = ev.icon;
                        const isLast = i === timelineEvents.length - 1;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="relative pl-9">
                            <div className={`absolute left-0 top-0 h-6 w-6 rounded-full grid place-items-center border ${isLast ? "bg-primary/20 border-primary/40 text-primary" : "bg-surface border-border text-muted-foreground"}`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <div className="text-[12px] font-medium leading-tight">{ev.label}</div>
                            <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{ev.detail}</div>
                            <div className="text-[10px] font-mono text-muted-foreground/70 mt-1">
                              {formatDistanceToNow(ev.time, { addSuffix: true, locale: ptBR })}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {rightTab === "resumo" && (
                  <>
                    <div className="rounded-lg border border-border/60 bg-surface/30 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Parecer técnico</div>
                      <div className={`text-[13px] leading-relaxed ${statusToneClass}`}>
                        {projeto.status === "aprovado" && "Projeto em conformidade com os critérios sanitários regulatórios analisados. Recomendado seguir para protocolo."}
                        {projeto.status === "parcial" && "Projeto parcialmente conforme. Ajustes pontuais são necessários antes do protocolo junto à vigilância sanitária."}
                        {projeto.status === "reprovado" && "Projeto apresenta inconformidades críticas que impedem o protocolo. Revisão estrutural recomendada."}
                        {!["aprovado", "parcial", "reprovado"].includes(projeto.status) && "Análise em andamento."}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                        <div className="text-xl font-mono font-semibold text-destructive tabular-nums">{counts.critico}</div>
                        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Críticas</div>
                      </div>
                      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
                        <div className="text-xl font-mono font-semibold text-warning tabular-nums">{counts.atencao}</div>
                        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Atenção</div>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-surface/30 p-3 text-center">
                        <div className="text-xl font-mono font-semibold text-foreground tabular-nums">{normasUsadas.length}</div>
                        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Normas</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-surface/30 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Risco sanitário</div>
                      {(() => {
                        const risco = counts.critico >= 3 ? "Alto" : counts.critico >= 1 ? "Médio" : counts.atencao >= 2 ? "Baixo" : "Mínimo";
                        const cor = risco === "Alto" ? "text-destructive" : risco === "Médio" ? "text-warning" : "text-success";
                        return (
                          <div className="flex items-end justify-between">
                            <span className={`text-2xl font-mono font-semibold ${cor}`}>{risco}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">baseado em {analises.length} ocorrências</span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="rounded-lg border border-border/60 bg-surface/30 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Normas aplicadas</div>
                      <div className="flex flex-wrap gap-1.5">
                        {normasUsadas.length === 0 ? <span className="text-[11px] text-muted-foreground">—</span> :
                          normasUsadas.map((n) => (
                            <span key={n} className="font-mono text-[10px] px-2 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary">{n}</span>
                          ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-dashed border-border/60 bg-surface/10 p-3 text-[10px] font-mono text-muted-foreground text-center">
                      Comentários colaborativos · em breve
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Reprocess overlay */}
      <AnimatePresence>
        {reprocessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-md bg-primary/20 grid place-items-center">
                  <RefreshCcw className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Reprocessando análise</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{projeto.nome_projeto}</div>
                </div>
              </div>
              <div className="space-y-2">
                {ANALYSIS_STEPS.map((s, i) => {
                  const done = i < reprocessStep;
                  const active = i === reprocessStep;
                  return (
                    <div key={s.label} className={`flex items-center gap-2.5 text-[12px] ${active ? "text-primary" : done ? "text-success" : "text-muted-foreground opacity-50"}`}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                       active ? <Activity className="h-3.5 w-3.5 animate-pulse" /> :
                       <div className="h-3.5 w-3.5 rounded-full border border-current" />}
                      <span className="flex-1">{s.label}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider">{done ? "ok" : active ? "..." : "—"}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}