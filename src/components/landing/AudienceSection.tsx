import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const forWhom = [
  "Profissionais que querem atrair clientes qualificados",
  "Quem quer aumentar a percepção de valor",
  "Quem quer parar de depender só de Instagram",
];

const notForWhom = [
  'Quem busca apenas "um site barato"',
  "Quem não valoriza posicionamento",
  "Quem não quer crescer",
];

const AudienceSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* For */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-gold text-xs font-body tracking-[0.2em] uppercase">Para quem é</span>
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground mt-3 mb-8">
              Este projeto é para você se…
            </h2>
            <ul className="space-y-4">
              {forWhom.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                  <span className="text-foreground font-body text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Not for */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span className="text-muted-foreground text-xs font-body tracking-[0.2em] uppercase">Para quem não é</span>
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground mt-3 mb-8">
              Não é para você se…
            </h2>
            <ul className="space-y-4">
              {notForWhom.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground font-body text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
