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
  Bell,
  Ruler,
  Radar,
  GitBranch,
  Layers,
  Database,
  Workflow,
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
          <a href="#engine" className="hover:text-foreground transition-colors">Motor regulatório</a>
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
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              ENTERPRISE · REGULATORY AI
            </div>
            <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
              Conformidade sanitária <br />
              <span className="text-primary">orientada por IA</span> para projetos de saúde.
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">
              Motor regulatório que cruza plantas arquitetônicas com RDC 50, RDC 15, NBR 9050 e normas
              municipais. Detecção visual, score normativo e relatório técnico em minutos.
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

      {/* MOTOR REGULATÓRIO INTELIGENTE */}
      <section id="engine" className="px-6 lg:px-12 py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <SectionHeader
              label="REGULATORY ENGINE"
              title="Motor regulatório inteligente"
              description="Cada elemento da planta é confrontado com a base normativa em tempo real. Você vê exatamente qual norma valida, falha ou exige revisão."
            />
            <div className="mt-8 space-y-3 text-sm">
              <EngineFeature icon={Database} title="Base normativa unificada" desc="RDC, NBR e códigos municipais em um único índice consultável." />
              <EngineFeature icon={Workflow} title="Análise por fluxo" desc="Cruza fluxos sanitários (sujo/limpo, paciente/staff) com layout proposto." />
              <EngineFeature icon={Radar} title="Score normativo dinâmico" desc="Cada inconformidade impacta o score com peso técnico calibrado." />
            </div>
          </div>
          <div className="lg:col-span-7">
            <RegulatoryEnginePanel />
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

      {/* FEATURES — mini previews operacionais */}
      <section className="px-6 lg:px-12 py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="CAPABILITIES" title="Por que SanitaryAI" description="Mini previews reais de como cada módulo opera dentro da plataforma." />
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            <FeatureCard
              icon={ScanSearch}
              title="Detecção visual"
              desc="Marcações sobrepostas à planta destacam inconformidades por severidade."
              status="ATIVO"
              preview={<MarkingPreview />}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Base regulatória"
              desc="RDC ANVISA, NBR e códigos municipais atualizados continuamente."
              status="SINCRONIZADO"
              preview={<NormOperationalPreview />}
            />
            <FeatureCard
              icon={FileBarChart}
              title="Relatório técnico"
              desc="Score, normas citadas, sugestões corretivas e exportação em PDF."
              status="PRONTO"
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
                { label: "Motor regulatório", href: "#engine" },
                { label: "Normas suportadas", href: "#normas" },
                { label: "Dashboard", href: "#dashboard" },
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

function EngineFeature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/40">
      <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, preview, status }: { icon: any; title: string; desc: string; preview: React.ReactNode; status?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass rounded-xl p-5 border border-border/60 hover:border-primary/40 transition-colors group"
    >
      <div className="h-40 rounded-md bg-background/40 border border-border/40 mb-5 overflow-hidden relative">
        {preview}
        {status && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/70 backdrop-blur-md border border-border/60 text-[9px] font-mono text-primary">
            <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            {status}
          </div>
        )}
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
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          ANALISANDO
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/40 bg-background/30 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> LAYERS · 7</span>
        <span className="flex items-center gap-1"><Ruler className="h-3 w-3" /> 1:100</span>
        <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> FLOW</span>
        <span className="ml-auto text-primary">PDF · vector</span>
      </div>

      <div className="grid grid-cols-12 h-[380px]">
        {/* Blueprint canvas */}
        <div className="col-span-8 relative bg-[#070b13] overflow-hidden">
          <BlueprintSVG />

          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-24 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent, hsl(188 95% 55% / 0.10) 50%, transparent)",
              boxShadow: "0 0 24px hsl(188 95% 55% / 0.15)",
            }}
            initial={{ y: "-20%" }}
            animate={{ y: "120%" }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-x-0 h-px bg-primary/60 pointer-events-none"
            initial={{ y: 0 }}
            animate={{ y: "100%" }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ boxShadow: "0 0 8px hsl(var(--primary))" }}
          />

          {/* Markings */}
          <Marking x="22%" y="42%" color="destructive" label="!" delay={0.6} />
          <Marking x="58%" y="32%" color="warning" label="!" delay={1.2} />
          <Marking x="75%" y="72%" color="destructive" label="!" delay={1.8} />
          <Marking x="38%" y="68%" color="warning" label="!" delay={2.4} />
          <Marking x="88%" y="48%" color="success" label="✓" delay={3.0} />

          {/* HUD */}
          <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[9px] font-mono text-primary/70">
            <span>X: 142.8</span><span>Y: 87.3</span>
          </div>
          <div className="absolute top-2 right-2 text-[9px] font-mono text-primary/70 bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
            SCALE 1:100
          </div>

          {/* IA badge */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute top-2 left-2 flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded-md bg-background/70 backdrop-blur-md border border-primary/30 text-primary"
          >
            <Cpu className="h-3 w-3" />
            IA · vision-v1.4
          </motion.div>
        </div>

        {/* Side panel */}
        <div className="col-span-4 border-l border-border/60 bg-background/60 p-3 flex flex-col gap-3 overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-mono text-muted-foreground tracking-wider">SCORE NORMATIVO</div>
              <span className="text-[9px] font-mono text-primary animate-pulse">●</span>
            </div>
            <div className="flex items-end gap-1">
              <CountUp to={64} className="text-3xl font-semibold font-mono text-warning" />
              <span className="text-xs text-muted-foreground mb-1">/100</span>
            </div>
            <div className="h-1 bg-border/40 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-warning rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "64%" }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </div>
            <div className="text-[10px] font-mono text-warning mt-1.5">PARCIALMENTE CONFORME</div>
          </div>

          <div className="border-t border-border/40 pt-2">
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">INCONFORMIDADES</div>
            <div className="space-y-1.5">
              <PanelItem severity="critico" norm="RDC 50" text="Largura porta < 1,10m" delay={0.8} />
              <PanelItem severity="critico" norm="NBR 9050" text="Área lateral WC PCD" delay={1.4} />
              <PanelItem severity="atencao" norm="RDC 15" text="Fluxo CME cruzado" delay={2.0} />
              <PanelItem severity="atencao" norm="RDC 50" text="Ventilação recepção" delay={2.6} />
            </div>
          </div>

          <div className="border-t border-border/40 pt-2 mt-auto">
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1">PROGRESSO IA</div>
            <div className="h-1 bg-border/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono mt-1">
              <span className="text-muted-foreground">Página 1/4</span>
              <span className="text-primary">processando...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40 bg-background/50 text-[9px] font-mono text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> ENGINE ONLINE</span>
          <span>NORMAS · 142 ativas</span>
        </div>
        <div className="flex items-center gap-1 text-primary">
          <Bell className="h-3 w-3" /> 4 alertas técnicos
        </div>
      </div>
    </div>
  );
}

/* CAD-style blueprint with walls, doors, dimensions, sanitary flow */
function BlueprintSVG() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <pattern id="grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(188 60% 50% / 0.05)" strokeWidth="0.3" />
        </pattern>
        <pattern id="grid-major" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(188 60% 50% / 0.12)" strokeWidth="0.5" />
        </pattern>
        <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="hsl(188 70% 60% / 0.25)" strokeWidth="0.6" />
        </pattern>
      </defs>

      <rect width="400" height="300" fill="url(#grid-fine)" />
      <rect width="400" height="300" fill="url(#grid-major)" />

      {/* Outer wall (thick) */}
      <g>
        <rect x="30" y="30" width="340" height="240" fill="none" stroke="hsl(188 85% 65% / 0.85)" strokeWidth="2.5" />
        <rect x="30" y="30" width="340" height="240" fill="url(#hatch)" opacity="0.15" />
      </g>

      {/* Inner walls */}
      <g stroke="hsl(188 80% 65% / 0.75)" strokeWidth="1.5" fill="none">
        {/* horizontal divider */}
        <line x1="30" y1="130" x2="100" y2="130" />
        <line x1="160" y1="130" x2="220" y2="130" />
        {/* vertical main */}
        <line x1="220" y1="30" x2="220" y2="100" />
        <line x1="220" y1="160" x2="220" y2="270" />
        {/* right inner */}
        <line x1="220" y1="180" x2="310" y2="180" />
        <line x1="340" y1="180" x2="370" y2="180" />
        {/* curativo / cme split */}
        <line x1="130" y1="130" x2="130" y2="210" />
        <line x1="130" y1="240" x2="130" y2="270" />
      </g>

      {/* Door swings */}
      <g stroke="hsl(188 70% 70% / 0.7)" strokeWidth="1" fill="none">
        <path d="M 100 130 A 20 20 0 0 1 120 110" />
        <line x1="100" y1="130" x2="120" y2="110" strokeDasharray="1 1" />
        <path d="M 220 100 A 20 20 0 0 1 240 80" />
        <line x1="220" y1="100" x2="240" y2="80" strokeDasharray="1 1" />
        <path d="M 130 210 A 20 20 0 0 1 150 230" />
        <line x1="130" y1="210" x2="150" y2="230" strokeDasharray="1 1" />
        <path d="M 310 180 A 18 18 0 0 1 328 198" />
        <line x1="310" y1="180" x2="328" y2="198" strokeDasharray="1 1" />
      </g>

      {/* Sanitary fixtures (symbols) */}
      <g stroke="hsl(188 75% 70% / 0.7)" strokeWidth="0.8" fill="hsl(188 50% 30% / 0.25)">
        {/* lavatório curativo */}
        <rect x="40" y="200" width="14" height="8" rx="1" />
        {/* WC PCD */}
        <ellipse cx="290" cy="225" rx="6" ry="8" />
        <rect x="282" y="240" width="16" height="3" />
        {/* CME tanque */}
        <rect x="175" y="245" width="22" height="10" rx="1" />
      </g>

      {/* Sanitary flow arrows (clean → dirty) */}
      <g fill="none">
        <path d="M 80 60 L 160 60 L 160 100" stroke="hsl(152 70% 55% / 0.7)" strokeWidth="1" strokeDasharray="3 2" />
        <polygon points="160,100 157,94 163,94" fill="hsl(152 70% 55% / 0.8)" />
        <path d="M 175 250 L 250 250 L 250 200" stroke="hsl(0 75% 65% / 0.7)" strokeWidth="1" strokeDasharray="3 2" />
        <polygon points="250,200 247,206 253,206" fill="hsl(0 75% 65% / 0.8)" />
      </g>

      {/* Room labels */}
      <g fill="hsl(188 40% 78% / 0.75)" fontSize="6" fontFamily="monospace" letterSpacing="0.5">
        <text x="100" y="78">RECEPÇÃO</text>
        <text x="280" y="68">SALA 01</text>
        <text x="280" y="140">SALA 02</text>
        <text x="50" y="180">CURATIVO</text>
        <text x="160" y="195">C.M.E.</text>
        <text x="270" y="210">WC PCD</text>
        <text x="65" y="260">DML</text>
      </g>

      {/* Dimensions (ext.) */}
      <g stroke="hsl(188 50% 65% / 0.45)" strokeWidth="0.5">
        <line x1="30" y1="285" x2="370" y2="285" />
        <line x1="30" y1="281" x2="30" y2="289" />
        <line x1="370" y1="281" x2="370" y2="289" />
        <line x1="220" y1="281" x2="220" y2="289" />
        <line x1="385" y1="30" x2="385" y2="270" />
        <line x1="381" y1="30" x2="389" y2="30" />
        <line x1="381" y1="270" x2="389" y2="270" />
      </g>
      <g fill="hsl(188 40% 75% / 0.8)" fontSize="6" fontFamily="monospace">
        <text x="115" y="293">9.50</text>
        <text x="285" y="293">7.50</text>
        <text x="390" y="155" transform="rotate(90 390 155)">12.00</text>
      </g>

      {/* North arrow */}
      <g transform="translate(355, 50)">
        <circle r="8" fill="none" stroke="hsl(188 60% 70% / 0.5)" strokeWidth="0.5" />
        <polygon points="0,-6 3,3 0,1 -3,3" fill="hsl(188 80% 70% / 0.7)" />
        <text x="-2" y="-9" fill="hsl(188 50% 75% / 0.7)" fontSize="5" fontFamily="monospace">N</text>
      </g>
    </svg>
  );
}

function CountUp({ to, className }: { to: number; className?: string }) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {to}
    </motion.span>
  );
}

function Marking({ x, y, color, label, delay = 0 }: { x: string; y: string; color: "destructive" | "warning" | "success"; label: string; delay?: number }) {
  const colorClass =
    color === "destructive" ? "bg-destructive/20 border-destructive text-destructive" :
    color === "warning" ? "bg-warning/20 border-warning text-warning" :
    "bg-success/20 border-success text-success";
  const ringClass =
    color === "destructive" ? "border-destructive" :
    color === "warning" ? "border-warning" : "border-success";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 260 }}
      className={`absolute h-5 w-5 rounded-full border ${colorClass} grid place-items-center text-[10px] font-mono font-bold`}
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    >
      {label}
      <span className={`absolute inset-0 rounded-full border ${ringClass} animate-ping opacity-40`} />
    </motion.div>
  );
}

function PanelItem({ severity, norm, text, delay = 0 }: { severity: "critico" | "atencao"; norm: string; text: string; delay?: number }) {
  const Icon = severity === "critico" ? XCircle : AlertTriangle;
  const tone = severity === "critico" ? "text-destructive" : "text-warning";
  return (
    <motion.div
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-start gap-2 text-[11px]"
    >
      <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${tone}`} />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] text-muted-foreground">{norm}</div>
        <div className="text-foreground/90 truncate">{text}</div>
      </div>
    </motion.div>
  );
}

/* ---------- Regulatory Engine Panel ---------- */

function RegulatoryEnginePanel() {
  const checks = [
    { norm: "RDC 50/2002", item: "Dimensionamento de salas", status: "valid", value: "100%" },
    { norm: "RDC 15/2012", item: "Fluxo CME · sujo × limpo", status: "fail", value: "incompatível" },
    { norm: "NBR 9050", item: "Acessibilidade · WC PCD", status: "partial", value: "parcial" },
    { norm: "RDC 63/2011", item: "Rotas de evacuação", status: "valid", value: "ok" },
    { norm: "RDC 51/2011", item: "Pontos elétricos · inalação", status: "partial", value: "revisar" },
    { norm: "COE Goiânia", item: "Pé-direito recepção", status: "valid", value: "2,80m" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/40">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-mono tracking-wider">REGULATORY ENGINE</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-border/40">
        <div className="bg-card/60 p-4">
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">SCORE NORMATIVO</div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-mono font-semibold text-warning">68</span>
            <span className="text-xs text-muted-foreground mb-1">/100</span>
          </div>
          <div className="h-1 bg-border/40 rounded-full mt-2 overflow-hidden">
            <motion.div className="h-full bg-warning" initial={{ width: 0 }} whileInView={{ width: "68%" }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
          </div>
        </div>
        <div className="bg-card/60 p-4">
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">NORMAS VERIFICADAS</div>
          <div className="text-3xl font-mono font-semibold">14<span className="text-xs text-muted-foreground ml-1">/14</span></div>
          <div className="text-[10px] font-mono text-success mt-1">SINCRONIZADO</div>
        </div>
        <div className="bg-card/60 p-4">
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">PROCESSAMENTO</div>
          <div className="text-3xl font-mono font-semibold text-primary">2.4s</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">por prancha</div>
        </div>
      </div>

      <div className="p-4 bg-background/30">
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">VERIFICAÇÃO EM TEMPO REAL</div>
        <div className="space-y-1.5">
          {checks.map((c, i) => (
            <motion.div
              key={c.norm}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-2.5 rounded-md border border-border/40 bg-card/40 hover:bg-card/70 transition-colors"
            >
              <StatusDot status={c.status as any} />
              <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">{c.norm}</span>
              <span className="text-sm flex-1 truncate">{c.item}</span>
              <StatusBadge status={c.status as any} label={c.value} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-background/50 text-[9px] font-mono text-muted-foreground">
        <span>engine.regulatory@v1.4.2</span>
        <span className="text-primary">última sincronização há 12 min</span>
      </div>
    </motion.div>
  );
}

function StatusDot({ status }: { status: "valid" | "fail" | "partial" }) {
  const cls = status === "valid" ? "bg-success" : status === "fail" ? "bg-destructive" : "bg-warning";
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`absolute inline-flex h-full w-full rounded-full ${cls} opacity-50 animate-ping`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${cls}`} />
    </span>
  );
}

function StatusBadge({ status, label }: { status: "valid" | "fail" | "partial"; label: string }) {
  const cls =
    status === "valid" ? "bg-success/10 text-success border-success/30" :
    status === "fail" ? "bg-destructive/10 text-destructive border-destructive/30" :
    "bg-warning/10 text-warning border-warning/30";
  const icon =
    status === "valid" ? <CheckCircle2 className="h-3 w-3" /> :
    status === "fail" ? <XCircle className="h-3 w-3" /> :
    <AlertTriangle className="h-3 w-3" />;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono ${cls}`}>
      {icon}{label}
    </span>
  );
}

/* ---------- Dashboard Mockup ---------- */

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
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary">
          <Bell className="h-3 w-3" /> 3
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 p-5 bg-background/30">
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

        <div className="lg:col-span-8 rounded-lg border border-border/50 bg-card/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">Score por projeto</div>
            <div className="text-[10px] font-mono text-muted-foreground">ÚLTIMOS 8</div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {[68, 82, 45, 91, 76, 88, 62, 94].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${v}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.6 }}
                  className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary/80"
                />
                <span className="text-[9px] font-mono text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

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

function Legend({ color, label, value }: { color: "success" | "warning" | "destructive"; label: string; value: string }) {
  const cls = color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono">{value}</span>
    </div>
  );
}

/* ---------- Feature mini previews ---------- */

function MarkingPreview() {
  return (
    <div className="absolute inset-0 bg-[#070b13] overflow-hidden">
      <svg viewBox="0 0 200 140" className="w-full h-full">
        <defs>
          <pattern id="g2" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(188 60% 50% / 0.08)" strokeWidth="0.4" />
          </pattern>
          <pattern id="h2" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="3" stroke="hsl(188 70% 60% / 0.2)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="200" height="140" fill="url(#g2)" />
        <rect x="20" y="20" width="160" height="100" fill="url(#h2)" opacity="0.5" />
        <g stroke="hsl(188 80% 65% / 0.75)" strokeWidth="1.2" fill="none">
          <rect x="20" y="20" width="160" height="100" />
          <line x1="100" y1="20" x2="100" y2="120" />
          <line x1="20" y1="70" x2="100" y2="70" />
        </g>
        <g stroke="hsl(188 70% 70% / 0.5)" strokeWidth="0.8" fill="none">
          <path d="M 70 70 A 12 12 0 0 1 82 58" />
        </g>
      </svg>
      <motion.div
        className="absolute inset-x-0 h-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(188 95% 55% / 0.12), transparent)" }}
        initial={{ y: -20 }}
        animate={{ y: 140 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <Marking x="30%" y="35%" color="destructive" label="!" />
      <Marking x="70%" y="65%" color="warning" label="!" />
      <Marking x="85%" y="30%" color="success" label="✓" />
    </div>
  );
}

function NormOperationalPreview() {
  const items = [
    { n: "RDC 50", s: "valid" as const },
    { n: "RDC 15", s: "fail" as const },
    { n: "NBR 9050", s: "partial" as const },
    { n: "RDC 63", s: "valid" as const },
    { n: "SUVISA", s: "valid" as const },
    { n: "RDC 51", s: "partial" as const },
  ];
  return (
    <div className="absolute inset-0 p-3 flex flex-col gap-1.5 justify-center">
      {items.map((i, idx) => (
        <motion.div
          key={i.n}
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.06 }}
          className="flex items-center gap-2 px-2 py-1 rounded border border-border/50 bg-card/60"
        >
          <StatusDot status={i.s} />
          <span className="text-[10px] font-mono">{i.n}</span>
          <span className="ml-auto text-[9px] font-mono text-muted-foreground">
            {i.s === "valid" ? "OK" : i.s === "fail" ? "FAIL" : "REVIEW"}
          </span>
        </motion.div>
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
          <span className="h-3 w-6 bg-success/30 rounded-sm" />
        </div>
        <div className="h-1.5 w-4/5 bg-muted/40 rounded" />
        <div className="h-1.5 w-3/5 bg-muted/40 rounded" />
      </div>
      <div className="w-16 grid place-items-center relative">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <motion.circle
            cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" pathLength="100"
            initial={{ strokeDasharray: "0 100" }}
            whileInView={{ strokeDasharray: "82 100" }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute text-xs font-mono font-semibold text-primary">82</div>
      </div>
    </div>
  );
}
