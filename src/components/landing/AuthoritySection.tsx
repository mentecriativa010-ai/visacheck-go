import { motion } from "framer-motion";

const stats = [
  { value: "97%", label: "dos clientes recomendam" },
  { value: "3x", label: "mais leads em 90 dias" },
  { value: "+200", label: "projetos entregues" },
];

const testimonials = [
  {
    quote: "Meu site deixou de ser um cartão de visita e passou a gerar consultas todos os dias.",
    author: "Arq. Renata Oliveira",
  },
  {
    quote: "Pela primeira vez, clientes chegam pelo Google e já decididos a contratar.",
    author: "Adv. Carlos Mendes",
  },
];

const AuthoritySection = () => {
  return (
    <section className="py-24 md:py-32 bg-cream-dark">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-xs font-body tracking-[0.2em] uppercase">Resultados</span>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mt-4">
            Números que falam por si
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12 md:gap-20 mb-20">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <span className="text-4xl md:text-5xl font-display font-bold text-gold">{s.value}</span>
              <p className="text-muted-foreground font-body text-sm mt-2">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-card border border-border rounded-xl p-8 shadow-card"
            >
              <p className="text-foreground font-body text-sm leading-relaxed italic mb-4">"{t.quote}"</p>
              <cite className="text-gold font-body text-xs not-italic tracking-wide">{t.author}</cite>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AuthoritySection;
