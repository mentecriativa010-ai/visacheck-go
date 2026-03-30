import { motion } from "framer-motion";

const benefits = [
  "Você deixa de depender só do Instagram",
  "Passa a ter um ativo que trabalha por você",
  "E começa a atrair clientes mais qualificados",
];

const SolutionSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-10 text-center">
            O que muda com um site <span className="text-gold">estratégico</span>
          </h2>
          <ul className="space-y-4">
            {benefits.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-4 text-lg font-body text-foreground"
              >
                <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
