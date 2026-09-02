import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const normas = [
  {
    codigo: "RDC-50/2002",
    tema: "Infraestrutura física de estabelecimentos de saúde",
    descricao:
      "Define os requisitos físico-funcionais mínimos de cada tipo de ambiente — dimensões, instalações, fluxos — para construção, ampliação ou reforma de estabelecimentos de saúde.",
  },
  {
    codigo: "NBR 9050:2020",
    tema: "Acessibilidade a edificações e espaços",
    descricao:
      "Estabelece os critérios técnicos de acessibilidade para pessoas com deficiência ou mobilidade reduzida em edificações, mobiliário e espaços urbanos.",
  },
  {
    codigo: "RDC-1002/2025",
    tema: "Boas práticas em serviços odontológicos",
    descricao:
      "Estabelece os requisitos sanitários específicos para o funcionamento de consultórios e clínicas odontológicas.",
  },
  {
    codigo: "RDC-07/2010",
    tema: "Unidades de Terapia Intensiva",
    descricao:
      "Dispõe sobre os requisitos mínimos, incluindo a estrutura física, para o funcionamento de Unidades de Terapia Intensiva.",
  },
  {
    codigo: "RDC-15/2012",
    tema: "Processamento de produtos para saúde (CME)",
    descricao:
      "Trata dos requisitos para o processamento de produtos médicos em serviços de saúde, incluindo a estrutura física de Centrais de Material e Esterilização.",
  },
  {
    codigo: "RDC-330/2019",
    tema: "Serviços de radiologia diagnóstica",
    descricao:
      "Dispõe sobre os requisitos técnicos e sanitários para o funcionamento de serviços que realizam procedimentos radiológicos.",
  },
];

export default function NormasCobertas() {
  return (
    <div className="min-h-screen bg-[#F7F4EC] font-body">
      <SEO
        title="Normas cobertas — VISAcheck GO"
        description="Veja as 6 normas da ANVISA e ABNT verificadas pelo VISAcheck GO: RDC-50, NBR 9050, RDC-1002 e outras."
      />
      <MarketingNavbar />

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="font-mono-custom text-sm text-[#22C79A] mb-4">NORMAS COBERTAS</p>
        <h1 className="font-marketing-display text-4xl md:text-5xl leading-[1.1] text-[#0F2A4A] mb-6">
          6 normas, cada regra conferida contra o texto oficial
        </h1>
        <p className="text-lg text-[#0F2A4A]/70 leading-relaxed">
          Sem depender de resumos de terceiros ou suposições. Quando uma
          informação não pôde ser confirmada com segurança, ela fica marcada
          como pendente em vez de arriscar um valor errado.
        </p>
      </section>

      {/* Grid de normas */}
      <section className="bg-[#0F2A4A]/[0.03] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {normas.map((norma) => (
              <div
                key={norma.codigo}
                className="bg-[#F7F4EC] border border-[#0F2A4A]/10 rounded-xl p-6"
              >
                <p className="font-mono-custom text-sm text-[#22C79A] mb-2">
                  {norma.codigo}
                </p>
                <h2 className="font-medium text-[#0F2A4A] text-lg mb-2">
                  {norma.tema}
                </h2>
                <p className="text-sm text-[#0F2A4A]/70 leading-relaxed">
                  {norma.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#22C79A] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-marketing-display text-3xl text-[#04342C] mb-4">
            Veja isso aplicado no seu projeto
          </h2>
          <p className="text-[#04342C]/80 mb-8">
            Acesso gratuito para os primeiros arquitetos e engenheiros, em
            troca de feedback direto sobre o produto.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full bg-[#0F2A4A] text-[#F7F4EC] px-8 py-3.5 font-medium hover:bg-[#153A63] transition-colors"
          >
            Testar grátis
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
