import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Análise do perfil",
    desc: "Identifico onde você está perdendo clientes e oportunidades.",
  },
  {
    number: "02",
    title: "Estrutura estratégica",
    desc: "Crio uma página pensada para converter visitantes em contatos.",
  },
  {
    number: "03",
    title: "Resultado",
    desc: "Você começa a receber contatos qualificados todos os dias.",
  },
];

const ProcessSection = () => {
  return (
    <section className="py-20 md:py-28 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-primary-foreground mb-4 text-center">
            Como isso funciona <span className="text-gold">na prática</span>
          </h2>
          <p className="text-primary-foreground/50 font-body text-base text-center mb-12">
            Mesmo com pouco tráfego, a estrutura certa já aumenta a conversão.
          </p>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="flex gap-6 items-start"
              >
                <span className="text-3xl font-display font-bold text-gold/30 shrink-0">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-lg font-display font-semibold text-primary-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-primary-foreground/60 font-body text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSection;
