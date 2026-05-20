import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hashPresent, setHashPresent] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setHashPresent(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-1 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 z-10">
        <div className="flex items-center justify-center gap-3 mb-10">
          <ShieldCheck className="w-8 h-8 text-gold" />
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            SanitaryAI
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-xl">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <h2 className="text-xl font-display font-semibold text-center">
                Senha redefinida
              </h2>
              <p className="text-center text-sm text-muted-foreground">
                Sua senha foi atualizada com sucesso.
              </p>
              <Button
                variant="gold"
                className="gap-2 mt-2"
                onClick={() => navigate("/login")}
              >
                Ir para o login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-center mb-2 font-display">
                Nova senha
              </h1>
              <p className="text-center text-sm text-muted-foreground mb-6">
                {hashPresent
                  ? "Crie uma nova senha para sua conta."
                  : "Insira uma nova senha para redefinir seu acesso."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  variant="gold"
                  disabled={loading}
                >
                  {loading ? "Redefinindo..." : "Redefinir senha"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
