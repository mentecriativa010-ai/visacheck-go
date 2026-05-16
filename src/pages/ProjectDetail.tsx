import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ZoomIn, ZoomOut, FileText, AlertTriangle, AlertCircle, CheckCircle2,
  ArrowLeft, Printer, Maximize2, Crosshair, Layers, Filter, Activity,
} from "lucide-react";
import { deriveAmbiente, statusLabel as fmtStatus } from "@/lib/analysisEngine";
import { motion, AnimatePresence } from "framer-motion";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Severidade = "critico" | "atencao" | "conforme";
type Analise = {
  id: string; norma: string; descricao_problema: string; sugestao: string;
  severidade: Severidade; coordenada_x: number; coordenada_y: number; pagina: number;
};
type Projeto = {
  id: string; nome_projeto: string; status: string; score_conformidade: number;
  arquivo_path: string | null; tipo_arquivo: string;
};

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

// Parse "[Ambiente] descrição" or derive
function extractAmbiente(a: Analise): string {
  const m = a.descricao_problema.match(/^\[([^\]]+)\]\s*/);
  if (m) return m[1];
  return deriveAmbiente(a.id + a.norma);
}
function cleanDesc(d: string) { return d.replace(/^\[[^\]]+\]\s*/, ""); }

export default function ProjectDetail() {
  const { id } = useParams();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [selected, setSelected] = useState<Analise | null>(null);
  const [sevFilter, setSevFilter] = useState<Severidade | "todas">("todas");
  const [groupBy, setGroupBy] = useState<"norma" | "ambiente" | "nenhum">("nenhum");
  const [cursorXY, setCursorXY] = useState<{ x: number; y: number } | null>(null);
  const [scanning, setScanning] = useState(true);
  const pageWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: p } = await supabase.from("projetos").select("*").eq("id", id).maybeSingle();
      setProjeto(p as Projeto);
      const { data: a } = await supabase.from("analises").select("*").eq("projeto_id", id);
      setAnalises((a as Analise[]) || []);
      if (p?.arquivo_path && (p as any).tipo_arquivo === "PDF") {
        const { data: signed } = await supabase.storage.from("projetos").createSignedUrl((p as any).arquivo_path, 3600);
        setFileUrl(signed?.signedUrl ?? null);
      }
      setTimeout(() => setScanning(false), 2400);
    })();
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

  if (!projeto) {
    return (
      <div className="h-screen grid place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4 animate-pulse text-primary" /> Carregando projeto...</div>
      </div>
    );
  }

  const counts = {
    critico: analises.filter(a => a.severidade === "critico").length,
    atencao: analises.filter(a => a.severidade === "atencao").length,
    conforme: analises.filter(a => a.severidade === "conforme").length,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-16 border-b border-border px-6 flex items-center justify-between gap-4 shrink-0 bg-card/40 backdrop-blur">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/app/projects"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="min-w-0">
            <div className="font-medium truncate flex items-center gap-2">
              {projeto.nome_projeto}
              <Badge variant="outline" className="font-mono text-[10px]">{projeto.tipo_arquivo}</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> ENGINE ATIVO</span>
              <span>·</span>
              <span>SCORE {projeto.score_conformidade}%</span>
              <span>·</span>
              <span className="uppercase tracking-wider">{fmtStatus(projeto.status)}</span>
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
          <Link to={`/app/projects/${projeto.id}/report`}>
            <Button variant="outline" size="sm" className="ml-2"><Printer className="h-4 w-4" /> Relatório</Button>
          </Link>
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
          {/* Crosshair indicator */}
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

                {/* Scan line overlay */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      initial={{ top: "0%" }} animate={{ top: "100%" }} exit={{ opacity: 0 }}
                      transition={{ duration: 2.2, ease: "linear" }}
                      className="absolute left-0 right-0 h-12 pointer-events-none"
                      style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.25), transparent)" }}
                    />
                  )}
                </AnimatePresence>

                {/* Markings */}
                {filtered.filter(a => a.pagina === 1).map((a, i) => {
                  const Icon = sevIcon[a.severidade];
                  const isActive = selected?.id === a.id;
                  return (
                    <motion.button
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: scanning ? 2.2 + i * 0.08 : i * 0.04, type: "spring", stiffness: 200, damping: 18 }}
                      onClick={() => setSelected(a)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${a.coordenada_x * 100}%`, top: `${a.coordenada_y * 100}%` }}
                      title={cleanDesc(a.descricao_problema)}
                    >
                      {/* Corner brackets */}
                      <div className="absolute inset-0 -m-3 pointer-events-none transition-opacity"
                        style={{ opacity: isActive ? 1 : 0 }}>
                        {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2",
                          "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((c) => (
                          <span key={c} className={`absolute h-2 w-2 ${c}`} style={{ borderColor: sevAccent[a.severidade] }} />
                        ))}
                      </div>
                      {/* Pulse halo */}
                      <span className="absolute inset-0 rounded-full animate-ping opacity-40"
                        style={{ background: sevAccent[a.severidade] }} />
                      {/* Marker */}
                      <span className="relative h-7 w-7 rounded-full grid place-items-center ring-2 ring-background shadow-lg transition-transform group-hover:scale-110"
                        style={{ background: sevAccent[a.severidade] }}>
                        <Icon className="h-3.5 w-3.5 text-background" />
                      </span>
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

        {/* Sidebar */}
        <aside className="w-[380px] border-l border-border bg-card/40 backdrop-blur flex flex-col">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Inconformidades</h2>
              <span className="text-xs font-mono text-muted-foreground">{filtered.length}/{analises.length}</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Análise sanitária regulatória</div>

            {/* Severity filter */}
            <div className="grid grid-cols-4 gap-1 mt-4 p-1 rounded-md bg-surface/60 border border-border/60">
              {[
                { k: "todas", l: "Todas", n: analises.length },
                { k: "critico", l: "Crítico", n: counts.critico },
                { k: "atencao", l: "Atenção", n: counts.atencao },
                { k: "conforme", l: "OK", n: counts.conforme },
              ].map((b) => (
                <button key={b.k} onClick={() => setSevFilter(b.k as any)}
                  className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${sevFilter === b.k ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {b.l} <span className="opacity-60">{b.n}</span>
                </button>
              ))}
            </div>

            {/* Group by */}
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

          {/* Selected card */}
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className={`glass m-4 p-4 border-l-4`} style={{ borderLeftColor: sevAccent[selected.severidade] }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={sevBg[selected.severidade]} variant="outline">{selected.severidade}</Badge>
                    <button onClick={() => setSelected(null)} className="text-[10px] text-muted-foreground hover:text-foreground font-mono uppercase">fechar</button>
                  </div>
                  <div className="font-mono text-[10px] text-primary uppercase tracking-wider mb-1">{selected.norma} · {extractAmbiente(selected)}</div>
                  <div className="text-sm font-medium mb-2 leading-snug">{cleanDesc(selected.descricao_problema)}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">Sugestão técnica: </span>{selected.sugestao}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-3 pt-3 border-t border-border/40">
                    coord [{(selected.coordenada_x * 100).toFixed(1)}, {(selected.coordenada_y * 100).toFixed(1)}] · pág {selected.pagina}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {grouped.map(({ key, items }) => (
              <div key={key}>
                {groupBy !== "nenhum" && (
                  <div className="px-5 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-surface/30 border-y border-border/40 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Filter className="h-3 w-3" /> {key}</span>
                    <span>{items.length}</span>
                  </div>
                )}
                <div className="divide-y divide-border/40">
                  {items.map((a) => {
                    const Icon = sevIcon[a.severidade];
                    const isActive = selected?.id === a.id;
                    return (
                      <button key={a.id} onClick={() => setSelected(a)}
                        className={`w-full text-left p-4 hover:bg-surface/40 transition-colors flex gap-3 ${isActive ? "bg-surface/60" : ""}`}>
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${sevDot[a.severidade]}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] text-primary uppercase tracking-wider flex items-center justify-between">
                            <span>{a.norma}</span>
                            <span className="text-muted-foreground">{extractAmbiente(a)}</span>
                          </div>
                          <div className="text-sm leading-snug mt-1">{cleanDesc(a.descricao_problema)}</div>
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
      </div>
    </div>
  );
}
