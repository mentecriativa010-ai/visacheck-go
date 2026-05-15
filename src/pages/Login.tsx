import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-md bg-primary/20 grid place-items-center glow-ring">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-lg">SanitaryAI</span>
        </Link>
        <Card className="glass p-8">
          <h1 className="text-2xl font-semibold mb-1">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-6">Acesse a plataforma de análise sanitária.</p>
          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Senha</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
              </div>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Não tem conta? <Link to="/signup" className="text-primary hover:underline">Cadastre-se</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
