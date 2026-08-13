import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ComplianceScanVisual } from "@/components/marketing/ComplianceScanVisual";
import { supabase } from "@/integrations/supabase/client";

const normas = [
  { codigo: "RDC-50/2002", tema: "Infraestrutura física de estabelecimentos de saúde" },
  { codigo: "NBR 9050:2020", tema: "Acessibilidade a edificações e espaços" },
  { codigo: "RDC-1002/2025", tema: "Boas práticas em serviços odontológicos" },
  { codigo: "RDC-07/2010", tema: "Unidades de Terapia Intensiva" },
  { codigo: "RDC-15/2012", tema: "Processamento de produtos para saúde (CME)" },
  { codigo: "RDC-330/2019", tema: "Serviços de radiologia diagnóstica" },
  { codigo: "RDC-430/2020", tema: "Distribuição e armazenagem de medicamentos" },
  { codigo: "RDC-44/2009", tema: "Farmácias e drogarias" },
];

const passos = [
  {
    numero: "01",
    titulo: "Envie o projeto",
    texto: "Faça upload do PDF do seu projeto arquitetônico — planta baixa, memorial, o que você já tem pronto.",
  },
  {
    numero: "02",
    titulo: "A IA verifica contra 8 normas",
    texto: "Cada ambiente do projeto é conferido item a item contra as normas aplicáveis à tipologia do estabelecimento.",
  },
  {
    numero: "03",
    titulo: "Receba o relatório",
    texto: "Conformidades, não conformidades e pendências de informação, organizadas por norma e por ambiente — pronto pra corrigir antes de protocolar.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EC]">
        <div className="w-6 h-6 border-2 border-[#0F2A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] font-body">
      <SEO
        title="VISAcheck GO — Verificação de conformidade RDC/ANVISA para projetos de saúde"
        description="Verifique a conformidade do seu projeto de arquitetura de saúde com RDC-50, NBR 9050, RDC-1002 e outras 5 normas da ANVISA antes de protocolar. Menos retrabalho, aprovação mais rápida."
      />
      <MarketingNavbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-marketing-display text-4xl md:text-5xl leading-[1.1] text-[#0F2A4A] mb-6">
            Reprovação na vigilância sanitária significa meses de atraso na obra.
          </h1>
          <p className="text-lg text-[#0F2A4A]/70 leading-relaxed mb-8 max-w-md">
            Verifique se o seu projeto de arquitetura de saúde está em
            conformidade com RDC-50, NBR 9050 e outras normas da ANVISA{" "}
            <em className="not-italic font-medium text-[#0F2A4A]">antes</em>{" "}
            de protocolar — não depois.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center rounded-full bg-[#22C79A] text-[#04342C] px-7 py-3.5 font-medium hover:bg-[#1DB88C] transition-colors"
            >
              Testar grátis
            </Link>
            <Link
              to="/como-funciona"
              className="inline-flex items-center text-[#0F2A4A] font-medium underline decoration-[#0F2A4A]/30 underline-offset-4 hover:decoration-[#0F2A4A] transition-colors"
            >
              Ver como funciona
            </Link>
          </div>
        </div>

        <ComplianceScanVisual />
      </section>

      {/* Problema / stakes */}
      <section className="bg-[#0F2A4A] text-[#F7F4EC] py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
          <div>
            <p className="font-marketing-display text-3xl text-[#22C79A] mb-2">8 normas</p>
            <p className="text-sm text-[#F7F4EC]/70 leading-relaxed">
              RDC-50, NBR 9050, RDC-1002, RDC-07, RDC-15, RDC-330, RDC-430 e
              RDC-44 — cada uma revisada item a item contra o texto oficial.
            </p>
          </div>
          <div>
            <p className="font-marketing-display text-3xl text-[#22C79A] mb-2">Minutos</p>
            <p className="text-sm text-[#F7F4EC]/70 leading-relaxed">
              É o tempo entre subir o PDF e ter um relatório completo —
              contra semanas esperando um parecer da vigilância.
            </p>
          </div>
          <div>
            <p className="font-marketing-display text-3xl text-[#22C79A] mb-2">Antes de protocolar</p>
            <p className="text-sm text-[#F7F4EC]/70 leading-relaxed">
              Corrija o que está errado enquanto o projeto ainda está na tela
              — não depois que a obra já começou.
            </p>
          </div>
        </div>
      </section>

      {/* Como funciona (resumo) */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-marketing-display text-3xl text-[#0F2A4A] mb-12 max-w-lg">
          Como funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {passos.map((passo) => (
            <div key={passo.numero}>
              <p className="font-mono-custom text-sm text-[#22C79A] mb-3">
                {passo.numero}
              </p>
              <h3 className="font-medium text-[#0F2A4A] text-lg mb-2">{passo.titulo}</h3>
              <p className="text-sm text-[#0F2A4A]/70 leading-relaxed">{passo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Normas cobertas — conteúdo indexável */}
      <section className="bg-[#0F2A4A]/[0.03] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-marketing-display text-3xl text-[#0F2A4A] mb-4 max-w-lg">
            Normas verificadas pelo VISAcheck GO
          </h2>
          <p className="text-[#0F2A4A]/70 mb-12 max-w-xl">
            Cada regra foi conferida diretamente contra o texto oficial —
            sem depender de resumos de terceiros ou suposições.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {normas.map((norma) => (
              <div
                key={norma.codigo}
                className="bg-[#F7F4EC] border border-[#0F2A4A]/10 rounded-xl p-5"
              >
                <p className="font-mono-custom text-sm text-[#22C79A] mb-2">
                  {norma.codigo}
                </p>
                <p className="text-sm text-[#0F2A4A]/80 leading-snug">{norma.tema}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibilidade */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-[1fr_1.4fr] gap-12 items-start">
        <div className="w-24 h-24 rounded-full bg-[#0F2A4A] flex items-center justify-center font-marketing-display text-2xl text-[#F7F4EC]">
          EN
        </div>
        <div>
          <h2 className="font-marketing-display text-2xl text-[#0F2A4A] mb-4">
            Cada regra, conferida linha a linha contra o texto oficial
          </h2>
          <p className="text-[#0F2A4A]/70 leading-relaxed mb-4">
            Elias Cardoso Neves desenvolveu o VISAcheck GO depois de ver de
            perto quanto tempo e dinheiro se perde com reprovações evitáveis
            em projetos de arquitetura de saúde. Nenhuma regra na plataforma
            entra sem confirmação direta no texto oficial publicado — sem
            depender de resumos de terceiros ou suposições. Quando uma
            informação não pôde ser confirmada com segurança, ela fica
            marcada como pendente em vez de arriscar um valor errado.
          </p>
          <p className="text-[#0F2A4A]/70 leading-relaxed">
            O VISAcheck GO está em fase inicial: estamos abrindo acesso
            gratuito para os primeiros arquitetos testarem e ajudarem a
            validar a ferramenta antes do lançamento oficial.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#22C79A] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-marketing-display text-3xl text-[#04342C] mb-4">
            Seja um dos primeiros a testar
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
