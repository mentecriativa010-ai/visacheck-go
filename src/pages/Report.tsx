import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Activity } from "lucide-react";
import { format } from "date-fns";
import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis } from "recharts";

type Analise = { id: string; norma: string; descricao_problema: string; sugestao: string; severidade: "critico" | "atencao" | "conforme" };
type Projeto = { id: string; nome_projeto: string; status: string; score_conformidade: number; created_at: string; tipo_arquivo: string };

const statusLabel: Record<string, string> = { aprovado: "Aprovado", parcial: "Parcialmente Conforme", reprovado: "Reprovado", analisando: "Em análise", pendente: "Pendente" };

export default function Report() {
  const { id } = useParams();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [analises, setAnalises] = useState<Analise[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: p } = await supabase.from("projetos").select("*").eq("id", id).maybeSingle();
      setProjeto(p as Projeto);
      const { data: a } = await supabase.from("analises").select("*").eq("projeto_id", id).order("severidade");
      setAnalises((a as Analise[]) || []);
      if (p) {
        await supabase.from("relatorios").upsert({ projeto_id: p.id, status_final: (p as any).status, gerado_em: new Date().toISOString() }, { onConflict: "projeto_id" }).select();
      }
    })();
  }, [id]);

  if (!projeto) return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>;

  const score = projeto.score_conformidade;
  const scoreColor = score >= 85 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const criticos = analises.filter(a => a.severidade === "critico").length;
  const atencao = analises.filter(a => a.severidade === "atencao").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print h-16 border-b border-border px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
        <Link to={`/app/projects/${projeto.id}`}><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Voltar</Button></Link>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Exportar PDF</Button>
      </header>

      <div className="max-w-4xl mx-auto p-10 print:p-0">
        <div className="flex items-center gap-3 mb-10 print:mb-6">
          <div className="h-10 w-10 rounded-md bg-primary/20 grid place-items-center"><Activity className="h-5 w-5 text-primary" /></div>
          <div>
            <div className="font-semibold">SanitaryAI</div>
            <div className="text-xs font-mono text-muted-foreground">Relatório técnico de análise sanitária</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Projeto</div>
          <h1 className="text-3xl font-semibold mt-1">{projeto.nome_projeto}</h1>
          <div className="text-sm text-muted-foreground font-mono mt-1">
            {projeto.tipo_arquivo} · Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="glass p-6 md:col-span-1">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Score</div>
            <div className="h-40 relative">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ name: "score", value: score, fill: scoreColor }]} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: "hsl(var(--surface))" }} dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-4xl font-mono font-semibold" style={{ color: scoreColor }}>{score}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conformidade</div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="glass p-6 md:col-span-2">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Resumo executivo</div>
            <p className="text-sm leading-relaxed">
              Foram identificadas <span className="font-mono font-semibold text-foreground">{analises.length}</span> ocorrências no projeto, sendo
              <span className="text-destructive font-mono"> {criticos} críticas</span> e
              <span className="text-warning font-mono"> {atencao} de atenção</span>.
              Considerando o peso regulatório, o projeto atinge score de conformidade de <span className="font-mono font-semibold">{score}%</span> e é classificado como
              <Badge className="ml-2" variant="outline">{statusLabel[projeto.status]}</Badge>.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Análise baseada em RDC 50/2002, RDC 63/2011, RDC 15/2012, RDC 51/2011, NBR 9050, Código de Obras de Goiânia e diretrizes SUVISA-GO.
            </p>
          </Card>
        </div>

        <h2 className="text-lg font-semibold mb-4">Inconformidades detectadas</h2>
        <div className="space-y-3">
          {analises.map((a, i) => (
            <Card key={a.id} className="glass p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">#{String(i + 1).padStart(2, "0")}</span>
                  <Badge variant="outline" className="font-mono">{a.norma}</Badge>
                </div>
                <Badge className={a.severidade === "critico" ? "bg-destructive/15 text-destructive" : a.severidade === "atencao" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}>
                  {a.severidade}
                </Badge>
              </div>
              <div className="text-sm font-medium mb-1">{a.descricao_problema}</div>
              <div className="text-sm text-muted-foreground"><span className="text-foreground">Sugestão: </span>{a.sugestao}</div>
            </Card>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          Documento gerado automaticamente · SanitaryAI · Não substitui análise final da autoridade sanitária competente.
        </div>
      </div>
    </div>
  );
}
