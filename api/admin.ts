import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com a service role key (só existe no servidor,
// nunca é exposta ao navegador — sem prefixo VITE_)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Senha simples de administrador. Defina ADMIN_API_SECRET nas
// variáveis de ambiente da Vercel (sem prefixo VITE_).
const ADMIN_SECRET = process.env.ADMIN_API_SECRET;

function verificarSenha(req: VercelRequest, res: VercelResponse): boolean {
  const senhaEnviada = req.headers['x-admin-secret'];
  if (!ADMIN_SECRET || senhaEnviada !== ADMIN_SECRET) {
    res.status(401).json({ erro: 'Não autorizado.' });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!verificarSenha(req, res)) return;

  const { action } = req.method === 'GET' ? req.query : req.body;

  try {
    // ---------- Estatísticas gerais ----------
    if (action === 'stats') {
      const [{ count: totalCadastrados, error: erroCadastros }, { data: metricas, error: erroMetricas }] =
        await Promise.all([
          supabaseAdmin.from('perfis').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('metricas_admin').select('total_contas_deletadas').eq('id', 1).single(),
        ]);

      if (erroCadastros || erroMetricas) {
        throw erroCadastros || erroMetricas;
      }

      return res.status(200).json({
        totalCadastrados: totalCadastrados ?? 0,
        totalContasDeletadas: metricas?.total_contas_deletadas ?? 0,
      });
    }

    // ---------- Busca de usuário (nome, CAU/CREA ou CNPJ) ----------
    if (action === 'buscar') {
      const termo = (req.query.termo as string) || '';
      if (!termo || termo.trim().length < 2) {
        return res.status(400).json({ erro: 'Informe ao menos 2 caracteres para buscar.' });
      }

      const { data, error } = await supabaseAdmin
        .from('perfis')
        .select('id, nome, crea_cau, cnpj, tipo, created_at')
        .or(`nome.ilike.%${termo}%,crea_cau.ilike.%${termo}%,cnpj.ilike.%${termo}%`)
        .limit(20);

      if (error) throw error;

      return res.status(200).json({ resultados: data });
    }

    // ---------- Corrigir CAU/CREA ----------
    if (action === 'atualizar-crea') {
      const { id, novoCreaCau } = req.body;
      if (!id || !novoCreaCau) {
        return res.status(400).json({ erro: 'id e novoCreaCau são obrigatórios.' });
      }

      const { data, error } = await supabaseAdmin
        .from('perfis')
        .update({ crea_cau: novoCreaCau })
        .eq('id', id)
        .select('id, nome, crea_cau')
        .single();

      if (error) throw error;

      return res.status(200).json({ perfil: data });
    }

    return res.status(400).json({ erro: 'Ação inválida.' });
  } catch (erro: any) {
    console.error('Erro no endpoint admin:', erro);
    return res.status(500).json({ erro: 'Erro interno ao processar a solicitação.' });
  }
}
