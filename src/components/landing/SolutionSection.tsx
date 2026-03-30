import { motion } from "framer-motion";

const SolutionSection = () => {
  return (
    <section className="py-20 md:py-28 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">
            Como eu <span className="text-gold">resolvo</span> isso
          </h2>
          <p className="text-primary-foreground/60 font-body text-lg leading-relaxed mb-4">
            Crio sites com estrutura estratégica pensada para transformar visitantes em clientes.
          </p>
          <p className="text-primary-foreground/50 font-body text-base leading-relaxed">
            Não é apenas design. É posicionamento, clareza e conversão.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
