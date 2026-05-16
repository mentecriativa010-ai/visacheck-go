import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";
import { z } from "zod";

const creaRe = /^[A-Z]{2,3}-?\d{3,7}\/?[A-Z]{0,2}$/i;
const cnpjRe = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

const profSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  profissao: z.enum(["arquiteto", "engenheiro"], { errorMap: () => ({ message: "Selecione sua profissão" }) }),
  email: z.string().trim().email().max(255),
  telefone: z.string().trim().min(8).max(20),
  crea_cau: z.string().trim().regex(creaRe, "Formato CREA/CAU inválido"),
  registro_profissional: z.string().trim().min(2).max(40),
  password: z.string().min(8).max(72),
});
const empSchema = z.object({
  razao_social: z.string().trim().min(2).max(150),
  nome_fantasia: z.string().trim().min(2).max(150),
  cnpj: z.string().trim().regex(cnpjRe, "CNPJ inválido"),
  responsavel_tecnico: z.string().trim().min(2).max(120),
  crea_cau: z.string().trim().regex(creaRe, "Formato CREA/CAU inválido"),
  email_corporativo: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export default function Signup() {
  const [tab, setTab] = useState<"profissional" | "empresa">("profissional");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = tab === "profissional" ? profSchema : empSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const email = tab === "profissional" ? form.email : form.email_corporativo;
    const meta = { ...form, tipo_usuario: tab };
    delete (meta as any).password;
    const { error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/app/dashboard`, data: meta },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cadastro realizado! Verifique seu email para confirmar.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-md bg-primary/20 grid place-items-center glow-ring">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-lg">SanitaryAI</span>
        </Link>
        <Card className="glass p-8">
          <h1 className="text-2xl font-semibold mb-1">Criar conta</h1>
          <p className="text-sm text-muted-foreground mb-6">Acesso exclusivo para arquitetos e engenheiros.</p>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setForm({}); }}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="empresa">Escritório</TabsTrigger>
            </TabsList>
            <form onSubmit={submit} className="space-y-4">
              <TabsContent value="profissional" className="space-y-4 mt-0">
                <Field label="Nome completo" onChange={update("nome")} value={form.nome || ""} />
                <div className="space-y-2">
                  <Label>Profissão</Label>
                  <Select value={form.profissao || ""} onValueChange={(v) => setForm((f) => ({ ...f, profissao: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arquiteto">Arquiteto</SelectItem>
                      <SelectItem value="engenheiro">Engenheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field label="Email" type="email" onChange={update("email")} value={form.email || ""} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Telefone" onChange={update("telefone")} value={form.telefone || ""} />
                  <Field label="CREA / CAU" placeholder="GO-12345" onChange={update("crea_cau")} value={form.crea_cau || ""} />
                </div>
                <Field label="Registro profissional" onChange={update("registro_profissional")} value={form.registro_profissional || ""} />
              </TabsContent>
              <TabsContent value="empresa" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Razão social" onChange={update("razao_social")} value={form.razao_social || ""} />
                  <Field label="Nome fantasia" onChange={update("nome_fantasia")} value={form.nome_fantasia || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CNPJ" placeholder="00.000.000/0000-00" onChange={update("cnpj")} value={form.cnpj || ""} />
                  <Field label="Responsável técnico" onChange={update("responsavel_tecnico")} value={form.responsavel_tecnico || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CREA / CAU do responsável" placeholder="GO-12345" onChange={update("crea_cau")} value={form.crea_cau || ""} />
                  <Field label="Email corporativo" type="email" onChange={update("email_corporativo")} value={form.email_corporativo || ""} />
                </div>
              </TabsContent>
              <Field label="Senha (mín. 8 caracteres)" type="password" onChange={update("password")} value={form.password || ""} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Criar conta
              </Button>
            </form>
          </Tabs>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input required {...props} />
    </div>
  );
}
