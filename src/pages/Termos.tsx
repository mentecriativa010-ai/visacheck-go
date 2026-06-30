import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, AlertTriangle, ExternalLink } from "lucide-react";

const ULTIMA_ATUALIZACAO = "29/06/2026";
const EMAIL_CONTATO = "privacidade@visacheckgo.com.br"; // [PREENCHER]
const FORO_COMARCA = "Goiânia, GO"; // [PREENCHER]

export default function Termos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">VISAcheck GO</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Título */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Contrato de uso da Plataforma
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {ULTIMA_ATUALIZACAO}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">

          {/* Aviso destaque — limitação de responsabilidade em destaque ANTES de qualquer seção */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              Leia antes de usar
            </div>
            <p className="text-foreground/80">
              O VISAcheck GO é uma ferramenta de <strong>apoio técnico automatizado</strong>. Os resultados
              gerados — score de conformidade, pareceres e lista de não-conformidades — são produzidos
              por modelos de inteligência artificial e regras pré-cadastradas, e <strong>podem conter
              erros ou omissões</strong>.
            </p>
            <p className="text-foreground/80">
              <strong>A Plataforma não substitui</strong> a análise de arquiteto(a) ou engenheiro(a)
              habilitado(a), a aprovação oficial pelos órgãos de Vigilância Sanitária, nem qualquer
              responsabilidade técnica (ART/RRT). A decisão final sobre conformidade de um projeto
              cabe exclusivamente aos órgãos competentes e profissionais legalmente habilitados.
            </p>
          </div>

          <Secao numero="1" titulo="Descrição do serviço">
            <p>
              O VISAcheck GO realiza diagnósticos automatizados de conformidade de projetos arquitetônicos
              de estabelecimentos de saúde frente a normas selecionadas (como ABNT NBR 9050 e RDC ANVISA
              50/2002), combinando regras pré-cadastradas com análise por inteligência artificial.
            </p>
          </Secao>

          <Secao numero="2" titulo="Cadastro e conta de usuário">
            <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
              <li>Você deve fornecer informações verdadeiras, completas e atualizadas ao criar sua conta.</li>
              <li>Você é responsável por manter a confidencialidade da sua senha e por todas as atividades
              realizadas em sua conta.</li>
              <li>Ao aceitar estes Termos, você declara ter capacidade legal para fazê-lo e, caso represente
              uma empresa, ter poderes para vinculá-la a estes Termos.</li>
            </ul>
          </Secao>

          <Secao numero="3" titulo="Responsabilidade sobre dados e arquivos enviados">
            <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
              <li>Você é o único responsável pela veracidade, exatidão e legalidade dos arquivos e
              informações que envia à Plataforma.</li>
              <li>Ao enviar projetos com dados pessoais de terceiros (nome de proprietário, arquiteto,
              endereço), você declara possuir base legal para esse tratamento, isentando o VISAcheck GO
              de responsabilidade por eventual irregularidade na origem desses dados.</li>
              <li>É proibido enviar arquivos que violem direitos de terceiros ou que não correspondam
              a projetos arquitetônicos reais destinados à finalidade da Plataforma.</li>
            </ul>
          </Secao>

          <Secao numero="4" titulo="Uso aceitável">
            <p className="mb-2 text-muted-foreground">Ao utilizar a Plataforma, você se compromete a não:</p>
            <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
              <li>Tentar acessar dados, contas ou projetos de outros usuários sem autorização</li>
              <li>Utilizar a Plataforma para fins ilícitos</li>
              <li>Realizar engenharia reversa, copiar ou redistribuir a Plataforma sem autorização</li>
              <li>Sobrecarregar deliberadamente os sistemas com automação massiva de envios</li>
            </ul>
          </Secao>

          <Secao numero="5" titulo="Propriedade intelectual">
            <p className="text-muted-foreground">
              A marca, o layout, o código-fonte e a base de normas estruturadas pertencem ao VISAcheck GO.
              Os arquivos que você envia continuam sendo de sua propriedade — você concede à Plataforma
              apenas a licença necessária para processar esses arquivos com a finalidade de prestar o
              serviço contratado, conforme a{" "}
              <button onClick={() => navigate("/privacidade")} className="text-primary hover:underline inline-flex items-center gap-1">
                Política de Privacidade <ExternalLink className="w-3 h-3" />
              </button>.
            </p>
          </Secao>

          <Secao numero="6" titulo="Limitação de responsabilidade">
            <div className="bg-muted rounded-xl p-4 space-y-3 text-muted-foreground">
              <p>
                O VISAcheck GO é fornecido "como está" (<em>as is</em>), sem garantias de exatidão
                absoluta, disponibilidade ininterrupta ou ausência de erros.
              </p>
              <p>
                Na máxima extensão permitida pela legislação, o VISAcheck GO <strong className="text-foreground">
                não se responsabiliza</strong> por:
              </p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>Decisões tomadas com base nos resultados automatizados sem revisão por profissional habilitado</li>
                <li>Indeferimentos, autuações ou embargos decorrentes do uso exclusivo do diagnóstico gerado pela Plataforma</li>
                <li>Indisponibilidades temporárias por manutenção, falhas de fornecedores terceiros ou força maior</li>
              </ul>
            </div>
          </Secao>

          <Secao numero="7" titulo="Disponibilidade do serviço">
            <p className="text-muted-foreground">
              A Plataforma pode passar por manutenções programadas ou indisponibilidades não programadas.
              Faremos esforços razoáveis para minimizar interrupções, mas não garantimos disponibilidade
              ininterrupta.
            </p>
          </Secao>

          <Secao numero="8" titulo="Cancelamento de conta">
            <p className="text-muted-foreground">
              Você pode solicitar o cancelamento da sua conta a qualquer momento pelo e-mail{" "}
              <a href={`mailto:${EMAIL_CONTATO}`} className="text-primary hover:underline">
                {EMAIL_CONTATO}
              </a>. Os dados serão tratados conforme a Política de Privacidade, Seção 6.
            </p>
          </Secao>

          <Secao numero="9" titulo="Alterações destes Termos">
            <p className="text-muted-foreground">
              Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas
              com antecedência razoável. O uso continuado da Plataforma após a atualização constitui
              aceitação dos novos Termos.
            </p>
          </Secao>

          <Secao numero="10" titulo="Lei aplicável e foro">
            <p className="text-muted-foreground">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
              da comarca de <strong className="text-foreground">{FORO_COMARCA}</strong> para dirimir
              quaisquer controvérsias, com renúncia a qualquer outro foro, por mais privilegiado que seja.
            </p>
          </Secao>

          <Secao numero="11" titulo="Contato">
            <p className="text-muted-foreground">
              Dúvidas sobre estes Termos podem ser enviadas para:{" "}
              <a href={`mailto:${EMAIL_CONTATO}`} className="text-primary hover:underline inline-flex items-center gap-1">
                {EMAIL_CONTATO} <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </Secao>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} VISAcheck GO — Todos os direitos reservados</span>
          <Button variant="link" size="sm" className="text-xs text-muted-foreground p-0" onClick={() => navigate("/privacidade")}>
            Política de Privacidade
          </Button>
        </div>
      </footer>
    </div>
  );
}

// Componente auxiliar de seção
function Secao({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-primary text-xs font-mono">{numero}.</span>
        {titulo}
      </h2>
      <div className="pl-5 space-y-3">{children}</div>
    </section>
  );
}
