import { Link } from "react-router-dom";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Como funciona", href: "/como-funciona" },
  { label: "Normas cobertas", href: "/normas" },
  { label: "Preços", href: "/precos" },
  { label: "Sobre", href: "/sobre" },
];

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#F7F4EC]/90 backdrop-blur border-b border-[#0F2A4A]/10">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-marketing-display text-xl font-semibold text-[#0F2A4A]">
          VISAcheck <span className="text-[#22C79A]">GO</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-[#0F2A4A]/80 hover:text-[#0F2A4A] transition-colors font-body"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Link
            to="/login"
            className="inline-flex items-center rounded-full bg-[#0F2A4A] text-[#F7F4EC] px-5 py-2.5 text-sm font-medium hover:bg-[#153A63] transition-colors"
          >
            Testar grátis
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-[#0F2A4A]"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden px-6 pb-6 flex flex-col gap-4 border-t border-[#0F2A4A]/10 pt-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-[#0F2A4A] font-body"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center rounded-full bg-[#0F2A4A] text-[#F7F4EC] px-5 py-2.5 text-sm font-medium"
          >
            Testar grátis
          </Link>
        </div>
      )}
    </header>
  );
}
