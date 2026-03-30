import { motion } from "framer-motion";

const BeliefBreakSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center space-y-5"
        >
          <p className="text-lg md:text-xl font-body text-foreground leading-relaxed">
            A maioria dos profissionais acha que precisa <span className="font-semibold">postar mais.</span>
          </p>
          <p className="text-lg md:text-xl font-body text-muted-foreground leading-relaxed">
            Mas o problema não é alcance.
          </p>
          <p className="text-2xl md:text-3xl font-display font-semibold text-gold">
            É conversão.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default BeliefBreakSection;
