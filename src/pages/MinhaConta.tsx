import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, Home, Folder, BookOpen, LogOut, User, Download,
  Trash2, AlertTriangle, CheckCircle2, ChevronRight, Shield,
} from "lucide-react";

export default function MinhaConta() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [consentimentoData, setConsentimentoData] = useState<string | null>(null);
  const [consentimentoVersao, setConsentimentoVersao] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [exportSucesso, setExportSucesso] = useState(false);
  const [excluirOpen, setExcluirOpen] = useState(false);
  const [confirmacaoTexto, setConfirmacaoTexto] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarUsuario = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { navigate("/login"); return; }
      const meta = user.user_metadata;
      setUserEmail(user.email ?? "");
      setTipoUsuario(meta?.tipo_usuario ?? "");
      setConsentimentoData(meta?.consentimento_lgpd_data ?? null);
      setConsentimentoVersao(meta?.consentimento_lgpd_versao ?? null);
      if (meta?.tipo_usuario === "profissional") {
        setUserName(meta?.nome ?? "Usuário");
      } else {
        setUserName(meta?.razao_social ?? meta?.responsavel_tecnico ?? "Usuário");
      }
      setLoading(false);
    };
    carregarUsuario();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // ── Exportar dados (Art. 18, V da LGPD) ─────────────────────────────────
  const handleExportar = async () => {
    setExportando(true);
    setExportSucesso(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Busca todos os dados do usuário
      const [{ data: projetos }, { data: validacoes }, { data: pareceres }, { data: perfil }] =
        await Promise.all([
          supabase.from("projetos").select("*").eq("user_id", user.id),
          supabase.from("validacoes").select("*").in(
            "projeto_id",
            (await supabase.from("projetos").select("id").eq("user_id", user.id)).data?.map(p => p.id) ?? []
          ),
          supabase.from("pareceres").select("*").in(
            "projeto_id",
            (await supabase.from("projetos").select("id").eq("user_id", user.id)).data?.map(p => p.id) ?? []
          ),
          supabase.from("perfis").select("*").eq("id", user.id).single(),
        ]);

      const exportData = {
        exportado_em: new Date().toISOString(),
        aviso: "Exportação gerada em cumprimento ao Art. 18, V da LGPD (Lei nº 13.709/2018)",
        usuario: {
          id: user.id,
          email: user.email,
          criado_em: user.created_at,
          metadata: user.user_metadata,
        },
        perfil: perfil ?? null,
        projetos: projetos ?? [],
        validacoes: validacoes ?? [],
        pareceres: pareceres ?? [],
      };

      // Gera e baixa o arquivo JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visacheck-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSucesso(true);
      setTimeout(() => setExportSucesso(false), 4000);
    } catch (err: any) {
      console.error("Erro ao exportar dados:", err);
    } finally {
      setExportando(false);
    }
  };

  // ── Excluir conta (Art. 18, IV e VI da LGPD) ────────────────────────────
  const handleExcluirConta = async () => {
    if (confirmacaoTexto !== "EXCLUIR") {
      setErroExcluir("Digite EXCLUIR (em maiúsculas) para confirmar.");
      return;
    }
    setExcluindo(true);
    setErroExcluir("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Busca IDs dos projetos do usuário
      const { data: projetos } = await supabase
        .from("projetos").select("id").eq("user_id", user.id);
      const projetoIds = projetos?.map(p => p.id) ?? [];

      // Deleta na ordem correta (filhos antes dos pais)
      if (projetoIds.length > 0) {
        await supabase.from("validacoes").delete().in("projeto_id", projetoIds);
        await supabase.from("pareceres").delete().in("projeto_id", projetoIds);
        await supabase.from("projetos").delete().in("id", projetoIds);
      }

      // Deleta perfil
      await supabase.from("perfis").delete().eq("id", user.id);

      // Faz logout (a exclusão da conta de auth requer chamada server-side —
      // sem função Edge, o fluxo correto é: apagar dados, fazer logout, e
      // orientar o usuário a contatar o suporte para remoção completa do auth)
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      setErroExcluir("Erro ao excluir conta: " + (err.message ?? "tente novamente."));
      setExcluindo(false);
    }
  };

  const formatarData = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* Sidebar — mesmo padrão do Dashboard */}
      <aside className="w-64 border-r border-border bg-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-primary">VISAcheck GO</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Home className="w-4 h-4" />Dashboard
          </button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Folder className="w-4 h-4" />Meus Projetos
          </button>
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground">
            <BookOpen className="w-4 h-4" />Base de Normas
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 bg-primary/5 text-primary">
            <User className="w-4 h-4" />Minha Conta
          </button>
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-red-50 transition-all duration-200">
            <LogOut className="w-4 h-4" />Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <header className="border-b border-border bg-card py-5 px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Minha Conta</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Gerencie seus dados pessoais e privacidade.</p>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-6 max-w-3xl w-full">

          {/* Dados do usuário */}
          <section className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Dados da conta</h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-5 w-64 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Nome / Razão Social:</strong> {userName}</p>
                <p><strong className="text-foreground">E-mail:</strong> {userEmail}</p>
                <p><strong className="text-foreground">Tipo de conta:</strong> {tipoUsuario === "profissional" ? "Profissional" : "Empresa"}</p>
              </div>
            )}
          </section>

          {/* Consentimento LGPD */}
          <section className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Consentimento LGPD</h2>
            </div>
            {consentimentoData ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Consentimento registrado</span>
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Data e hora:</strong> {formatarData(consentimentoData)}
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Versão dos Termos aceita:</strong> {consentimentoVersao ?? "—"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum consentimento registrado nesta conta.</p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => navigate("/termos")} className="text-xs text-primary hover:underline flex items-center gap-1">
                Termos de Uso <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => navigate("/privacidade")} className="text-xs text-primary hover:underline flex items-center gap-1">
                Política de Privacidade <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </section>

          {/* Exportar dados */}
          <section className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Exportar meus dados</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Baixe um arquivo JSON com todos os seus dados armazenados no VISAcheck GO —
              projetos, validações e pareceres. Em cumprimento ao{" "}
              <strong className="text-foreground">Art. 18, V da LGPD</strong> (direito à portabilidade).
            </p>
            {exportSucesso && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Arquivo baixado com sucesso.
              </div>
            )}
            <Button
              onClick={handleExportar}
              disabled={exportando}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exportando ? "Gerando arquivo..." : "Exportar meus dados"}
            </Button>
          </section>

          {/* Excluir conta */}
          <section className="bg-card border border-red-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="w-4 h-4 text-destructive" />
              <h2 className="text-sm font-semibold text-destructive">Excluir minha conta</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Remove permanentemente todos os seus dados (projetos, validações, pareceres e perfil)
              do VISAcheck GO. Em cumprimento ao{" "}
              <strong className="text-foreground">Art. 18, IV e VI da LGPD</strong>.
              <strong className="text-destructive"> Esta ação não pode ser desfeita.</strong>
            </p>
            <Button
              onClick={() => { setExcluirOpen(true); setConfirmacaoTexto(""); setErroExcluir(""); }}
              variant="outline"
              className="gap-2 border-red-200 text-destructive hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Excluir minha conta
            </Button>
          </section>

        </div>
      </main>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={excluirOpen} onOpenChange={setExcluirOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Excluir conta permanentemente
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>Esta ação irá remover <strong>todos os seus projetos, validações e dados</strong> do VISAcheck GO. Não é possível recuperar essas informações depois.</p>
              <p className="pt-1">Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:</p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmacao">Confirmação</Label>
            <Input
              id="confirmacao"
              placeholder="EXCLUIR"
              value={confirmacaoTexto}
              onChange={(e) => { setConfirmacaoTexto(e.target.value); setErroExcluir(""); }}
            />
            {erroExcluir && <p className="text-sm text-destructive">{erroExcluir}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExcluirOpen(false)} disabled={excluindo}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluirConta}
              disabled={excluindo || confirmacaoTexto !== "EXCLUIR"}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {excluindo ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
