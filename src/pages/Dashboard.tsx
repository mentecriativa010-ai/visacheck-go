import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { FileCheck2, FileClock, Gauge, ArrowUpRight, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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
          <p className="text-sm text-muted-foreground mt-1">Visão geral dos seus projetos sanitários.</p>
        </div>
        <Link to="/app/projects" className="text-sm text-primary hover:underline flex items-center gap-1">Novo projeto <ArrowUpRight className="h-4 w-4" /></Link>
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

      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Histórico recente</h3>
          <Link to="/app/projects" className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center">Nenhum projeto ainda. <Link to="/app/projects" className="text-primary">Envie o primeiro</Link>.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {recent.map((p) => (
              <Link key={p.id} to={`/app/projects/${p.id}`} className="flex items-center justify-between py-3 hover:bg-surface/50 px-2 -mx-2 rounded-md transition-colors">
                <div>
                  <div className="font-medium text-sm">{p.nome_projeto}</div>
                  <div className="text-xs text-muted-foreground font-mono">{format(new Date(p.created_at), "dd/MM/yyyy HH:mm")}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm">{p.score_conformidade}%</span>
                  <Badge className={statusColor[p.status]}>{statusLabel[p.status]}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
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
