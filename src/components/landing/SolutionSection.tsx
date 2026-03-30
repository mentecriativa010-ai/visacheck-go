import { motion } from "framer-motion";

const differentials = [
  { label: "Estrutura estratégica", desc: "Cada página pensada para guiar o visitante até a ação." },
  { label: "Posicionamento digital", desc: "Seu site comunica exatamente o valor que você entrega." },
  { label: "Conversão de visitantes", desc: "Visitantes viram leads qualificados de forma previsível." },
];

const SolutionSection = () => {
  return (
    <section className="py-24 md:py-32 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-gold text-xs font-body tracking-[0.2em] uppercase">A solução</span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mt-4 text-balance">
              Não é apenas um site. <br />
              <span className="text-gold">É uma máquina de posicionamento.</span>
            </h2>
            <p className="text-primary-foreground/60 font-body mt-6 text-lg leading-relaxed max-w-xl mx-auto">
              Criamos projetos digitais que funcionam como o braço comercial do seu negócio — atraindo, qualificando e convertendo.
            </p>
          </motion.div>

          <div className="space-y-6">
            {differentials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex items-start gap-4 border-l-2 border-gold/40 pl-6 py-2"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold">{item.label}</h3>
                  <p className="text-primary-foreground/50 font-body text-sm mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
