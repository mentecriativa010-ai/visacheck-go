import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, FileText, AlertTriangle, AlertCircle, CheckCircle2, ArrowLeft, Printer } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Analise = {
  id: string; norma: string; descricao_problema: string; sugestao: string;
  severidade: "critico" | "atencao" | "conforme"; coordenada_x: number; coordenada_y: number; pagina: number;
};
type Projeto = {
  id: string; nome_projeto: string; status: string; score_conformidade: number;
  arquivo_path: string | null; tipo_arquivo: string;
};

const sevColor = { critico: "bg-destructive text-destructive-foreground", atencao: "bg-warning text-warning-foreground", conforme: "bg-success text-success-foreground" } as const;
const sevIcon = { critico: AlertCircle, atencao: AlertTriangle, conforme: CheckCircle2 } as const;

export default function ProjectDetail() {
  const { id } = useParams();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [selected, setSelected] = useState<Analise | null>(null);
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
    })();
  }, [id]);

  if (!projeto) return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b border-border px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/app/projects"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="min-w-0">
            <div className="font-medium truncate">{projeto.nome_projeto}</div>
            <div className="text-xs text-muted-foreground font-mono">{projeto.tipo_arquivo} · Score {projeto.score_conformidade}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
          <Link to={`/app/projects/${projeto.id}/report`}><Button variant="outline" size="sm"><Printer className="h-4 w-4" /> Relatório</Button></Link>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-auto bg-surface/30 p-6 grid place-items-start justify-center">
          {fileUrl ? (
            <div ref={pageWrap} className="relative shadow-card">
              <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<div className="p-8 text-sm">Carregando PDF...</div>}>
                <Page pageNumber={1} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
              {analises.filter(a => a.pagina === 1).map((a) => {
                const Icon = sevIcon[a.severidade];
                return (
                  <button key={a.id} onClick={() => setSelected(a)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full grid place-items-center ring-2 ring-background animate-pulse ${sevColor[a.severidade]}`}
                    style={{ left: `${a.coordenada_x * 100}%`, top: `${a.coordenada_y * 100}%` }}
                    title={a.descricao_problema}>
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          ) : (
            <Card className="glass p-12 text-center max-w-md">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <div className="font-medium">Visualização indisponível</div>
              <div className="text-sm text-muted-foreground mt-1">Apenas PDFs possuem visualizador nesta etapa. DWG/DXF estão armazenados.</div>
            </Card>
          )}
        </div>

        <aside className="w-96 border-l border-border bg-card/50 overflow-y-auto">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Inconformidades</h2>
            <div className="text-xs text-muted-foreground font-mono mt-1">{analises.length} pontos detectados</div>
          </div>
          {selected && (
            <Card className="glass m-4 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className={sevColor[selected.severidade]}>{selected.severidade}</Badge>
                <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">fechar</button>
              </div>
              <div className="font-mono text-xs text-primary mb-1">{selected.norma}</div>
              <div className="text-sm font-medium mb-2">{selected.descricao_problema}</div>
              <div className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Sugestão: </span>{selected.sugestao}</div>
            </Card>
          )}
          <div className="divide-y divide-border/50">
            {analises.map((a) => {
              const Icon = sevIcon[a.severidade];
              const isActive = selected?.id === a.id;
              return (
                <button key={a.id} onClick={() => setSelected(a)} className={`w-full text-left p-4 hover:bg-surface/40 transition-colors flex gap-3 ${isActive ? "bg-surface/60" : ""}`}>
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${a.severidade === "critico" ? "text-destructive" : a.severidade === "atencao" ? "text-warning" : "text-success"}`} />
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-primary uppercase tracking-wider">{a.norma}</div>
                    <div className="text-sm leading-snug mt-0.5">{a.descricao_problema}</div>
                  </div>
                </button>
              );
            })}
            {analises.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Nenhuma análise gerada.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
