import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-[#F7F4EC] font-body">
      <SEO
        title="Como funciona — VISAcheck GO"
        description="Veja como o VISAcheck GO verifica a conformidade do seu projeto de arquitetura de saúde com RDC-50, NBR 9050 e outras normas da ANVISA em minutos."
      />
      <MarketingNavbar />

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="font-mono-custom text-sm text-[#22C79A] mb-4">COMO FUNCIONA</p>
        <h1 className="font-marketing-display text-4xl md:text-5xl leading-[1.1] text-[#0F2A4A] mb-6">
          Do PDF ao relatório, em 3 passos
        </h1>
        <p className="text-lg text-[#0F2A4A]/70 leading-relaxed">
          Sem planilha, sem decorar tabela de norma. Você envia o que já tem
          pronto, a IA faz a verificação item a item.
        </p>
      </section>

      {/* Passo 1 */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-[auto_1fr] gap-8 items-start">
        <p className="font-marketing-display text-5xl text-[#22C79A]">01</p>
        <div>
          <h2 className="font-marketing-display text-2xl text-[#0F2A4A] mb-3">
            Envie o projeto e escolha o ambiente
          </h2>
          <p className="text-[#0F2A4A]/70 leading-relaxed max-w-2xl">
            Faça upload do PDF do seu projeto arquitetônico — planta baixa,
            memorial descritivo, o que você já tem pronto no fluxo normal de
            trabalho. Em seguida, indique qual ambiente está sendo submetido
            à análise (Centro Cirúrgico, UTI, Consultório Odontológico,
            Laboratório de Prótese, e outros). Isso garante que a IA avalie
            só o que é relevante pra aquele ambiente, ignorando o resto do
            edifício que aparece no PDF só como contexto de implantação.
          </p>
        </div>
      </section>

      {/* Passo 2 — com screenshot real */}
      <section className="bg-[#0F2A4A]/[0.03] py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[auto_1fr] gap-8 items-start mb-10">
          <p className="font-marketing-display text-5xl text-[#22C79A]">02</p>
          <div>
            <h2 className="font-marketing-display text-2xl text-[#0F2A4A] mb-3">
              A IA verifica contra as normas aplicáveis
            </h2>
            <p className="text-[#0F2A4A]/70 leading-relaxed max-w-2xl">
              Cada regra é conferida uma a uma contra o texto do seu projeto.
              O resultado vem organizado por categoria (Acessibilidade,
              Infraestrutura, Gestão), com um score objetivo de conformidade
              — não um "parece que está tudo bem", um número calculado item a
              item.
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6">
          <img
            src="/screenshots/produto-score.png"
            alt="Tela de resultado do VISAcheck GO mostrando score de conformidade de 93%, resumo da análise e validações por categoria"
            className="w-full h-auto rounded-2xl shadow-lg"
            loading="lazy"
          />
        </div>
      </section>

      {/* Passo 3 — com screenshot real */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[auto_1fr] gap-8 items-start mb-10">
          <p className="font-marketing-display text-5xl text-[#22C79A]">03</p>
          <div>
            <h2 className="font-marketing-display text-2xl text-[#0F2A4A] mb-3">
              Veja exatamente o que corrigir — e por quê
            </h2>
            <p className="text-[#0F2A4A]/70 leading-relaxed max-w-2xl">
              Cada não conformidade vem com o código da regra, a norma de
              origem, o detalhamento do que está errado e a referência exata
              (tabela, artigo) usada pra chegar naquela conclusão. Nada de
              "está errado, resolva aí" — você sabe exatamente o que mudar
              antes de protocolar.
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6">
          <img
            src="/screenshots/produto-naoconformidades.png"
            alt="Tela do VISAcheck GO mostrando duas não-conformidades detalhadas, com código da regra, norma de origem, detalhamento e referência da tabela"
            className="w-full h-auto rounded-2xl shadow-lg"
            loading="lazy"
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#22C79A] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-marketing-display text-3xl text-[#04342C] mb-4">
            Testa com o seu próprio projeto
          </h2>
          <p className="text-[#04342C]/80 mb-8">
            Acesso gratuito para os primeiros arquitetos, em troca de
            feedback direto sobre o produto.
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
