import { Link } from "react-router-dom";

export function MarketingFooter() {
  return (
    <footer className="bg-[#0F2A4A] text-[#F7F4EC]/70">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-marketing-display text-lg text-[#F7F4EC] mb-2">
            VISAcheck <span className="text-[#22C79A]">GO</span>
          </p>
          <p className="text-sm leading-relaxed">
            Verificação de conformidade RDC/ANVISA e NBR 9050 para projetos de
            arquitetura de saúde.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-[#F7F4EC] mb-3">Navegação</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/como-funciona" className="hover:text-[#F7F4EC] transition-colors">Como funciona</Link></li>
            <li><Link to="/normas" className="hover:text-[#F7F4EC] transition-colors">Normas cobertas</Link></li>
            <li><Link to="/precos" className="hover:text-[#F7F4EC] transition-colors">Preços</Link></li>
            <li><Link to="/sobre" className="hover:text-[#F7F4EC] transition-colors">Sobre</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-[#F7F4EC] mb-3">Contato</p>
          <p className="text-sm">Elias Cardoso Neves</p>
          <p className="text-sm mt-1">Goiânia, GO</p>
        </div>
      </div>

      <div className="border-t border-[#F7F4EC]/10">
        <p className="max-w-6xl mx-auto px-6 py-5 text-xs text-[#F7F4EC]/50">
          VISAcheck GO é uma ferramenta de apoio à verificação de conformidade
          e não substitui a análise de um profissional habilitado nem
          representa aprovação oficial junto à vigilância sanitária.
        </p>
      </div>
    </footer>
  );
}
