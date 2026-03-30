import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Análise do posicionamento", desc: "Entendemos seu mercado, concorrência e diferenciais." },
  { num: "02", title: "Planejamento estratégico", desc: "Definimos estrutura, conteúdo e fluxo de conversão." },
  { num: "03", title: "Criação focada em conversão", desc: "Design premium alinhado à sua autoridade profissional." },
  { num: "04", title: "Entrega otimizada", desc: "Site pronto para gerar leads desde o primeiro dia." },
];

const ProcessSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-xs font-body tracking-[0.2em] uppercase">Como funciona</span>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mt-4">
            4 etapas até o resultado
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <span className="text-5xl font-display font-bold text-gold/20">{step.num}</span>
              <h3 className="font-display text-lg font-semibold text-foreground mt-2 mb-2">{step.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
