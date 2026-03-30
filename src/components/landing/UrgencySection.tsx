import { motion } from "framer-motion";

const UrgencySection = () => {
  return (
    <section className="py-16 md:py-20 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto text-center text-lg md:text-xl font-body text-primary-foreground/70 leading-relaxed"
        >
          Se você não resolver isso agora, vai continuar dependendo de indicação e{" "}
          <span className="text-gold font-semibold">perdendo oportunidades todos os dias.</span>
        </motion.p>
      </div>
    </section>
  );
};

export default UrgencySection;
