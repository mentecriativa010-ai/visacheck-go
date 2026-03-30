import { motion } from "framer-motion";
import { X } from "lucide-react";

const filters = [
  "Quer um site barato",
  "Não quer crescer",
  "Busca só estética",
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
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground mb-8">
            Esse serviço <span className="text-gold">não é</span> para quem:
          </h2>
          <ul className="space-y-4 mb-8">
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
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-lg font-display font-semibold text-gold"
          >
            É para quem quer atrair clientes de maior valor.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default FilterSection;
