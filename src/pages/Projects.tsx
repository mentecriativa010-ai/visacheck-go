import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { UploadCloud, Loader2, FileText, Search, CheckCircle2 } from "lucide-react";
import { runSimulatedAnalysis, ANALYSIS_STEPS, statusLabel as fmtStatus } from "@/lib/analysisEngine";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Projeto = {
  id: string; nome_projeto: string; tipo_arquivo: string; status: string;
  score_conformidade: number; created_at: string; arquivo_path: string | null;
};

const statusColor: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground", analisando: "bg-primary/15 text-primary",
  aprovado: "bg-success/15 text-success", parcial: "bg-warning/15 text-warning", reprovado: "bg-destructive/15 text-destructive",
};

export default function Projects() {
  const { user } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ step: number; file: string } | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const load = useCallback(async () => {
    const { data } = await supabase.from("projetos").select("*").order("created_at", { ascending: false });
    setProjetos((data as Projeto[]) || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const runProgress = async (fileName: string) => {
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setProgress({ step: i, file: fileName });
      await new Promise((r) => setTimeout(r, ANALYSIS_STEPS[i].duration));
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    if (!user || files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const isPdf = ext === "pdf";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("projetos").upload(path, file);
        if (up.error) throw up.error;

        const ins = await supabase.from("projetos").insert({
          usuario_id: user.id,
          nome_projeto: file.name.replace(/\.[^.]+$/, ""),
          tipo_arquivo: ext.toUpperCase(),
          arquivo_path: path,
          status: isPdf ? "analisando" : "pendente",
          score_conformidade: 0,
        }).select().single();
        if (ins.error) throw ins.error;

        if (isPdf) {
          await runProgress(file.name);
          const result = runSimulatedAnalysis(ins.data.id);
          const rows = result.findings.map((f) => ({
            projeto_id: ins.data.id,
            norma: f.norma, descricao_problema: `[${f.ambiente}] ${f.descricao_problema}`, sugestao: f.sugestao,
            severidade: f.severidade, coordenada_x: f.coordenada_x, coordenada_y: f.coordenada_y, pagina: f.pagina,
          }));
          await supabase.from("analises").insert(rows);
          await supabase.from("projetos").update({ status: result.status, score_conformidade: result.score }).eq("id", ins.data.id);
          toast.success(`Análise concluída · Score ${result.score}%`, { description: `${result.findings.length} ocorrências detectadas em ${file.name}` });
        } else {
          toast.success(`${file.name} armazenado`, { description: "Análise CAD nativa estará disponível em breve." });
        }
      } catch (e: any) {
        toast.error(e.message || "Falha no upload");
      }
    }
    setProgress(null);
    setUploading(false);
    load();
  }, [user, load]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/acad": [".dwg"], "image/vnd.dwg": [".dwg"], "application/dxf": [".dxf"] },
    maxSize: 50 * 1024 * 1024,
  });

  const remove = async (p: Projeto) => {
    if (!confirm(`Excluir "${p.nome_projeto}"?`)) return;
    if (p.arquivo_path) await supabase.storage.from("projetos").remove([p.arquivo_path]);
    await supabase.from("projetos").delete().eq("id", p.id);
    load();
  };

  const filtered = projetos.filter((p) => {
    if (statusFilter !== "todos" && p.status !== statusFilter) return false;
    if (query && !p.nome_projeto.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">Envie plantas em PDF para análise automatizada. DWG/DXF são armazenados para o engine CAD.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar projeto..." className="pl-9 w-64" />
          </div>
          <div className="flex gap-1 p-1 rounded-md bg-surface/60 border border-border/60">
            {["todos", "aprovado", "parcial", "reprovado", "analisando"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${statusFilter === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {s === "todos" ? "Todos" : fmtStatus(s)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <Card {...getRootProps()} className={`glass border-dashed cursor-pointer p-12 mb-8 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
        <input {...getInputProps()} />
        <UploadCloud className={`h-10 w-10 mx-auto mb-4 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Processando...</div>
        ) : (
          <>
            <div className="font-medium">Arraste arquivos ou clique para selecionar</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">PDF · DWG · DXF — até 50 MB</div>
          </>
        )}
      </Card>

      <Card className="glass">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {projetos.length === 0 ? "Nenhum projeto ainda." : "Nenhum projeto corresponde aos filtros."}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-surface/40 transition-colors">
                <div className="h-10 w-10 rounded-md bg-surface grid place-items-center"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <Link to={`/app/projects/${p.id}`} className="font-medium hover:text-primary block truncate">{p.nome_projeto}</Link>
                  <div className="text-xs text-muted-foreground font-mono">{p.tipo_arquivo} · {format(new Date(p.created_at), "dd/MM/yyyy HH:mm")}</div>
                </div>
                <span className="font-mono text-sm tabular-nums">{p.score_conformidade}%</span>
                <Badge className={statusColor[p.status]}>{fmtStatus(p.status)}</Badge>
                <Button variant="ghost" size="sm" onClick={() => remove(p)}>Excluir</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Analysis progress modal */}
      <AnimatePresence>
        {progress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-xl p-8 max-w-lg w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-md bg-primary/20 grid place-items-center glow-ring">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
                <div>
                  <div className="font-semibold">Engine regulatória em execução</div>
                  <div className="text-xs font-mono text-muted-foreground truncate max-w-xs">{progress.file}</div>
                </div>
              </div>
              <div className="space-y-3">
                {ANALYSIS_STEPS.map((s, i) => {
                  const done = i < progress.step;
                  const active = i === progress.step;
                  return (
                    <div key={s.label} className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${active ? "border-primary/50 bg-primary/5" : done ? "border-success/30 bg-success/5" : "border-border/40 opacity-50"}`}>
                      <div className="mt-0.5">
                        {done ? <CheckCircle2 className="h-4 w-4 text-success" /> :
                         active ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> :
                         <div className="h-4 w-4 rounded-full border border-border" />}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${active ? "text-primary" : ""}`}>{s.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{s.detail}</div>
                      </div>
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
