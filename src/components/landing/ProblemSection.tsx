import { motion } from "framer-motion";

const problems = [
  {
    icon: "📱",
    title: "Seu Instagram não gera clientes",
    description: "Você posta, mas não converte. Curtidas não pagam contas.",
  },
  {
    icon: "🤝",
    title: "Você depende apenas de indicação",
    description: "Sem previsibilidade. Sem controle sobre a entrada de novos clientes.",
  },
  {
    icon: "👤",
    title: "Seu perfil não transmite autoridade",
    description: "Quem pesquisa seu nome não encontra uma presença digital à altura do seu trabalho.",
  },
];

const ProblemSection = () => {
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
          <span className="text-gold text-xs font-body tracking-[0.2em] uppercase">O problema</span>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mt-4 text-balance">
            Você reconhece algum desses cenários?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {problems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-card border border-border rounded-xl p-8 shadow-card hover:shadow-premium transition-shadow duration-300"
            >
              <span className="text-3xl mb-4 block">{item.icon}</span>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
