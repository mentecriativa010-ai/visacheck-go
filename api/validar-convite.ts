import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Mesmas variáveis já usadas em login-lookup.ts — sem prefixo VITE_,
// só acessíveis aqui no servidor.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ valido: false, motivo: 'metodo_nao_permitido' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valido: false, motivo: 'token_ausente' });
  }

  try {
    const { data: convite, error } = await supabase
      .from('convites')
      .select('email, nome, expira_em, usado')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.error('Erro ao consultar convite:', error);
      return res.status(500).json({ valido: false, motivo: 'erro_servidor' });
    }

    if (!convite) {
      return res.status(200).json({ valido: false, motivo: 'nao_encontrado' });
    }

    const expirado = new Date(convite.expira_em).getTime() < Date.now();

    if (expirado) {
      return res.status(200).json({ valido: false, motivo: 'expirado' });
    }

    // Marca como "usado" só na primeira validação — é um registro de
    // acompanhamento (quem chegou a abrir o link), não um bloqueio: a
    // pessoa pode recarregar a página várias vezes dentro do prazo de
    // 7 dias sem que o link pare de funcionar.
    if (!convite.usado) {
      await supabase
        .from('convites')
        .update({ usado: true, usado_em: new Date().toISOString() })
        .eq('token', token);
    }

    return res.status(200).json({
      valido: true,
      nome: convite.nome,
      email: convite.email,
    });
  } catch (err) {
    console.error('Erro inesperado em validar-convite:', err);
    return res.status(500).json({ valido: false, motivo: 'erro_servidor' });
  }
}