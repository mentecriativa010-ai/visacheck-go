import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Activity, ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { deriveAmbiente, statusLabel } from "@/lib/analysisEngine";

type Severidade = "critico" | "atencao" | "conforme";
type Analise = { id: string; norma: string; descricao_problema: string; sugestao: string; severidade: Severidade };
type Projeto = { id: string; nome_projeto: string; status: string; score_conformidade: number; created_at: string; tipo_arquivo: string };
type Profile = { nome: string | null; crea_cau: string | null; razao_social: string | null; email: string | null; profissao: string | null };

function extractAmbiente(a: Analise): string {
  const m = a.descricao_problema.match(/^\[([^\]]+)\]\s*/);
  return m ? m[1] : deriveAmbiente(a.id + a.norma);
}
function cleanDesc(d: string) { return d.replace(/^\[[^\]]+\]\s*/, ""); }

const NORMAS_AVALIADAS = [
  { codigo: "RDC 50/2002", descricao: "Regulamento técnico para planejamento e programação de EAS" },
  { codigo: "RDC 15/2012", descricao: "Boas práticas para processamento de produtos para saúde" },
  { codigo: "RDC 63/2011", descricao: "Boas práticas de funcionamento para serviços de saúde" },
  { codigo: "RDC 51/2011", descricao: "Requisitos mínimos para análise de projetos de EAS" },
  { codigo: "NBR 9050", descricao: "Acessibilidade a edificações, mobiliário e espaços urbanos" },
  { codigo: "SUVISA-GO", descricao: "Diretrizes da Superintendência de Vigilância Sanitária de Goiás" },
];

export default function Report() {
  const { id } = useParams();
  const { user } = useAuth();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: p } = await supabase.from("projetos").select("*").eq("id", id).maybeSingle();
      setProjeto(p as Projeto);
      const { data: a } = await supabase.from("analises").select("*").eq("projeto_id", id).order("severidade");
      setAnalises((a as Analise[]) || []);
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("nome,crea_cau,razao_social,email,profissao").eq("id", user.id).maybeSingle();
        setProfile(prof as Profile);
      }
      if (p) {
        await supabase.from("relatorios").upsert({ projeto_id: p.id, status_final: (p as any).status, gerado_em: new Date().toISOString() }, { onConflict: "projeto_id" }).select();
      }
    })();
  }, [id, user]);

  const summary = useMemo(() => {
    const criticos = analises.filter(a => a.severidade === "critico").length;
    const atencao = analises.filter(a => a.severidade === "atencao").length;
    const normasMap = new Map<string, { total: number; criticos: number }>();
    for (const a of analises) {
      const cur = normasMap.get(a.norma) || { total: 0, criticos: 0 };
      cur.total++;
      if (a.severidade === "critico") cur.criticos++;
      normasMap.set(a.norma, cur);
    }
    return { criticos, atencao, normasMap };
  }, [analises]);

  if (!projeto) return <div className="p-8 text-sm text-muted-foreground">Carregando relatório...</div>;

  const score = projeto.score_conformidade;
  const scoreColor = score >= 85 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const reportId = `SAI-${projeto.id.slice(0, 8).toUpperCase()}`;
  const responsavel = profile?.nome || profile?.razao_social || user?.email || "—";

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <header className="no-print h-16 border-b border-border px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
        <Link to={`/app/projects/${projeto.id}`}><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Voltar ao viewer</Button></Link>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{reportId}</div>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Exportar PDF</Button>
        </div>
      </header>

      <div className="max-w-[860px] mx-auto p-10 print:p-12 print:max-w-none">
        {/* COVER */}
        <section className="print-page mb-12 print:mb-0 print:min-h-[26cm] flex flex-col">
          <div className="flex items-center justify-between pb-6 border-b border-border print:border-black/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/20 grid place-items-center print:bg-black/5">
                <Activity className="h-5 w-5 text-primary print:text-black" />
              </div>
              <div>
                <div className="font-semibold tracking-tight">SanitaryAI</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Regulatory Analysis Engine</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Documento</div>
              <div className="font-mono text-sm">{reportId}</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-16 print:py-24">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">Parecer Técnico Sanitário</div>
            <h1 className="text-5xl print:text-4xl font-semibold leading-tight tracking-tight">{projeto.nome_projeto}</h1>
            <div className="mt-6 text-sm text-muted-foreground max-w-xl leading-relaxed">
              Análise regulatória automatizada para conformidade sanitária de estabelecimentos assistenciais de saúde,
              conduzida pelo engine SanitaryAI com base na legislação brasileira vigente.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border print:border-black/20 text-sm">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Responsável Técnico</div>
              <div className="font-medium">{responsavel}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                {profile?.crea_cau ? `CREA/CAU ${profile.crea_cau}` : profile?.profissao ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Emissão</div>
              <div className="font-medium">{format(new Date(), "dd 'de' MMMM 'de' yyyy")}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">{format(new Date(), "HH:mm")} · {projeto.tipo_arquivo}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Classificação</div>
              <Badge className="font-mono" variant="outline" style={{ borderColor: scoreColor, color: scoreColor }}>
                {statusLabel(projeto.status)}
              </Badge>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Score Sanitário</div>
              <div className="text-2xl font-mono font-semibold" style={{ color: scoreColor }}>{score}<span className="text-sm text-muted-foreground">/100</span></div>
            </div>
          </div>
        </section>

        {/* EXECUTIVE SUMMARY */}
        <section className="print-page mb-12 print:mb-0">
          <SectionTitle number="01" title="Resumo Executivo" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3">
            <Card className="glass p-6 print:shadow-none print:border-black/20">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Score consolidado</div>
              <div className="h-40 relative print:h-32">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: "score", value: score, fill: scoreColor }]} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background={{ fill: "hsl(var(--surface))" }} dataKey="value" cornerRadius={20} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-3xl font-mono font-semibold" style={{ color: scoreColor }}>{score}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conformidade</div>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="glass p-6 print:shadow-none print:border-black/20">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Distribuição</div>
              <div className="space-y-3">
                <SevRow icon={AlertCircle} label="Críticas" value={summary.criticos} color="hsl(var(--destructive))" total={analises.length} />
                <SevRow icon={AlertTriangle} label="Atenção" value={summary.atencao} color="hsl(var(--warning))" total={analises.length} />
                <SevRow icon={CheckCircle2} label="Conformes" value={analises.length - summary.criticos - summary.atencao} color="hsl(var(--success))" total={analises.length} />
              </div>
            </Card>
            <Card className="glass p-6 print:shadow-none print:border-black/20">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Veredito</div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5" style={{ color: scoreColor }} />
                <div>
                  <div className="font-semibold" style={{ color: scoreColor }}>{statusLabel(projeto.status)}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {score >= 85 ? "Projeto apto à submissão à vigilância sanitária mediante ajustes pontuais."
                      : score >= 60 ? "Projeto requer adequações antes de submissão à autoridade sanitária."
                      : "Projeto apresenta inconformidades críticas que impedem aprovação no estado atual."}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass p-6 print:shadow-none print:border-black/20">
            <p className="text-sm leading-relaxed">
              Foram identificadas <span className="font-mono font-semibold">{analises.length}</span> ocorrências regulatórias no projeto
              <span className="font-medium"> {projeto.nome_projeto}</span>, sendo
              <span className="text-destructive font-mono"> {summary.criticos} críticas</span> e
              <span className="text-warning font-mono"> {summary.atencao} de atenção</span>.
              Considerando os pesos normativos atribuídos, o projeto atinge score sanitário consolidado de
              <span className="font-mono font-semibold" style={{ color: scoreColor }}> {score}%</span>, sendo classificado como
              <span className="font-medium"> {statusLabel(projeto.status)}</span>.
            </p>
          </Card>
        </section>

        {/* NORMAS AVALIADAS */}
        <section className="print-page mb-12 print:mb-0">
          <SectionTitle number="02" title="Normas Avaliadas" />
          <Card className="glass overflow-hidden print:shadow-none print:border-black/20">
            <table className="w-full text-sm">
              <thead className="bg-surface/40 print:bg-black/5">
                <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="text-left p-3 w-40">Norma</th>
                  <th className="text-left p-3">Descrição</th>
                  <th className="text-center p-3 w-24">Ocorrências</th>
                  <th className="text-center p-3 w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {NORMAS_AVALIADAS.map((n) => {
                  const stats = summary.normasMap.get(n.codigo);
                  const hasCriticos = stats && stats.criticos > 0;
                  const conforme = !stats;
                  return (
                    <tr key={n.codigo}>
                      <td className="p-3 font-mono text-xs">{n.codigo}</td>
                      <td className="p-3 text-xs text-muted-foreground">{n.descricao}</td>
                      <td className="p-3 text-center font-mono text-xs">{stats?.total ?? 0}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                          conforme ? "bg-success/15 text-success" : hasCriticos ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                        }`}>
                          {conforme ? "Conforme" : hasCriticos ? "Crítico" : "Atenção"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>

        {/* INCONFORMIDADES */}
        <section className="mb-12 print:mb-0">
          <SectionTitle number="03" title="Inconformidades Detectadas" subtitle={`${analises.length} ocorrências`} />
          <div className="space-y-3">
            {analises.map((a, i) => (
              <Card key={a.id} className="glass p-5 print:shadow-none print:border-black/20 border-l-4" style={{ borderLeftColor: a.severidade === "critico" ? "hsl(var(--destructive))" : a.severidade === "atencao" ? "hsl(var(--warning))" : "hsl(var(--success))" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">#{String(i + 1).padStart(2, "0")}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">{a.norma}</Badge>
                    <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">{extractAmbiente(a)}</Badge>
                  </div>
                  <Badge className={
                    a.severidade === "critico" ? "bg-destructive/15 text-destructive border-destructive/30" :
                    a.severidade === "atencao" ? "bg-warning/15 text-warning border-warning/30" :
                    "bg-success/15 text-success border-success/30"
                  } variant="outline">{a.severidade}</Badge>
                </div>
                <div className="text-sm font-medium mb-2 leading-snug">{cleanDesc(a.descricao_problema)}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-medium">Sugestão técnica: </span>{a.sugestao}
                </div>
              </Card>
            ))}
            {analises.length === 0 && (
              <Card className="glass p-8 text-center text-sm text-muted-foreground">Nenhuma inconformidade detectada.</Card>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-16 pt-6 border-t border-border print:border-black/20">
          <div className="grid grid-cols-2 gap-6 text-xs text-muted-foreground">
            <div>
              <div className="font-mono uppercase tracking-wider text-[10px] mb-1">Engine</div>
              <div>SanitaryAI Regulatory Engine v1.0</div>
              <div className="font-mono">{reportId} · {format(new Date(), "yyyy-MM-dd HH:mm")}</div>
            </div>
            <div className="text-right">
              <div className="font-mono uppercase tracking-wider text-[10px] mb-1">Aviso</div>
              <div>Documento gerado automaticamente. Não substitui a análise final da autoridade sanitária competente.</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-primary tracking-wider">{number}</span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {subtitle && <span className="text-xs font-mono text-muted-foreground">{subtitle}</span>}
    </div>
  );
}

function SevRow({ icon: Icon, label, value, color, total }: any) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" style={{ color }} /> {label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
