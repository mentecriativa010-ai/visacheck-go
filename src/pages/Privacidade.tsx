import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, ExternalLink } from "lucide-react";

const ULTIMA_ATUALIZACAO = "29/06/2026";
const EMAIL_CONTATO = "privacidade@visacheckgo.com.br"; // [PREENCHER]
const NOME_ENCARREGADO = "Elias Neves"; // [PREENCHER]

export default function Privacidade() {
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

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Título */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            LGPD — Lei nº 13.709/2018
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {ULTIMA_ATUALIZACAO}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">

          {/* Aviso destaque */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <p>
              Esta Política descreve como o <strong>VISAcheck GO</strong> coleta, usa, armazena e protege
              os dados pessoais dos usuários, em conformidade com a <strong>Lei Geral de Proteção de Dados
              Pessoais (LGPD) — Lei nº 13.709/2018</strong>. Ao usar a Plataforma, você concorda com
              as práticas aqui descritas.
            </p>
          </div>

          <Secao numero="1" titulo="Quem é o controlador dos dados">
            <p>O controlador dos dados pessoais tratados nesta Plataforma é:</p>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Razão social:</strong> [PREENCHER]</li>
              <li><strong className="text-foreground">CNPJ:</strong> [PREENCHER]</li>
              <li><strong className="text-foreground">Contato:</strong> {EMAIL_CONTATO}</li>
            </ul>
          </Secao>

          <Secao numero="2" titulo="Quais dados coletamos">
            <SubSecao titulo="2.1 Dados de cadastro e conta">
              <p>Nome, e-mail e senha (criptografada). Necessários para autenticação e identificação do
              usuário responsável por cada projeto analisado.</p>
            </SubSecao>
            <SubSecao titulo="2.2 Dados contidos nos projetos enviados">
              <p>Para realizar a análise regulatória, você envia PDFs de projetos arquitetônicos que
              <strong> podem conter dados pessoais de terceiros</strong>, como:</p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
                <li>Nome do(a) proprietário(a) ou responsável legal pelo estabelecimento</li>
                <li>Nome e número de registro (CAU/CREA) do(a) arquiteto(a) responsável</li>
                <li>Endereço do estabelecimento de saúde</li>
                <li>CNPJ da empresa responsável pelo projeto</li>
              </ul>
              <div className="mt-3 bg-muted rounded-lg p-3 text-muted-foreground">
                <strong className="text-foreground">Importante:</strong> o VISAcheck GO analisa <em>projetos
                arquitetônicos</em>, não prontuários ou dados clínicos de pacientes. Não há tratamento
                de dados sensíveis de pacientes nesta Plataforma.
              </div>
            </SubSecao>
            <SubSecao titulo="2.3 Dados de uso e técnicos">
              <p>Endereço IP, tipo de navegador, logs de acesso e identificadores de sessão, para garantir
              a segurança e o funcionamento técnico da Plataforma.</p>
            </SubSecao>
          </Secao>

          <Secao numero="3" titulo="Para que usamos seus dados">
            <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
              <li>Criar e gerenciar sua conta de usuário</li>
              <li>Processar os projetos enviados e gerar os relatórios de conformidade regulatória</li>
              <li>Manter histórico dos projetos e análises realizadas</li>
              <li>Garantir a segurança da Plataforma e prevenir fraudes</li>
              <li>Comunicar informações relevantes sobre o serviço</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Não usamos dados dos projetos para treinar modelos de IA próprios,
              nem os vendemos ou compartilhamos para fins de publicidade.
            </p>
          </Secao>

          <Secao numero="4" titulo="Base legal para o tratamento">
            <div className="space-y-3">
              <ItemBaseLegal rotulo="Execução de contrato (Art. 7º, V)" descricao="Para prestar o serviço de análise regulatória que você contratou ao se cadastrar." />
              <ItemBaseLegal rotulo="Legítimo interesse (Art. 7º, IX)" descricao="Para garantir a segurança, prevenir fraudes e melhorar a qualidade do serviço." />
              <ItemBaseLegal rotulo="Consentimento (Art. 7º, I)" descricao="Para a transferência internacional de dados descrita na Seção 5, obtido de forma específica e em destaque no momento do cadastro." />
            </div>
          </Secao>

          <Secao numero="5" titulo="Compartilhamento e transferência internacional de dados">
            <p className="mb-4">
              Para funcionar, o VISAcheck GO utiliza fornecedores de tecnologia que processam dados em
              nosso nome. <strong>Partes dos dados — incluindo trechos extraídos dos projetos enviados —
              são transferidas internacionalmente para fora do Brasil</strong>, nos termos do Art. 33 da LGPD.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Fornecedor</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Finalidade</th>
                    <th className="text-left py-2 font-semibold text-foreground">Localização</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Supabase</td>
                    <td className="py-2.5 pr-4">Banco de dados e armazenamento de arquivos</td>
                    <td className="py-2.5">Pode ser fora do Brasil</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">OpenRouter (Google, OpenAI, NVIDIA)</td>
                    <td className="py-2.5 pr-4">Processamento por IA do conteúdo extraído dos PDFs</td>
                    <td className="py-2.5">Predominantemente EUA</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-foreground">Vercel</td>
                    <td className="py-2.5 pr-4">Hospedagem da aplicação web</td>
                    <td className="py-2.5">Predominantemente EUA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-muted-foreground">
              A base legal para essa transferência é o <strong className="text-foreground">consentimento
              específico e em destaque</strong> do titular (Art. 33, VIII da LGPD), obtido no momento
              do cadastro. Não compartilhamos dados para fins de marketing ou publicidade.
            </p>
          </Secao>

          <Secao numero="6" titulo="Por quanto tempo guardamos seus dados">
            <p>Mantemos os dados enquanto sua conta estiver ativa. Após a solicitação de exclusão, os
            dados pessoais serão eliminados ou anonimizados em até <strong>30 dias</strong>, exceto
            quando a manutenção for exigida por obrigação legal (Art. 16 da LGPD).</p>
          </Secao>

          <Secao numero="7" titulo="Segurança da informação">
            <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
              <li>Conexão criptografada (HTTPS) em toda a Plataforma</li>
              <li>Senhas armazenadas de forma criptografada</li>
              <li>Controle de acesso por conta de usuário (Row Level Security)</li>
              <li>Arquivos PDF armazenados em bucket privado, acessível apenas pelo próprio usuário</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Em caso de incidente de segurança relevante, comunicaremos a ANPD e os titulares afetados
              conforme o Art. 48 da LGPD.
            </p>
          </Secao>

          <Secao numero="8" titulo="Seus direitos como titular (Art. 18 da LGPD)">
            <p className="mb-3">Você tem direito a, mediante solicitação pelo e-mail {EMAIL_CONTATO}:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "Confirmar a existência de tratamento dos seus dados",
                "Acessar seus dados pessoais",
                "Corrigir dados incompletos ou inexatos",
                "Solicitar anonimização, bloqueio ou eliminação de dados",
                "Solicitar portabilidade dos seus dados",
                "Revogar o consentimento a qualquer momento",
                "Ser informado sobre compartilhamento com terceiros",
                "Solicitar eliminação dos dados tratados com base no consentimento",
              ].map((direito, i) => (
                <div key={i} className="flex items-start gap-2 bg-muted rounded-lg p-3">
                  <span className="text-primary font-bold text-xs mt-0.5">{i + 1}</span>
                  <span className="text-xs text-muted-foreground">{direito}</span>
                </div>
              ))}
            </div>
          </Secao>

          <Secao numero="9" titulo="Encarregado de Dados (DPO)">
            <p>Em cumprimento ao Art. 41 da LGPD, designamos como Encarregado pelo Tratamento de Dados:</p>
            <div className="mt-3 bg-muted rounded-lg p-4 space-y-1">
              <p><strong>Nome:</strong> {NOME_ENCARREGADO}</p>
              <p><strong>Contato:</strong> {EMAIL_CONTATO}</p>
            </div>
          </Secao>

          <Secao numero="10" titulo="Alterações nesta Política">
            <p>Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas
            por e-mail ou por aviso na Plataforma, com indicação da nova data de vigência no topo
            deste documento.</p>
          </Secao>

          <Secao numero="11" titulo="Contato">
            <p>Dúvidas sobre esta Política podem ser enviadas para:&nbsp;
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
          <Button variant="link" size="sm" className="text-xs text-muted-foreground p-0" onClick={() => navigate("/termos")}>
            Termos de Uso
          </Button>
        </div>
      </footer>
    </div>
  );
}

// Componentes auxiliares de layout
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

function SubSecao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-foreground mb-2">{titulo}</h3>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

function ItemBaseLegal({ rotulo, descricao }: { rotulo: string; descricao: string }) {
  return (
    <div className="flex gap-3 bg-muted rounded-lg p-3">
      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
      <div>
        <span className="font-medium text-foreground text-xs">{rotulo}</span>
        <p className="text-muted-foreground text-xs mt-0.5">{descricao}</p>
      </div>
    </div>
  );
}
