import { motion } from "framer-motion";
import { X } from "lucide-react";

const filters = [
  "Quer um site barato",
  "Não valoriza posicionamento",
  "Não está pronto para crescer",
];

const FilterSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <p className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Aviso
          </p>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground mb-8">
            Esse serviço <span className="text-gold">não é</span> para quem:
          </h2>
          <ul className="space-y-4">
            {filters.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <X className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground font-body text-base">{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default FilterSection;
