import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const VERSAO_TERMOS = "2026-06-29"; // deve bater com ULTIMA_ATUALIZACAO em Termos.tsx

export default function Consentimento() {
  const navigate = useNavigate();
  const [aceite, setAceite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAceitar = async () => {
    if (!aceite) {
      setError("É necessário aceitar os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setLoading(true);
    setError("");

    // Lê o metadata atual pra não sobrescrever campos existentes (nome, crea_cau, etc.)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Erro ao carregar dados do usuário. Tente fazer login novamente.");
      setLoading(false);
      return;
    }

    // Atualiza metadata adicionando o consentimento com timestamp e versão,
    // preservando todos os outros campos já existentes
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        consentimento_lgpd: true,
        consentimento_lgpd_data: new Date().toISOString(),
        consentimento_lgpd_versao: VERSAO_TERMOS,
      },
    });

    setLoading(false);
    if (updateError) {
      setError("Não foi possível salvar o consentimento. Tente novamente.");
      return;
    }

    navigate("/dashboard");
  };

  const handleRecusar = async () => {
    // Se o usuário recusar, faz logout e volta pro login
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
      {/* Efeito de fundo — igual ao Login e Signup */}
      <div className="absolute inset-1 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-lg px-6 z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            VISAcheck GO
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-xl space-y-6">

          {/* Cabeçalho */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Atualização dos nossos Termos
            </h1>
            <p className="text-sm text-muted-foreground">
              Atualizamos nossa Política de Privacidade e Termos de Uso para
              adequação à <strong className="text-foreground">LGPD (Lei nº 13.709/2018)</strong>.
              É necessário aceitar para continuar usando o VISAcheck GO.
            </p>
          </div>

          {/* Aviso em destaque — transferência internacional */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Informação importante
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Para realizar a análise regulatória, trechos dos projetos enviados são
              processados por <strong>modelos de inteligência artificial</strong> de
              terceiros (Google, OpenAI, NVIDIA via OpenRouter), cujos servidores estão
              localizados predominantemente <strong>fora do Brasil</strong>. Isso configura
              uma transferência internacional de dados nos termos do Art. 33 da LGPD.
            </p>
          </div>

          {/* Links para leitura */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/termos"
              target="_blank"
              className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 flex-1 transition-colors hover:bg-primary/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ler Termos de Uso
            </Link>
            <Link
              to="/privacidade"
              target="_blank"
              className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 flex-1 transition-colors hover:bg-primary/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ler Política de Privacidade
            </Link>
          </div>

          {/* Checkbox de consentimento */}
          <div className="flex items-start gap-3 bg-muted border border-border rounded-lg p-3.5">
            <input
              id="aceite"
              type="checkbox"
              checked={aceite}
              onChange={(e) => {
                setAceite(e.target.checked);
                if (e.target.checked) setError("");
              }}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary flex-shrink-0 cursor-pointer"
            />
            <Label
              htmlFor="aceite"
              className="text-xs font-normal leading-relaxed text-muted-foreground cursor-pointer"
            >
              Li e aceito os{" "}
              <Link to="/termos" target="_blank" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              , e estou ciente de que dados do meu projeto podem ser{" "}
              <strong className="text-foreground/80">
                transferidos para servidores fora do Brasil
              </strong>{" "}
              (incluindo provedores de inteligência artificial) para a realização
              da análise regulatória.
            </Label>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Botões */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAceitar}
              className="w-full gap-2"
              variant="default"
              disabled={loading || !aceite}
            >
              {loading ? "Salvando..." : "Aceitar e continuar"}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              type="button"
              onClick={handleRecusar}
              disabled={loading}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center underline underline-offset-4"
            >
              Não aceitar e sair da conta
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
