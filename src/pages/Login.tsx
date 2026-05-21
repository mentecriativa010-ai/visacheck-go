import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profissional" | "empresa">("profissional");
  const [conselho, setConselho] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
      setError("Email ainda não confirmado. Verifique sua caixa de entrada.");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const conselhoNorm = conselho.trim().toUpperCase();
    const cnpjNorm = cnpj.trim();

    const { data: emailData, error: lookupError } = await supabase.rpc(
      "get_email_by_credentials" as never,
      {
        _crea_cau: tab === "profissional" ? conselhoNorm : "",
        _cnpj: tab === "empresa" ? cnpjNorm : "",
      } as never,
    );
    if (lookupError || !emailData) {
      setLoading(false);
      setError(
        tab === "profissional"
          ? "Conselho não encontrado."
          : "CNPJ não encontrado.",
      );
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailData as string,
      password,
    });
    setLoading(false);
    if (signInError) {
      if (signInError.message.toLowerCase().includes("not confirmed")) {
        setError("Email ainda não confirmado. Verifique sua caixa de entrada.");
      } else {
        setError("Senha incorreta.");
      }
      return;
    }
    navigate("/dashboard");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      setResetSent(false);
      setError(error.message);
    } else {
      setResetSent(true);
      setError("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-1 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 z-10">
        <div className="flex items-center justify-center gap-3 mb-10">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            VISAcheck GO
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-center mb-6">
            Acesse sua conta
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

          <form onSubmit={handleLogin} className="space-y-4">
            {tab === "profissional" ? (
              <div className="space-y-2">
                <Label htmlFor="conselho">Número do Conselho</Label>
                <Input
                  id="conselho"
                  type="text"
                  placeholder="CREA-GO 12345 ou CAU-GO 12345"
                  value={conselho}
                  onChange={(e) => setConselho(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                <Input
                  id="cnpj"
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  maxLength={18}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setForgotOpen(true);
                  setResetEmail("");
                  setResetSent(false);
                  setError("");
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              variant="default"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta?{" "}
          <Link
            to="/signup"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Cadastre-se
          </Link>
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle >Redefinir senha</DialogTitle>
            <DialogDescription>
              Insira seu email e enviaremos um link para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                Verifique seu email para redefinir a senha.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <DialogFooter>
                <Button type="submit" variant="default" disabled={resetLoading}>
                  {resetLoading ? "Enviando..." : "Enviar link de redefinição"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
