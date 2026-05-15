import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Activity,
  Upload,
  Cpu,
  ScanSearch,
  FileBarChart,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  FileCheck2,
  Mail,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-border/50 sticky top-0 z-50 bg-background/70 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary/15 grid place-items-center border border-primary/30">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">SanitaryAI</div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-[0.2em]">REGULATORY ENGINE</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#normas" className="hover:text-foreground transition-colors">Normas</a>
          <a href="#dashboard" className="hover:text-foreground transition-colors">Plataforma</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link to="/signup"><Button size="sm">Criar conta</Button></Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 lg:px-12 pt-16 pb-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              ENTERPRISE · REGULATORY AI
            </div>
            <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
              Conformidade sanitária <br />
              <span className="text-primary">orientada por IA</span> para projetos de saúde.
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">
              Plataforma profissional para arquitetos e engenheiros validarem plantas contra RDC 50, RDC 15, NBR 9050 e
              normas municipais. Análise automatizada, marcação visual e relatório técnico pronto em minutos.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/signup"><Button size="lg" className="gap-2">Começar análise <ArrowRight className="h-4 w-4" /></Button></Link>
              <a href="#como-funciona"><Button size="lg" variant="outline">Ver como funciona</Button></a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> LGPD compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> RDC ANVISA</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> NBR 9050</span>
            </div>
          </motion.div>

          {/* HERO MOCKUP */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <BlueprintMockup />
          </motion.div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="px-6 lg:px-12 py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="WORKFLOW"
            title="Da planta ao relatório em 4 etapas"
            description="Pipeline técnico simples, projetado para escritórios que precisam de velocidade sem abrir mão da precisão regulatória."
          />
          <div className="mt-14 grid md:grid-cols-4 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/40">
            {[
              { icon: Upload, step: "01", title: "Upload PDF/DWG", desc: "Envie a planta arquitetônica. Suporte a múltiplas pranchas." },
              { icon: Cpu, step: "02", title: "IA analisa normas", desc: "Motor regulatório cruza o projeto com a base normativa vigente." },
              { icon: ScanSearch, step: "03", title: "Detecta inconformidades", desc: "Marcações visuais sobre a planta, classificadas por severidade." },
              { icon: FileBarChart, step: "04", title: "Relatório automático", desc: "PDF técnico com score, normas citadas e sugestões corretivas." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card/60 p-6 relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-9 w-9 rounded-md bg-primary/10 border border-primary/20 grid place-items-center">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{s.step}</span>
                </div>
                <div className="font-medium mb-1.5">{s.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NORMAS SUPORTADAS */}
      <section id="normas" className="px-6 lg:px-12 py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="REGULATORY BASE"
            title="Normas suportadas"
            description="Base regulatória federal, estadual e municipal continuamente atualizada pela nossa equipe técnica."
          />
          <div className="mt-12 flex flex-wrap gap-3 justify-center">
            {[
              "RDC 50/2002",
              "RDC 15/2012",
              "RDC 63/2011",
              "RDC 51/2011",
              "NBR 9050",
              "VISA Goiânia",
              "SUVISA-GO",
              "Código de Obras GO",
            ].map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="px-4 py-2.5 rounded-md border border-border/60 bg-card/60 backdrop-blur-sm text-sm font-mono tracking-wide hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="text-primary mr-2">◆</span>{n}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section id="dashboard" className="px-6 lg:px-12 py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="PLATFORM"
            title="Dashboard técnico, pensado para escritórios"
            description="Visão consolidada de score sanitário, status de projetos e análises recentes em uma única interface."
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 lg:px-12 py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="CAPABILITIES" title="Por que SanitaryAI" />
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            <FeatureCard
              icon={ScanSearch}
              title="Detecção visual"
              desc="Marcações sobrepostas à planta destacam inconformidades por severidade."
              preview={<MarkingPreview />}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Base regulatória"
              desc="RDC ANVISA, NBR e códigos municipais atualizados continuamente."
              preview={<NormPreview />}
            />
            <FeatureCard
              icon={FileBarChart}
              title="Relatório técnico"
              desc="Score, normas citadas, sugestões corretivas e exportação em PDF."
              preview={<ReportPreview />}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-12 py-24 border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Pronto para validar seu próximo projeto?
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Crie sua conta e envie a primeira planta em menos de 2 minutos.
          </p>
          <div className="flex justify-center gap-3 mt-8">
            <Link to="/signup"><Button size="lg" className="gap-2">Criar conta gratuita <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Entrar</Button></Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 px-6 lg:px-12 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-md bg-primary/15 grid place-items-center border border-primary/30">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="font-semibold">SanitaryAI</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Plataforma de análise sanitária regulatória para projetos arquitetônicos de saúde.
              </p>
            </div>
            <FooterCol
              title="Plataforma"
              links={[
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Normas suportadas", href: "#normas" },
                { label: "Dashboard", href: "#dashboard" },
                { label: "Entrar", href: "/login" },
              ]}
            />
            <FooterCol
              title="Compliance"
              links={[
                { label: "LGPD", href: "#" },
                { label: "Segurança de dados", href: "#" },
                { label: "Base normativa", href: "#normas" },
                { label: "Auditoria", href: "#" },
              ]}
            />
            <FooterCol
              title="Institucional"
              links={[
                { label: "Termos de uso", href: "#" },
                { label: "Política de privacidade", href: "#" },
                { label: "Contato", href: "mailto:contato@sanitaryai.com.br", icon: Mail },
              ]}
            />
          </div>
          <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
            <span>© {new Date().getFullYear()} SanitaryAI · Todos os direitos reservados</span>
            <span className="tracking-[0.2em]">REGULATORY ENGINE · v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Helpers ---------- */

function SectionHeader({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-mono text-primary tracking-[0.25em] mb-3">{label}</div>
      <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-muted-foreground mt-4 leading-relaxed">{description}</p>}
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string; icon?: any }[] }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-wider text-foreground mb-4">{title}</div>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
              {l.icon && <l.icon className="h-3.5 w-3.5" />}{l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, preview }: { icon: any; title: string; desc: string; preview: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass rounded-xl p-5 border border-border/60 hover:border-primary/40 transition-colors group"
    >
      <div className="h-36 rounded-md bg-background/40 border border-border/40 mb-5 overflow-hidden relative">
        {preview}
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 text-primary" />
        <div className="font-medium">{title}</div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ---------- Mockups ---------- */

function BlueprintMockup() {
  return (
    <div className="relative rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Window bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/40">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider">
          projeto_hospital_v3.pdf · página 1/4
        </div>
        <div className="text-[10px] font-mono text-primary">ANALISANDO</div>
      </div>

      <div className="grid grid-cols-12 h-[360px]">
        {/* Blueprint canvas */}
        <div className="col-span-8 relative bg-[#0a0f1a] overflow-hidden">
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(188 60% 50% / 0.08)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#grid)" />
            {/* walls */}
            <g stroke="hsl(188 80% 60% / 0.7)" strokeWidth="1.5" fill="none">
              <rect x="30" y="30" width="340" height="240" />
              <line x1="30" y1="130" x2="220" y2="130" />
              <line x1="220" y1="30" x2="220" y2="270" />
              <line x1="220" y1="180" x2="370" y2="180" />
              <line x1="130" y1="130" x2="130" y2="270" />
            </g>
            {/* doors */}
            <g stroke="hsl(188 70% 70% / 0.5)" strokeWidth="1">
              <path d="M 80 130 A 20 20 0 0 1 100 110" fill="none" />
              <path d="M 220 80 A 20 20 0 0 1 240 60" fill="none" />
            </g>
            {/* room labels */}
            <g fill="hsl(188 40% 70% / 0.6)" fontSize="7" fontFamily="monospace">
              <text x="115" y="80">RECEPÇÃO</text>
              <text x="290" y="100">SALA 01</text>
              <text x="65" y="200">CURATIVO</text>
              <text x="160" y="200">CME</text>
              <text x="280" y="225">WC PCD</text>
            </g>
            {/* dimensions */}
            <g stroke="hsl(188 50% 60% / 0.3)" strokeWidth="0.5" strokeDasharray="2 2">
              <line x1="30" y1="285" x2="370" y2="285" />
            </g>
            <text x="190" y="295" fill="hsl(188 40% 70% / 0.6)" fontSize="6" fontFamily="monospace">17.00 m</text>
          </svg>

          {/* Markings */}
          <Marking x="22%" y="42%" color="destructive" label="!" />
          <Marking x="58%" y="32%" color="warning" label="!" />
          <Marking x="75%" y="72%" color="destructive" label="!" />
          <Marking x="38%" y="68%" color="warning" label="!" />
          <Marking x="88%" y="48%" color="success" label="✓" />

          {/* Coord overlay */}
          <div className="absolute bottom-2 left-2 text-[9px] font-mono text-primary/70">
            X: 142.8  Y: 87.3  Z: 0.00
          </div>
          <div className="absolute top-2 right-2 text-[9px] font-mono text-primary/70">
            SCALE 1:100
          </div>
        </div>

        {/* Side panel */}
        <div className="col-span-4 border-l border-border/60 bg-background/60 p-3 flex flex-col gap-3 overflow-hidden">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1">SCORE</div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-semibold font-mono text-warning">64</span>
              <span className="text-xs text-muted-foreground mb-1">/100</span>
            </div>
            <div className="h-1 bg-border/40 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-warning rounded-full" style={{ width: "64%" }} />
            </div>
            <div className="text-[10px] font-mono text-warning mt-1.5">PARCIALMENTE CONFORME</div>
          </div>

          <div className="border-t border-border/40 pt-2">
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">INCONFORMIDADES</div>
            <div className="space-y-1.5">
              <PanelItem severity="critico" norm="RDC 50" text="Largura de porta < 1,10m" />
              <PanelItem severity="critico" norm="NBR 9050" text="Área lateral WC PCD" />
              <PanelItem severity="atencao" norm="RDC 15" text="Fluxo CME cruzado" />
              <PanelItem severity="atencao" norm="RDC 50" text="Ventilação recepção" />
            </div>
          </div>

          <div className="border-t border-border/40 pt-2 mt-auto">
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1">PROGRESSO</div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-primary">Página 1/4</span>
              <span className="text-primary animate-pulse">●</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Marking({ x, y, color, label }: { x: string; y: string; color: "destructive" | "warning" | "success"; label: string }) {
  const colorClass =
    color === "destructive" ? "bg-destructive/20 border-destructive text-destructive" :
    color === "warning" ? "bg-warning/20 border-warning text-warning" :
    "bg-success/20 border-success text-success";
  return (
    <div
      className={`absolute h-5 w-5 rounded-full border ${colorClass} grid place-items-center text-[10px] font-mono font-bold`}
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    >
      {label}
      <span className={`absolute inset-0 rounded-full border ${colorClass.split(" ")[1]} animate-ping opacity-40`} />
    </div>
  );
}

function PanelItem({ severity, norm, text }: { severity: "critico" | "atencao"; norm: string; text: string }) {
  const Icon = severity === "critico" ? XCircle : AlertTriangle;
  const tone = severity === "critico" ? "text-destructive" : "text-warning";
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${tone}`} />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] text-muted-foreground">{norm}</div>
        <div className="text-foreground/90 truncate">{text}</div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/40">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider">app.sanitaryai.com.br/dashboard</div>
        <div className="w-12" />
      </div>

      <div className="grid lg:grid-cols-12 gap-4 p-5 bg-background/30">
        {/* KPIs */}
        {[
          { label: "Projetos", value: "48", icon: FileCheck2, tone: "text-foreground" },
          { label: "Aprovados", value: "31", icon: CheckCircle2, tone: "text-success" },
          { label: "Pendentes", value: "9", icon: AlertTriangle, tone: "text-warning" },
          { label: "Score médio", value: "82%", icon: TrendingUp, tone: "text-primary" },
        ].map((k) => (
          <div key={k.label} className="lg:col-span-3 rounded-lg border border-border/50 bg-card/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{k.label}</span>
              <k.icon className={`h-3.5 w-3.5 ${k.tone}`} />
            </div>
            <div className={`text-2xl font-mono font-semibold ${k.tone}`}>{k.value}</div>
          </div>
        ))}

        {/* Chart */}
        <div className="lg:col-span-8 rounded-lg border border-border/50 bg-card/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">Score por projeto</div>
            <div className="text-[10px] font-mono text-muted-foreground">ÚLTIMOS 8</div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {[68, 82, 45, 91, 76, 88, 62, 94].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary/80" style={{ height: `${v}%` }} />
                <span className="text-[9px] font-mono text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div className="lg:col-span-4 rounded-lg border border-border/50 bg-card/60 p-5">
          <div className="text-sm font-medium mb-4">Distribuição</div>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--success))" strokeWidth="4" strokeDasharray="55 100" pathLength="100" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--warning))" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-55" pathLength="100" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--destructive))" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-80" pathLength="100" />
            </svg>
            <div className="space-y-1.5 text-xs">
              <Legend color="success" label="Aprovado" value="55%" />
              <Legend color="warning" label="Parcial" value="25%" />
              <Legend color="destructive" label="Reprovado" value="20%" />
            </div>
          </div>
        </div>

        {/* Recent */}
        <div className="lg:col-span-12 rounded-lg border border-border/50 bg-card/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">Análises recentes</div>
            <div className="text-[10px] font-mono text-primary">VER TODAS</div>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { name: "Hospital Santa Clara · Bloco B", score: 94, status: "Aprovado", cls: "bg-success/15 text-success" },
              { name: "UBS Setor Bueno", score: 76, status: "Parcial", cls: "bg-warning/15 text-warning" },
              { name: "Clínica Odontológica Vita", score: 42, status: "Reprovado", cls: "bg-destructive/15 text-destructive" },
              { name: "Centro Cirúrgico Goiânia", score: 88, status: "Aprovado", cls: "bg-success/15 text-success" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between py-2.5">
                <div className="text-sm">{p.name}</div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-muted-foreground">{p.score}%</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${p.cls}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full bg-${color}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono">{value}</span>
    </div>
  );
}

function MarkingPreview() {
  return (
    <div className="absolute inset-0 bg-[#0a0f1a]">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <defs>
          <pattern id="g2" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="hsl(188 60% 50% / 0.1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="200" height="120" fill="url(#g2)" />
        <g stroke="hsl(188 80% 60% / 0.6)" strokeWidth="1" fill="none">
          <rect x="20" y="20" width="160" height="80" />
          <line x1="100" y1="20" x2="100" y2="100" />
          <line x1="20" y1="60" x2="100" y2="60" />
        </g>
      </svg>
      <Marking x="30%" y="35%" color="destructive" label="!" />
      <Marking x="70%" y="65%" color="warning" label="!" />
      <Marking x="85%" y="30%" color="success" label="✓" />
    </div>
  );
}

function NormPreview() {
  return (
    <div className="absolute inset-0 p-3 flex flex-wrap gap-1.5 content-center justify-center">
      {["RDC 50", "RDC 15", "NBR 9050", "RDC 63", "SUVISA", "RDC 51"].map((n) => (
        <span key={n} className="text-[10px] font-mono px-2 py-1 rounded border border-primary/30 bg-primary/5 text-primary">
          {n}
        </span>
      ))}
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="absolute inset-0 p-3 flex gap-2">
      <div className="flex-1 space-y-1.5">
        <div className="h-2 w-3/4 bg-foreground/20 rounded" />
        <div className="h-1.5 w-full bg-muted/40 rounded" />
        <div className="h-1.5 w-5/6 bg-muted/40 rounded" />
        <div className="h-1.5 w-2/3 bg-muted/40 rounded" />
        <div className="h-px bg-border/60 my-2" />
        <div className="flex gap-1">
          <span className="h-3 w-10 bg-destructive/30 rounded-sm" />
          <span className="h-3 w-8 bg-warning/30 rounded-sm" />
        </div>
        <div className="h-1.5 w-4/5 bg-muted/40 rounded" />
        <div className="h-1.5 w-3/5 bg-muted/40 rounded" />
      </div>
      <div className="w-16 grid place-items-center">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="82 100" pathLength="100" />
        </svg>
        <div className="absolute text-xs font-mono font-semibold text-primary">82</div>
      </div>
    </div>
  );
}
