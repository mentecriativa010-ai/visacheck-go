import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Enviamos um link de recuperação para o seu email.");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-md bg-primary/20 grid place-items-center glow-ring"><Activity className="h-4 w-4 text-primary" /></div>
          <span className="font-semibold text-lg">SanitaryAI</span>
        </Link>
        <Card className="glass p-8">
          <h1 className="text-2xl font-semibold mb-1">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground mb-6">Informe seu email para receber o link de redefinição.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enviar link
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">
            <Link to="/login" className="text-primary hover:underline">Voltar para login</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
