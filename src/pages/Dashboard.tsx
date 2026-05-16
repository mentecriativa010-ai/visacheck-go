import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { FileCheck2, FileClock, Gauge, ArrowUpRight, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Projeto = {
  id: string;
  nome_projeto: string;
  status: "pendente" | "analisando" | "aprovado" | "parcial" | "reprovado";
  score_conformidade: number;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente", analisando: "Analisando", aprovado: "Aprovado", parcial: "Parcialmente Conforme", reprovado: "Reprovado",
};
const statusColor: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  analisando: "bg-primary/15 text-primary",
  aprovado: "bg-success/15 text-success",
  parcial: "bg-warning/15 text-warning",
  reprovado: "bg-destructive/15 text-destructive",
};

export default function Dashboard() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  useEffect(() => {
    supabase.from("projetos").select("id,nome_projeto,status,score_conformidade,created_at").order("created_at", { ascending: false }).then(({ data }) => {
      setProjetos((data as Projeto[]) || []);
    });
  }, []);

  const total = projetos.length;
  const aprovados = projetos.filter((p) => p.status === "aprovado").length;
  const pendentes = projetos.filter((p) => p.status === "pendente" || p.status === "analisando").length;
  const inconformes = projetos.filter((p) => p.status === "parcial" || p.status === "reprovado").length;
  const scoreMedio = total ? Math.round(projetos.reduce((a, p) => a + p.score_conformidade, 0) / total) : 0;

  const byStatus = [
    { name: "Aprovado", value: aprovados, color: "hsl(var(--success))" },
    { name: "Parcial", value: projetos.filter(p => p.status === "parcial").length, color: "hsl(var(--warning))" },
    { name: "Reprovado", value: projetos.filter(p => p.status === "reprovado").length, color: "hsl(var(--destructive))" },
    { name: "Pendente", value: pendentes, color: "hsl(var(--muted-foreground))" },
  ];

  const recent = projetos.slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral operacional do engine regulatório.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-3 py-1.5 rounded-md border border-border/60 bg-surface/40">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Engine online · 142 normas ativas
          </div>
          <Link to="/app/projects" className="text-sm text-primary hover:underline flex items-center gap-1">Novo projeto <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Kpi icon={FileCheck2} label="Projetos enviados" value={total} />
        <Kpi icon={FileCheck2} label="Aprovados" value={aprovados} tone="success" />
        <Kpi icon={FileClock} label="Pendentes" value={pendentes} tone="primary" />
        <Kpi icon={Gauge} label="Score médio" value={`${scoreMedio}%`} tone={scoreMedio >= 85 ? "success" : scoreMedio >= 60 ? "warning" : "destructive"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="glass p-6 lg:col-span-2">
          <h3 className="font-medium mb-4">Score por projeto</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={projetos.slice(0, 8).reverse().map(p => ({ name: p.nome_projeto.slice(0, 12), score: p.score_conformidade }))}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="glass p-6">
          <h3 className="font-medium mb-4">Distribuição</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {byStatus.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            {byStatus.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Atividade recente</h3>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">Timeline operacional</div>
            </div>
            <Link to="/app/projects" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">Nenhum projeto ainda. <Link to="/app/projects" className="text-primary">Envie o primeiro</Link>.</div>
          ) : (
            <div className="relative">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border/60" />
              {recent.map((p) => {
                const Icon = p.status === "aprovado" ? CheckCircle2 : p.status === "reprovado" ? AlertCircle : Activity;
                const dotColor = p.status === "aprovado" ? "hsl(var(--success))" : p.status === "parcial" ? "hsl(var(--warning))" : p.status === "reprovado" ? "hsl(var(--destructive))" : "hsl(var(--primary))";
                return (
                  <Link key={p.id} to={`/app/projects/${p.id}`} className="relative flex items-center gap-3 py-3 pl-10 pr-3 -mx-3 rounded-md hover:bg-surface/40 transition-colors group">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full grid place-items-center ring-4 ring-background" style={{ background: `${dotColor.replace("hsl", "hsla").replace(")", " / 0.18)")}` }}>
                      <Icon className="h-2.5 w-2.5" style={{ color: dotColor }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{p.nome_projeto}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ptBR })} · análise sanitária concluída
                      </div>
                    </div>
                    <span className="font-mono text-sm tabular-nums">{p.score_conformidade}%</span>
                    <Badge className={statusColor[p.status]}>{statusLabel[p.status]}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Status do engine</h3>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">Em tempo real</div>
            </div>
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              { k: "Regulatory Engine", v: "Online", tone: "text-success" },
              { k: "Catálogo normativo", v: "142 regras", tone: "text-primary" },
              { k: "Modelo de visão", v: "v1.0 ativo", tone: "text-success" },
              { k: "Parser CAD (DWG/DXF)", v: "Em preparação", tone: "text-warning" },
              { k: "OCR de plantas", v: "Em preparação", tone: "text-warning" },
            ].map((s) => (
              <div key={s.k} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                <span className="text-muted-foreground">{s.k}</span>
                <span className={`font-mono ${s.tone}`}>{s.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Processados · últimas 24h</div>
            <div className="text-3xl font-mono font-semibold">{projetos.filter(p => Date.now() - new Date(p.created_at).getTime() < 86400000).length}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone = "default" }: { icon: any; label: string; value: any; tone?: "default" | "primary" | "success" | "warning" | "destructive" }) {
  const toneClass = { default: "text-foreground", primary: "text-primary", success: "text-success", warning: "text-warning", destructive: "text-destructive" }[tone];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</span>
          <Icon className={`h-4 w-4 ${toneClass}`} />
        </div>
        <div className={`text-3xl font-semibold font-mono ${toneClass}`}>{value}</div>
      </Card>
    </motion.div>
  );
}
