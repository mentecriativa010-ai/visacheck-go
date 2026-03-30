import { motion } from "framer-motion";

const pains = [
  "Você depende de indicação para fechar clientes?",
  "Seu perfil não transmite autoridade?",
  "Clientes bons não chegam até você?",
];

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-28 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {pains.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="text-lg md:text-xl font-body text-primary-foreground/80 leading-relaxed border-l-2 border-gold/50 pl-6"
            >
              {text}
            </motion.p>
          ))}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xl md:text-2xl font-display font-semibold text-gold pt-4"
          >
            Então você não tem um sistema que converte.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
