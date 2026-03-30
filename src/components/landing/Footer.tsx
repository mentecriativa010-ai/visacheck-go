const Footer = () => {
  return (
    <footer className="py-8 bg-charcoal border-t border-charcoal-light">
      <div className="container mx-auto px-6 text-center">
        <p className="text-primary-foreground/30 font-body text-xs tracking-wide">
          © {new Date().getFullYear()} — Projetos digitais estratégicos. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
