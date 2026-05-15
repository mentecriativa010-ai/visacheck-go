import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { UploadCloud, Loader2, FileText } from "lucide-react";
import { runSimulatedAnalysis } from "@/lib/analysisEngine";
import { format } from "date-fns";

type Projeto = {
  id: string; nome_projeto: string; tipo_arquivo: string; status: string;
  score_conformidade: number; created_at: string; arquivo_path: string | null;
};

const statusLabel: Record<string, string> = { pendente: "Pendente", analisando: "Analisando", aprovado: "Aprovado", parcial: "Parcial", reprovado: "Reprovado" };
const statusColor: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground", analisando: "bg-primary/15 text-primary",
  aprovado: "bg-success/15 text-success", parcial: "bg-warning/15 text-warning", reprovado: "bg-destructive/15 text-destructive",
};

export default function Projects() {
  const { user } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("projetos").select("*").order("created_at", { ascending: false });
    setProjetos((data as Projeto[]) || []);
  }, []);
  useEffect(() => { load(); }, [load]);

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

        // Insert as 'analisando'
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
          // Run simulated analysis
          const result = runSimulatedAnalysis(ins.data.id);
          const rows = result.findings.map((f) => ({
            projeto_id: ins.data.id,
            norma: f.norma, descricao_problema: f.descricao_problema, sugestao: f.sugestao,
            severidade: f.severidade, coordenada_x: f.coordenada_x, coordenada_y: f.coordenada_y, pagina: f.pagina,
          }));
          await supabase.from("analises").insert(rows);
          await supabase.from("projetos").update({ status: result.status, score_conformidade: result.score }).eq("id", ins.data.id);
        }
      } catch (e: any) {
        toast.error(e.message || "Falha no upload");
      }
    }
    setUploading(false);
    toast.success("Upload concluído");
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Projetos</h1>
        <p className="text-sm text-muted-foreground mt-1">Envie plantas em PDF para análise automatizada. DWG/DXF são armazenados para etapas futuras.</p>
      </header>

      <Card {...getRootProps()} className={`glass border-dashed cursor-pointer p-12 mb-8 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
        <input {...getInputProps()} />
        <UploadCloud className={`h-10 w-10 mx-auto mb-4 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Enviando e analisando...</div>
        ) : (
          <>
            <div className="font-medium">Arraste arquivos ou clique para selecionar</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">PDF · DWG · DXF — até 50 MB</div>
          </>
        )}
      </Card>

      <Card className="glass">
        {projetos.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum projeto ainda.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {projetos.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-surface/40 transition-colors">
                <div className="h-10 w-10 rounded-md bg-surface grid place-items-center"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <Link to={`/app/projects/${p.id}`} className="font-medium hover:text-primary block truncate">{p.nome_projeto}</Link>
                  <div className="text-xs text-muted-foreground font-mono">{p.tipo_arquivo} · {format(new Date(p.created_at), "dd/MM/yyyy HH:mm")}</div>
                </div>
                <span className="font-mono text-sm tabular-nums">{p.score_conformidade}%</span>
                <Badge className={statusColor[p.status]}>{statusLabel[p.status]}</Badge>
                <Button variant="ghost" size="sm" onClick={() => remove(p)}>Excluir</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
