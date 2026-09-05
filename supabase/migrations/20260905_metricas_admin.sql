-- ============================================================
-- Migração: métricas administrativas (cadastros e exclusões)
-- Rodar no Supabase Studio > SQL Editor
-- ============================================================

-- Tabela de métricas com uma única linha (id fixo = 1)
CREATE TABLE IF NOT EXISTS metricas_admin (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_contas_deletadas INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT metricas_admin_unica_linha CHECK (id = 1)
);

INSERT INTO metricas_admin (id, total_contas_deletadas)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Função que soma +1 no contador sempre que um perfil é apagado
-- Não guarda nome, CAU/CREA, e-mail nem qualquer outro dado da conta apagada
CREATE OR REPLACE FUNCTION incrementar_contador_contas_deletadas()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE metricas_admin
  SET total_contas_deletadas = total_contas_deletadas + 1,
      atualizado_em = NOW()
  WHERE id = 1;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: dispara em QUALQUER exclusão de linha em "perfis",
-- seja pelo botão "excluir conta" do usuário, seja manual no Supabase Studio
DROP TRIGGER IF EXISTS trigger_conta_deletada ON perfis;
CREATE TRIGGER trigger_conta_deletada
AFTER DELETE ON perfis
FOR EACH ROW
EXECUTE FUNCTION incrementar_contador_contas_deletadas();

-- RLS: bloqueia leitura/escrita direta pelo cliente (anon/authenticated).
-- Só a service role (usada nas suas funções server-side, api/*.ts) consegue
-- ler essa tabela — a service role ignora RLS por padrão.
ALTER TABLE metricas_admin ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy é criada de propósito: sem policy = acesso negado para
-- anon/authenticated, e a service role continua funcionando normalmente.
