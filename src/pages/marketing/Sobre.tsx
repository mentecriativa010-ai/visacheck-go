import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function Sobre() {
  return (
    <div className="min-h-screen bg-[#F7F4EC] font-body">
      <SEO
        title="Sobre — VISAcheck GO"
        description="Conheça a história por trás do VISAcheck GO."
      />
      <MarketingNavbar />

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#0F2A4A] flex items-center justify-center font-marketing-display text-xl text-[#F7F4EC] mb-6">
          EN
        </div>
        <p className="font-mono-custom text-sm text-[#22C79A] mb-4">SOBRE</p>
        <h1 className="font-marketing-display text-4xl md:text-5xl leading-[1.1] text-[#0F2A4A] mb-6">
          Um projeto que nasceu de um problema visto de perto
        </h1>
      </section>

      {/* Por que existe */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-marketing-display text-2xl text-[#0F2A4A] mb-4">
          Por que o VISAcheck GO existe
        </h2>
        <p className="text-[#0F2A4A]/70 leading-relaxed mb-4">
          O VISAcheck GO nasceu em Goiânia depois de ver de perto quanto
          tempo e dinheiro se perde com reprovações evitáveis em projetos de
          arquitetura de saúde — um corredor alguns centímetros fora da
          medida, uma distância que não bateu com a norma, um detalhe que só
          aparece depois que o projeto já foi protocolado. É um retrabalho
          caro e, na maioria das vezes, evitável.
        </p>
        <p className="text-[#0F2A4A]/70 leading-relaxed">
          A ideia por trás da ferramenta é simples: colocar essa verificação
          antes do protocolo, não depois — pra sobrar tempo de corrigir
          enquanto o projeto ainda está na tela, não depois que a obra já
          começou.
        </p>
      </section>

      {/* Como garantimos rigor */}
      <section className="bg-[#0F2A4A]/[0.03] py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-marketing-display text-2xl text-[#0F2A4A] mb-4">
            Como garantimos rigor
          </h2>
          <p className="text-[#0F2A4A]/70 leading-relaxed mb-4">
            Nenhuma regra entra na plataforma sem confirmação direta no texto
            oficial publicado — sem depender de resumos de terceiros ou
            suposições. Quando uma informação não pôde ser confirmada com
            segurança, ela fica marcada como pendente em vez de arriscar um
            valor errado.
          </p>
          <p className="text-[#0F2A4A]/70 leading-relaxed">
            O VISAcheck GO está em fase inicial: estamos abrindo acesso
            gratuito para os primeiros arquitetos e engenheiros testarem e
            ajudarem a validar a ferramenta antes do lançamento oficial. Todo
            retorno — o que funcionou, o que travou, o que faltou — molda
            diretamente o que vem a seguir.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#22C79A] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-marketing-display text-3xl text-[#04342C] mb-4">
            Faça parte dessa fase inicial
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
