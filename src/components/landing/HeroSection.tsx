import { motion } from "framer-motion";
import heroMockup from "@/assets/hero-mockup.png";

const WHATSAPP_URL = "https://wa.me/5500000000000?text=Quero%20uma%20an%C3%A1lise%20do%20meu%20perfil";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-charcoal">
      <div className="container mx-auto px-6 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="inline-block mb-6 px-4 py-1.5 border border-gold/30 rounded-full">
              <span className="text-gold text-xs font-body tracking-[0.2em] uppercase">
                Sites estratégicos de alta conversão
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-primary-foreground leading-[1.1] mb-6 text-balance">
              Projetos digitais que elevam sua{" "}
              <span className="text-gold">autoridade</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/60 font-body font-light max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              Sites com estrutura de conversão para atrair clientes qualificados todos os dias.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-charcoal font-body font-semibold text-sm tracking-wide px-8 py-4 rounded-lg transition-all duration-300 shadow-gold hover:shadow-lg"
            >
              Aplicar para diagnóstico
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="flex justify-center lg:justify-end"
          >
            <img
              src={heroMockup}
              alt="Exemplo de site estratégico premium"
              width={1024}
              height={768}
              className="w-full max-w-lg lg:max-w-xl drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-charcoal/50" />
    </section>
  );
};

export default HeroSection;
