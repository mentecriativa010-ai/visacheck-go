import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Home,
  Folder,
  BookOpen,
  LogOut,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Info
} from "lucide-react";

interface Projeto {
  id: string;
  nome_projeto: string;
  tipo_arquivo: string; // Utilizado como Tipo de Estabelecimento
  status: "pendente" | "analisando" | "aprovado" | "parcial" | "reprovado";
  created_at: string;
  score_conformidade: number;
}

interface NaoConformidade {
  codigo: string;
  nome: string;
  severidade: "bloqueante" | "critico" | "atencao" | "informativo";
  norma: string;
  descricao: string;
  sugestao: string;
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjectAndUser();
  }, [id]);

  const fetchProjectAndUser = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      // 1. Obter usuÃ¡rio logado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate("/login");
        return;
      }

      // 2. Buscar projeto por id
      const { data: projData, error: projError } = await supabase
        .from("projetos")
        .select("id, nome_projeto, tipo_arquivo, status, created_at, score_conformidade")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (projError) {
        throw projError;
      }

      if (!projData) {
        setError("Projeto nÃ£o encontrado ou vocÃª nÃ£o tem permissÃ£o para acessÃ¡-lo.");
      } else {
        setProjeto(projData as Projeto);
      }
    } catch (err: any) {
      console.error("Erro ao buscar detalhes do projeto:", err);
      setError(err.message || "Ocorreu um erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Gerar nÃ£o-conformidades mockadas baseadas no tipo de estabelecimento
  const getMockNaoConformidades = (tipo: string): NaoConformidade[] => {
    const defaultMocks: NaoConformidade[] = [
      {
        codigo: "GEN-01",
        nome: "Falta de abrigo temporÃ¡rio para resÃ­duos de saÃºde (DML)",
        severidade: "critico",
        norma: "RDC 222/2018 / RDC 50/2002",
        descricao: "AusÃªncia de depÃ³sito de material de limpeza (DML) com ralo sifonado dotado de tampa escamoteÃ¡vel na Ã¡rea de circulaÃ§Ã£o interna, dificultando o armazenamento seguro e provisÃ³rio de sacos de resÃ­duos infectantes.",
        sugestao: "Instalar abrigo temporÃ¡rio de resÃ­duos/DML revestido com material cerÃ¢mico impermeÃ¡vel, contendo torneira para lavagem e ralo sifonado."
      },
      {
        codigo: "GEN-02",
        nome: "Portas de saÃ­das de emergÃªncia abrindo contra o fluxo",
        severidade: "atencao",
        norma: "NBR 9077 / NBR 9050",
        descricao: "As portas das rotas de fuga principais abrem para o lado interno das salas circundantes, obstruindo parcialmente o fluxo livre em caso de pÃ¢nico ou evacuaÃ§Ã£o urgente.",
        sugestao: "Inverter o sentido de abertura das folhas de porta para que abram no sentido do fluxo de escape."
      }
    ];

    const hospitalMocks: NaoConformidade[] = [
      {
        codigo: "HOSP-01",
        nome: "Fluxo cruzado entre material limpo e contaminado na CME",
        severidade: "bloqueante",
        norma: "RDC 50/2002 - Anexo I (Infraestrutura)",
        descricao: "Foi detectada uma abertura direta (porta convencional) ligando a Ã¡rea de recepÃ§Ã£o/expurgo (zona contaminada) Ã  Ã¡rea de preparo de materiais (zona limpa), sem barreira fÃ­sica estanque ou autoclave com porta dupla.",
        sugestao: "Substituir a comunicaÃ§Ã£o fÃ­sica direta por uma autoclave de barreira (dupla porta) e fechar o acesso para manter fluxo unidirecional rÃ­gido."
      },
      {
        codigo: "HOSP-02",
        nome: "AusÃªncia de lavatÃ³rio exclusivo para higienizaÃ§Ã£o no posto",
        severidade: "critico",
        norma: "RDC 50/2002 / NR 32",
        descricao: "O posto de enfermagem central do Bloco de InternaÃ§Ã£o nÃ£o dispÃµe de pia exclusiva para lavagem das mÃ£os, havendo apenas pias de utilidades de uso compartilhado.",
        sugestao: "Instalar lavatÃ³rio com torneira de acionamento que dispense o contato manual (sensor, pedal ou cotovelo), acompanhado de porta-papel toalha e saboneteira lÃ­quida."
      },
      {
        codigo: "HOSP-03",
        nome: "Dimensionamento inadequado de quartos de internaÃ§Ã£o",
        severidade: "atencao",
        norma: "RDC 50/2002 - Item 3",
        descricao: "Os quartos projetados para 2 leitos apresentam Ã¡rea Ãºtil interna de 10.2mÂ², valor inferior ao mÃ­nimo normatizado de 12.0mÂ² exigido para permitir manobra livre de cadeiras de rodas e macas.",
        sugestao: "Ajustar o leiaute arquitetÃ´nico para alocar apenas 1 leito por quarto ou realizar o recuo de divisÃ³rias internas para atingir a metragem mÃ­nima."
      }
    ];

    const clinicaMocks: NaoConformidade[] = [
      {
        codigo: "CLIN-01",
        nome: "Sala de procedimentos sem revestimento lavÃ¡vel",
        severidade: "critico",
        norma: "RDC 50/2002 - Acabamentos de SuperfÃ­cies",
        descricao: "A sala de pequenos procedimentos ambulatoriais apresenta pintura acrÃ­lica convencional e juntas nas soleiras de madeira, superfÃ­cies que acumulam agentes patogÃªnicos e dificultam a higienizaÃ§Ã£o quÃ­mica periÃ³dica.",
        sugestao: "Revestir o piso com material vinÃ­lico ou cerÃ¢mico monolÃ­tico com cantos arredondados e pintar as paredes com tinta epÃ³xi hospitalar lavÃ¡vel."
      },
      {
        codigo: "CLIN-02",
        nome: "Falta de acessibilidade e Ã¡rea de giro nos sanitÃ¡rios",
        severidade: "atencao",
        norma: "NBR 9050 / RDC 50",
        descricao: "Os sanitÃ¡rios abertos ao pÃºblico nÃ£o dispÃµem de Ã¡rea interna livre para diÃ¢metro de rotaÃ§Ã£o de 1,50m, inviabilizando o uso confortÃ¡vel por pacientes cadeirantes.",
        sugestao: "Remodelar o posicionamento da bacia sanitÃ¡ria e do lavatÃ³rio para liberar o cÃ­rculo de giro e fixar barras metÃ¡licas horizontais e verticais regulamentadas."
      },
      {
        codigo: "CLIN-03",
        nome: "SinalizaÃ§Ã£o tÃ¡til direcional e de alerta ausente",
        severidade: "informativo",
        norma: "NBR 9050",
        descricao: "InexistÃªncia de piso tÃ¡til direcional a partir da calÃ§ada externa atÃ© o balcÃ£o principal de atendimento na recepÃ§Ã£o.",
        sugestao: "Aplicar piso tÃ¡til de borracha autocolante obedecendo a coloraÃ§Ã£o contrastante com o piso de fundo para auxiliar deficientes visuais."
      }
    ];

    const cmeMocks: NaoConformidade[] = [
      {
        codigo: "CME-01",
        nome: "Falta de diferencial de pressÃ£o no sistema de exaustÃ£o",
        severidade: "bloqueante",
        norma: "RDC 15/2012 / RDC 50/2002",
        descricao: "A Ã¡rea fÃ­sica de expurgo (recepÃ§Ã£o de material sujo) nÃ£o opera sob pressÃ£o negativa constante em relaÃ§Ã£o aos ambientes vizinhos, possibilitando vazamento de ar com patÃ³genos em suspensÃ£o.",
        sugestao: "Ajustar o damper de retorno e exaustÃ£o mecÃ¢nica para gerar uma pressÃ£o negativa mÃ­nima de 2,5 Pa na sala de expurgo."
      },
      {
        codigo: "CME-02",
        nome: "Falta de barreira tÃ©cnica (pass-through) na lavagem",
        severidade: "critico",
        norma: "RDC 15/2012",
        descricao: "Falta de passa-pratos ou visor vedado na barreira que delimita a lavagem manual de materiais da sala de esterilizaÃ§Ã£o quÃ­mica.",
        sugestao: "Instalar guichÃª estanque do tipo pass-through provido de intertravamento eletrÃ´nico de portas para transferÃªncia de kits limpos."
      }
    ];

    const labMocks: NaoConformidade[] = [
      {
        codigo: "LAB-01",
        nome: "AusÃªncia de chuveiro de emergÃªncia e lava-olhos",
        severidade: "critico",
        norma: "NR 32 / RDC 50/2002",
        descricao: "A bancada de manipulaÃ§Ã£o Ã¡cida e bacteriolÃ³gica nÃ£o dispÃµe de chuveiro de emergÃªncia e lava-olhos acoplado a uma distÃ¢ncia mÃ¡xima de 10 metros.",
        sugestao: "Instalar um mÃ³dulo conjugado de chuveiro industrial e lava-olhos de emergÃªncia com acionamento manual rÃ¡pido por haste."
      },
      {
        codigo: "LAB-02",
        nome: "Armazenamento inadequado de gases inflamÃ¡veis",
        severidade: "atencao",
        norma: "RDC 50/2002 / NR 20",
        descricao: "Identificados cilindros de reposiÃ§Ã£o de gÃ¡s GLP encostados diretamente na parede interna de alvenaria do laboratÃ³rio de patologia.",
        sugestao: "Remover os cilindros do ambiente interno e abrigÃ¡-los na central externa de cilindros de gases, dotada de veneziana de ventilaÃ§Ã£o natural."
      }
    ];

    const consultorioMocks: NaoConformidade[] = [
      {
        codigo: "CONS-01",
        nome: "Falta de pia de lavagem de mÃ£os no consultÃ³rio de exames",
        severidade: "atencao",
        norma: "RDC 50/2002",
        descricao: "O consultÃ³rio planejado para a realizaÃ§Ã£o de consultas clÃ­nicas e exames ginecolÃ³gicos nÃ£o dispÃµe de pia interna integrada, dependendo da pia do banheiro social anexo.",
        sugestao: "Instalar cuba em inox ou louÃ§a com torneira e dispenser de sabÃ£o diretamente na sala de exames fÃ­sicos."
      },
      {
        codigo: "CONS-02",
        nome: "IluminaÃ§Ã£o geral abaixo da faixa exigida para exames",
        severidade: "informativo",
        norma: "NBR ISO/CIE 8995-1",
        descricao: "O fluxo luminoso medido horizontalmente na maca de exames Ã© de apenas 220 lux, sendo a especificaÃ§Ã£o regulamentar de no mÃ­nimo 500 lux para anÃ¡lises clÃ­nicas precisas.",
        sugestao: "Redimensionar o arranjo de iluminaÃ§Ã£o no teto incluindo luminÃ¡rias de LED complementares ou adicionar um foco de luz articulado de pedestal."
      }
    ];

    const t = tipo.toLowerCase();
    if (t.includes("hospital")) return hospitalMocks;
    if (t.includes("clÃ­nica") || t.includes("clinica")) return clinicaMocks;
    if (t.includes("cme")) return cmeMocks;
    if (t.includes("laboratÃ³rio") || t.includes("laboratorio")) return labMocks;
    if (t.includes("consultÃ³rio") || t.includes("consultorio")) return consultorioMocks;

    return defaultMocks;
  };

  const getStatusBadge = (status: Projeto["status"]) => {
    switch (status) {
      case "aprovado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-[#16A34A] border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Aprovado
          </span>
        );
      case "analisando":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1E3A5F] border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F]" />
            Em anÃ¡lise
          </span>
        );
      case "pendente":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-[#64748B] border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            Pendente
          </span>
        );
      case "reprovado":
      case "parcial":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#DC2626] border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Reprovado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-[#64748B] border border-gray-200">
            Pendente
          </span>
        );
    }
  };

  const getSeveridadeBadge = (severidade: NaoConformidade["severidade"]) => {
    switch (severidade) {
      case "bloqueante":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-[#DC2626] border border-red-200 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" />
            Bloqueante
          </span>
        );
      case "critico":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-[#D97706] border border-orange-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            CrÃ­tico
          </span>
        );
      case "atencao":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            AtenÃ§Ã£o
          </span>
        );
      case "informativo":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Informativo
          </span>
        );
    }
  };

  // Gerar resumo executivo dinÃ¢mico
  const getResumoExecutivo = (proj: Projeto, totalInfracoes: number) => {
    const nomeEst = proj.tipo_arquivo || "Estabelecimento de SaÃºde";
    if (proj.status === "aprovado" || proj.score_conformidade === 100) {
      return `O projeto "${proj.nome_projeto}" foi analisado Ã  luz das normas regulatÃ³rias (RDC 50/2002 e correlatas) para ${nomeEst}. NÃ£o foram identificadas nÃ£o-conformidades de carÃ¡ter impeditivo. A prancha e fluxo arquitetÃ´nico encontram-se plenamente alinhados com as exigÃªncias sanitÃ¡rias vigentes.`;
    }
    
    if (proj.status === "pendente") {
      return `O projeto "${proj.nome_projeto}" foi cadastrado no sistema e aguarda o processamento do motor regulatÃ³rio computÃ¡vel. As pranchas estÃ£o na fila para identificaÃ§Ã£o automÃ¡tica de barreiras, fluxos e arranjos espaciais em relaÃ§Ã£o Ã s diretrizes regulatÃ³rias da vigilÃ¢ncia sanitÃ¡ria.`;
    }

    return `O diagnÃ³stico arquitetÃ´nico automatizado para o projeto "${proj.nome_projeto}" (${nomeEst}) identificou um total de ${totalInfracoes} nÃ£o-conformidades estruturais e/ou de fluxo em relaÃ§Ã£o Ã s legislaÃ§Ãµes sanitÃ¡rias aplicÃ¡veis. O Ã­ndice global de conformidade atingiu ${proj.score_conformidade}%, indicando que ajustes corretivos sÃ£o necessÃ¡rios antes da submissÃ£o formal ao Ã³rgÃ£o fiscalizador competente.`;
  };

  const naoconformidades = projeto ? getMockNaoConformidades(projeto.tipo_arquivo) : [];
  const score = projeto?.score_conformidade ?? 100;
  const status = projeto?.status ?? "pendente";

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#1E293B]">
      {/* SIDEBAR FIXA */}
      <aside className="w-64 border-r border-border bg-white flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#1E3A5F]" />
          <span className="text-xl font-bold tracking-tight text-[#1E3A5F]">
            VISAcheck GO
          </span>
        </div>

        {/* Menu de NavegaÃ§Ã£o */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-slate-50 hover:text-foreground"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 bg-[#1E3A5F]/5 text-[#1E3A5F]"
          >
            <Folder className="w-4 h-4" />
            Meus Projetos
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-slate-50 hover:text-foreground"
          >
            <BookOpen className="w-4 h-4" />
            Base de Normas
          </button>
        </nav>

        {/* RodapÃ© da Sidebar */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÃšDO PRINCIPAL */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        {/* Topo / Header */}
        <header className="border-b border-border bg-white py-5 px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-[#1E293B]">
                  {loading ? (
                    <span className="h-6 w-48 bg-slate-100 animate-pulse rounded block" />
                  ) : (
                    projeto?.nome_projeto
                  )}
                </h1>
                {!loading && projeto && getStatusBadge(projeto.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? (
                  <span className="h-3 w-32 bg-slate-100 animate-pulse rounded block" />
                ) : (
                  `Laudo TÃ©cnico do Estabelecimento: ${projeto?.tipo_arquivo}`
                )}
              </p>
            </div>
          </div>
        </header>

        {/* Ãrea de ConteÃºdo */}
        <div className="flex-1 p-8 space-y-8 max-w-5xl w-full mx-auto">
          {loading ? (
            <div className="min-h-[400px] flex flex-col justify-center items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F]" />
              <p className="text-sm text-muted-foreground">Buscando laudo do projeto...</p>
            </div>
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto shadow-sm">
              <AlertOctagon className="w-12 h-12 text-[#DC2626] mx-auto mb-4" />
              <h3 className="text-base font-bold mb-2">Erro ao carregar projeto</h3>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/dashboard")} className="bg-[#1E3A5F]">
                Voltar ao Dashboard
              </Button>
            </div>
          ) : projeto && (
            <div className="space-y-8">
              {/* CARD DE SCORE & RESUMO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score de Conformidade */}
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between md:col-span-1">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">
                      Score de Conformidade
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className={`text-4xl font-extrabold tracking-tight ${
                        score >= 80 ? "text-[#16A34A]" : score >= 50 ? "text-[#D97706]" : "text-[#DC2626]"
                      }`}>
                        {score}%
                      </span>
                      <span className="text-xs text-muted-foreground">de aprovaÃ§Ã£o</span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-2 mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 80 ? "bg-[#16A34A]" : score >= 50 ? "bg-[#D97706]" : "bg-[#DC2626]"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block text-right font-medium">
                      {status === "aprovado" ? "Conformidade Total" : "Ajustes sanitÃ¡rios pendentes"}
                    </span>
                  </div>
                </div>

                {/* Resumo Executivo */}
                <div className="bg-white border border-border p-6 rounded-xl shadow-sm md:col-span-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Resumo Executivo
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {getResumoExecutivo(projeto, naoconformidades.length)}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>AnÃ¡lise executada de acordo com as normas da ANVISA e ABNT aplicÃ¡veis.</span>
                  </div>
                </div>
              </div>

              {/* LISTA DE NÃƒO-CONFORMIDADES */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-[#1E293B]">
                    NÃ£o-Conformidades Identificadas ({status === "aprovado" ? 0 : naoconformidades.length})
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    Regulamento TÃ©cnico: RDC 50/2002
                  </span>
                </div>

                {status === "aprovado" || naoconformidades.length === 0 ? (
                  <div className="bg-white border border-border rounded-xl p-12 text-center shadow-sm">
                    <CheckCircle className="w-12 h-12 text-[#16A34A] mx-auto mb-4" />
                    <h3 className="text-base font-semibold">ParabÃ©ns! Nenhuma irregularidade</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      O projeto atende a todas as especificaÃ§Ãµes sanitÃ¡rias analisadas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {naoconformidades.map((nc) => (
                      <div
                        key={nc.codigo}
                        className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4"
                      >
                        {/* Top Line */}
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-muted-foreground">
                                {nc.codigo}
                              </span>
                              <h3 className="text-sm font-bold text-[#1E293B]">
                                {nc.nome}
                              </h3>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1E3A5F] tracking-wide uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              Norma: {nc.norma}
                            </span>
                          </div>
                          {getSeveridadeBadge(nc.severidade)}
                        </div>

                        {/* DescriÃ§Ã£o do Erro */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Detalhamento TÃ©cnico da Irregularidade
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 border border-slate-100 p-3 rounded-lg">
                            {nc.descricao}
                          </p>
                        </div>

                        {/* AÃ§Ã£o Corretiva Sugerida */}
                        <div className="border border-green-200 bg-green-50/30 p-4 rounded-lg space-y-1.5">
                          <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider block">
                            AÃ§Ã£o Corretiva Sugerida pelo Auditor AI
                          </span>
                          <p className="text-xs text-slate-800 font-medium">
                            {nc.sugestao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
