ï»¿import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight } from "lucide-react";

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conviteToken = searchParams.get("convite") ?? "";
  const [tab, setTab] = useState<"profissional" | "empresa">("profissional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // profissional
  const [nome, setNome] = useState("");
  const [conselho, setConselho] = useState("");
  // empresa
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [responsavel, setResponsavel] = useState("");
  // comuns
  // PrÃ©-preenchido quando a pessoa chega pelo link de convite
  // (/convite/:token -> /signup?convite=...&email=...)
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // LGPD â€” consentimento especÃ­fico para transferÃªncia internacional de dados
  const [aceiteLGPD, setAceiteLGPD] = useState(false);
  const VERSAO_TERMOS = "2026-06-29"; // deve bater com ULTIMA_ATUALIZACAO em Termos.tsx/Privacidade.tsx

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas nÃ£o coincidem.");
      return;
    }
    if (!aceiteLGPD) {
      setError("Ã‰ necessÃ¡rio aceitar os Termos de Uso e a PolÃ­tica de Privacidade para continuar.");
      return;
    }
    setLoading(true);
    const metadata =
      tab === "profissional"
        ? {
            tipo_usuario: "profissional",
            nome,
            crea_cau: conselho.trim(),
            // EvidÃªncia de consentimento LGPD (Art. 33, VIII) â€” registrado no
            // momento do cadastro, com timestamp e versÃ£o dos Termos aceitos,
            // para servir de comprovaÃ§Ã£o em caso de auditoria/fiscalizaÃ§Ã£o.
            consentimento_lgpd: true,
            consentimento_lgpd_data: new Date().toISOString(),
            consentimento_lgpd_versao: VERSAO_TERMOS,
            convite_token: conviteToken,
          }
        : {
            tipo_usuario: "empresa",
            razao_social: razaoSocial,
            cnpj: cnpj.trim(),
            responsavel_tecnico: responsavel,
            consentimento_lgpd: true,
            consentimento_lgpd_data: new Date().toISOString(),
            consentimento_lgpd_versao: VERSAO_TERMOS,
            convite_token: conviteToken,
          };

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: metadata,
      },
    });
    setLoading(false);
    if (signUpError) {
      // O bloqueio de convite acontece no banco (trigger em auth.users);
      // a mensagem exata que chega aqui pode variar, entÃ£o tratamos
      // qualquer erro nesse fluxo com convite de forma amigÃ¡vel.
      if (!conviteToken || /convite/i.test(signUpError.message)) {
        setError(
          "NÃ£o foi possÃ­vel confirmar seu convite. Ele pode ter expirado â€” entre em contato para receber um novo."
        );
      } else {
        setError(signUpError.message);
      }
      return;
    }
    setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
    setTimeout(() => navigate("/login"), 2500);
  };

  // Durante o teste fechado, sÃ³ se cadastra quem chega com um link de
  // convite vÃ¡lido (/convite/:token -> /signup?convite=...). A checagem
  // de verdade acontece no banco (trigger em auth.users); isto aqui Ã© sÃ³
  // para nÃ£o deixar a pessoa preencher o formulÃ¡rio Ã  toa.
  if (!conviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-xl text-center">
          <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Cadastro por convite
          </h1>
          <p className="text-sm text-muted-foreground">
            O VISAcheck GO estÃ¡ em teste fechado no momento. Para se cadastrar,
            vocÃª precisa de um link de convite. Entre em contato para
            solicitar o seu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-1 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            VISAcheck GO
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-center mb-6">
            Criar sua conta
          </h1>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {(["profissional", "empresa"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                className={
                  "text-xs font-semibold uppercase tracking-wider py-2.5 rounded-md border transition-colors duration-200 " +
                  (tab === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-primary border-border hover:border-primary/40")
                }
              >
                {t === "profissional" ? "Profissional" : "Empresa"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {tab === "profissional" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conselho">NÃºmero do Conselho</Label>
                  <Input
                    id="conselho"
                    placeholder="CREA 1234-5 ou CAU 1234-5"
                    value={conselho}
                    onChange={(e) => setConselho(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="razao">RazÃ£o Social</Label>
                  <Input
                    id="razao"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    inputMode="numeric"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    maxLength={18}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">ResponsÃ¡vel TÃ©cnico</Label>
                  <Input
                    id="responsavel"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <PasswordInput
                id="confirm"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {/* Consentimento LGPD â€” especÃ­fico, em destaque, mencionando a
                transferÃªncia internacional de dados (Art. 33, VIII da LGPD) */}
            <div className="flex items-start gap-3 bg-muted border border-border rounded-lg p-3.5">
              <input
                id="aceiteLGPD"
                type="checkbox"
                checked={aceiteLGPD}
                onChange={(e) => setAceiteLGPD(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary flex-shrink-0 cursor-pointer"
              />
              <Label htmlFor="aceiteLGPD" className="text-xs font-normal leading-relaxed text-muted-foreground cursor-pointer">
                Li e aceito os{" "}
                <Link to="/termos" target="_blank" className="text-primary hover:underline">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
                  PolÃ­tica de Privacidade
                </Link>
                , e estou ciente de que dados do meu projeto podem ser{" "}
                <strong className="text-foreground/80">transferidos para servidores
                fora do Brasil</strong> (incluindo provedores de inteligÃªncia
                artificial) para a realizaÃ§Ã£o da anÃ¡lise regulatÃ³ria.
              </Label>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-success text-center">{success}</p>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              variant="default"
              disabled={loading || !aceiteLGPD}
            >
              {loading ? "Criando..." : "Criar conta"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          JÃ¡ tem conta?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}