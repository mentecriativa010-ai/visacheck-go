// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// MAPEAMENTO: ambiente selecionado → tipo_estabelecimento no banco
// Normas "base" sempre são incluídas (RDC-50, NBR-9050, etc.)
// ─────────────────────────────────────────────────────────────────────────────
const AMBIENTE_PARA_TIPOS: Record<string, string[]> = {
  // Hospitalar
  "UTI Adulto":             ["base", "hospital_uti"],
  "UTI Pediátrica":         ["base", "hospital_uti"],
  "UTI Neonatal":           ["base", "hospital_uti"],
  "CME":                    ["base", "hospital_cme"],
  "Centro Cirúrgico":       ["base", "hospital_cc"],
  "Radiologia":             ["base", "hospital_radiologia"],
  "Hospital Geral":         ["base", "hospital_uti", "hospital_cme", "hospital_radiologia"],
  "Internação":             ["base"],
  "Pronto Socorro":         ["base"],
  "Ambulatório":            ["base"],
  // Odontologia
  "Consultório Odontológico": ["base", "odontologia"],
  "Centro Cirúrgico Odontológico": ["base", "odontologia"],
  "Laboratório de Prótese": ["base", "odontologia"],
  // Farmácias / Distribuidoras
  "Drogaria":               ["base", "drogaria"],
  "Farmácia de Manipulação":["base", "farmacia_manipulacao"],
  "Distribuidora":          ["distribuidora"],
  // Outros
  "Clínica Médica":         ["base"],
  "Laboratório":            ["base"],
};

// Labels exibidos no submenu — espelha as chaves do mapeamento acima
const TIPOS_ESTABELECIMENTO = [
  { grupo: "Hospitalar", itens: [
    "UTI Adulto", "UTI Pediátrica", "UTI Neonatal",
    "CME", "Centro Cirúrgico", "Radiologia",
    "Hospital Geral", "Internação", "Pronto Socorro", "Ambulatório",
  ]},
  { grupo: "Odontologia", itens: [
    "Consultório Odontológico",
    "Centro Cirúrgico Odontológico",
    "Laboratório de Prótese",
  ]},
  { grupo: "Farmácias / Distribuidoras", itens: [
    "Drogaria", "Farmácia de Manipulação", "Distribuidora",
  ]},
  { grupo: "Outros", itens: [
    "Clínica Médica", "Laboratório",
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Analise() {
  const navigate = useNavigate();

  const [tipoSelecionado, setTipoSelecionado] = useState<string>("");
  const [regras, setRegras] = useState<any[]>([]);
  const [resultados, setResultados] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState<Record<string, boolean>>({});
  const [projetoNome, setProjetoNome] = useState("");
  const [projetoDescricao, setProjetoDescricao] = useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // Carrega regras filtradas por tipo de estabelecimento
  // Mudança principal: query agora filtra por tipo_estabelecimento e ambiente
  // ───────────────────────────────────────────────────────────────────────────
  async function carregarRegras(tipo: string) {
    if (!tipo) return;
    setCarregando(true);
    setRegras([]);
    setResultados({});
    setObservacoes({});

    try {
      const tiposAlvo = AMBIENTE_PARA_TIPOS[tipo] ?? ["base"];

      // Estratégia de filtro:
      // 1. Busca por tipo_estabelecimento (coluna populada nos UPDATEs)
      // 2. OU por ambiente[] (array com o nome do ambiente)
      // As duas colunas se complementam — tipo_estabelecimento é a fonte principal,
      // ambiente[] é o fallback para regras que ainda não têm tipo_estabelecimento

      const { data, error } = await supabase
        .from("regras_regulatorias")
        .select("*")
        .or(
          tiposAlvo.map(t => `tipo_estabelecimento.eq.${t}`).join(",") +
          `,ambiente.cs.{"${tipo}"}`
        )
        .order("norma_origem", { ascending: true })
        .order("codigo", { ascending: true });

      if (error) throw error;

      // Remove duplicatas (uma regra pode aparecer por tipo E por ambiente)
      const unicas = data
        ? [...new Map(data.map((r: any) => [r.id, r])).values()]
        : [];

      setRegras(unicas);

      if (unicas.length === 0) {
        toast({
          title: "Nenhuma regra encontrada",
          description: `Não há regras cadastradas para "${tipo}" ainda. Verifique se as normas foram inseridas no banco.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: `${unicas.length} regras carregadas`,
          description: `Normas aplicáveis a: ${tipo}`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro ao carregar regras",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  }

  function handleTipoChange(tipo: string) {
    setTipoSelecionado(tipo);
    carregarRegras(tipo);
  }

  function handleResultado(id: string, valor: string) {
    setResultados(prev => ({ ...prev, [id]: valor }));
  }

  function handleObservacao(id: string, valor: string) {
    setObservacoes(prev => ({ ...prev, [id]: valor }));
  }

  function toggleSubmenu(grupo: string) {
    setSubmenuAberto(prev => ({ ...prev, [grupo]: !prev[grupo] }));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Agrupa regras por norma_origem para exibição em seções colapsáveis
  // ───────────────────────────────────────────────────────────────────────────
  const regrasPorNorma = regras.reduce((acc: Record<string, any[]>, regra) => {
    const norma = regra.norma_origem ?? "Sem norma";
    if (!acc[norma]) acc[norma] = [];
    acc[norma].push(regra);
    return acc;
  }, {});

  const totalConformes = Object.values(resultados).filter(v => v === "conforme").length;
  const totalNaoConformes = Object.values(resultados).filter(v => v === "nao_conforme").length;
  const totalNaoAplicavel = Object.values(resultados).filter(v => v === "nao_aplicavel").length;
  const totalRespondidas = totalConformes + totalNaoConformes + totalNaoAplicavel;

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Análise Manual de Conformidade</h1>
            <p className="text-sm text-muted-foreground">Checklist regulatório por tipo de ambiente</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Dados do projeto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do projeto</Label>
              <Input
                id="nome"
                placeholder="Ex: Reforma UTI Adulto — Hospital XYZ"
                value={projetoNome}
                onChange={e => setProjetoNome(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva brevemente o escopo do projeto..."
                value={projetoDescricao}
                onChange={e => setProjetoDescricao(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seleção do tipo de ambiente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de Ambiente</CardTitle>
            <CardDescription>
              Selecione o tipo de estabelecimento/ambiente para carregar apenas as normas aplicáveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={tipoSelecionado} onValueChange={handleTipoChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo de ambiente..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ESTABELECIMENTO.map(grupo => (
                  <div key={grupo.grupo}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {grupo.grupo}
                    </div>
                    {grupo.itens.map(item => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {tipoSelecionado && !carregando && regras.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {regras.length} regras carregadas
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Object.keys(regrasPorNorma).length} normas aplicáveis
                </Badge>
                {(AMBIENTE_PARA_TIPOS[tipoSelecionado] ?? []).map(t => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Painel de progresso */}
        {regras.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {totalRespondidas} / {regras.length} respondidas
                </span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {totalConformes} conformes
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5" />
                    {totalNaoConformes} não conformes
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {totalNaoAplicavel} N/A
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${regras.length ? (totalRespondidas / regras.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carregando */}
        {carregando && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Carregando regras para <strong>{tipoSelecionado}</strong>...
            </CardContent>
          </Card>
        )}

        {/* Checklist agrupado por norma */}
        {!carregando && Object.entries(regrasPorNorma).map(([norma, regrasDaNorma]) => {
          const aberto = submenuAberto[norma] !== false; // aberto por padrão
          const respondidas = regrasDaNorma.filter(r => resultados[r.id]).length;

          return (
            <Card key={norma}>
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleSubmenu(norma)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {aberto
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                    <CardTitle className="text-sm font-semibold">{norma}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {respondidas}/{regrasDaNorma.length}
                  </Badge>
                </div>
              </CardHeader>

              {aberto && (
                <CardContent className="space-y-4 pt-0">
                  {regrasDaNorma.map(regra => (
                    <div
                      key={regra.id}
                      className="border border-border rounded-lg p-4 space-y-3"
                    >
                      {/* Cabeçalho da regra */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono text-muted-foreground">
                              {regra.codigo || regra.codigo_regra || "—"}
                            </span>
                            {regra.obrigatorio && (
                              <Badge variant="destructive" className="text-xs py-0">
                                Obrigatório
                              </Badge>
                            )}
                            {regra.categoria && (
                              <Badge variant="outline" className="text-xs py-0">
                                {regra.categoria}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{regra.descricao}</p>
                          {regra.artigo_referencia && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ref: {regra.artigo_referencia}
                            </p>
                          )}
                          {(regra.valor_minimo != null || regra.valor_maximo != null) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {regra.valor_minimo != null && `Mín: ${regra.valor_minimo}${regra.unidade ?? ""}`}
                              {regra.valor_minimo != null && regra.valor_maximo != null && " · "}
                              {regra.valor_maximo != null && `Máx: ${regra.valor_maximo}${regra.unidade ?? ""}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botões de resultado */}
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { valor: "conforme",      label: "Conforme",      icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
                          { valor: "nao_conforme",  label: "Não Conforme",  icon: <XCircle className="h-3.5 w-3.5" />,     cls: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
                          { valor: "nao_aplicavel", label: "N/A",           icon: <AlertCircle className="h-3.5 w-3.5" />, cls: "border-muted-foreground/40 bg-muted text-muted-foreground" },
                        ].map(opt => (
                          <button
                            key={opt.valor}
                            onClick={() => handleResultado(regra.id, opt.valor)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all
                              ${resultados[regra.id] === opt.valor
                                ? `${opt.cls} ring-2 ring-offset-1 ring-current`
                                : "border-border bg-card text-muted-foreground hover:bg-muted"
                              }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Campo de observação (aparece se marcado não conforme) */}
                      {resultados[regra.id] === "nao_conforme" && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Descreva a não conformidade
                          </Label>
                          <Textarea
                            className="mt-1 text-sm"
                            rows={2}
                            placeholder="Ex: Corredor com 1,0 m — mínimo exigido é 1,5 m (RDC 50, Tabela 1)"
                            value={observacoes[regra.id] ?? ""}
                            onChange={e => handleObservacao(regra.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Estado vazio — nenhum tipo selecionado */}
        {!tipoSelecionado && !carregando && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                Selecione o tipo de ambiente acima para carregar o checklist de conformidade
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botão salvar (aparece quando há respostas) */}
        {totalRespondidas > 0 && (
          <div className="flex justify-end pb-6">
            <Button
              onClick={() => {
                // TODO: salvar resultados no Supabase (tabela analysis_reports / non_conformities)
                toast({
                  title: "Análise registrada",
                  description: `${totalConformes} conformes · ${totalNaoConformes} não conformes · ${totalNaoAplicavel} N/A`,
                });
              }}
            >
              Salvar análise
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
