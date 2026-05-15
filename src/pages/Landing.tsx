import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Activity, ScanLine, FileBarChart, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary/20 grid place-items-center glow-ring"><Activity className="h-4 w-4 text-primary" /></div>
          <div className="leading-tight">
            <div className="font-semibold">SanitaryAI</div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider">REGULATORY ENGINE</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link to="/signup"><Button size="sm">Criar conta</Button></Link>
        </div>
      </nav>

      <section className="px-6 lg:px-12 pt-20 pb-32 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> MVP · análise sanitária automatizada
          </div>
          <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight max-w-3xl">
            Análise sanitária de projetos arquitetônicos com <span className="text-primary">IA regulatória</span>.
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl">
            Plataforma para arquitetos e engenheiros validarem conformidade com RDC 50, RDC 15, NBR 9050 e normas municipais — em minutos, com relatório técnico pronto.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/signup"><Button size="lg">Começar agora</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Já tenho conta</Button></Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
          {[
            { icon: ScanLine, title: "Análise automatizada", desc: "Upload do PDF e detecção de inconformidades sanitárias por norma." },
            { icon: ShieldCheck, title: "Base regulatória", desc: "RDC 50/63/15/51, NBR 9050, Código de Obras Goiânia, SUVISA-GO." },
            { icon: FileBarChart, title: "Relatório técnico", desc: "Score de conformidade, sugestões e exportação em PDF." },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              className="glass rounded-lg p-6">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <div className="font-medium mb-1">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-6 px-6 text-center text-xs font-mono text-muted-foreground">
        © {new Date().getFullYear()} SanitaryAI · Plataforma para arquitetos e engenheiros
      </footer>
    </div>
  );
}
