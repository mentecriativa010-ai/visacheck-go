import { motion } from "framer-motion";

const pains = [
  "Se você depende de indicação para fechar clientes, tem algo errado.",
  "Se seu perfil não transmite autoridade, você está perdendo oportunidades.",
  "Se clientes bons não chegam até você, o problema não é só o Instagram.",
];

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {pains.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-lg md:text-xl font-body text-foreground leading-relaxed border-l-2 border-gold/40 pl-6"
            >
              {text}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
