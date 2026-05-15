import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      setProfile(p);
    });
  }, []);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      nome: profile.nome, telefone: profile.telefone, crea_cau: profile.crea_cau,
      registro_profissional: profile.registro_profissional, razao_social: profile.razao_social,
      nome_fantasia: profile.nome_fantasia, cnpj: profile.cnpj, responsavel_tecnico: profile.responsavel_tecnico,
    }).eq("id", profile.id);
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Perfil atualizado");
  };

  if (!profile) return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-1">Configurações</h1>
      <p className="text-sm text-muted-foreground mb-8">Dados do seu perfil profissional.</p>
      <Card className="glass p-6 space-y-4">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tipo: {profile.tipo_usuario}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome</Label><Input value={profile.nome || ""} onChange={(e) => setProfile({ ...profile, nome: e.target.value })} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={profile.telefone || ""} onChange={(e) => setProfile({ ...profile, telefone: e.target.value })} /></div>
          <div className="space-y-2"><Label>CREA / CAU</Label><Input value={profile.crea_cau || ""} onChange={(e) => setProfile({ ...profile, crea_cau: e.target.value })} /></div>
          <div className="space-y-2"><Label>Registro profissional</Label><Input value={profile.registro_profissional || ""} onChange={(e) => setProfile({ ...profile, registro_profissional: e.target.value })} /></div>
          {profile.tipo_usuario === "empresa" && (
            <>
              <div className="space-y-2"><Label>Razão social</Label><Input value={profile.razao_social || ""} onChange={(e) => setProfile({ ...profile, razao_social: e.target.value })} /></div>
              <div className="space-y-2"><Label>Nome fantasia</Label><Input value={profile.nome_fantasia || ""} onChange={(e) => setProfile({ ...profile, nome_fantasia: e.target.value })} /></div>
              <div className="space-y-2"><Label>CNPJ</Label><Input value={profile.cnpj || ""} onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })} /></div>
              <div className="space-y-2"><Label>Responsável técnico</Label><Input value={profile.responsavel_tecnico || ""} onChange={(e) => setProfile({ ...profile, responsavel_tecnico: e.target.value })} /></div>
            </>
          )}
        </div>
        <Button onClick={save} disabled={loading}>Salvar alterações</Button>
      </Card>
    </div>
  );
}
