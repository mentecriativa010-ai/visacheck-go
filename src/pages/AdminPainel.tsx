import { useState, useEffect, useCallback } from 'react';

// Ajuste este import se o caminho do seu hook de tema for diferente
// import { useTheme } from '@/hooks/useTheme';

interface Estatisticas {
  totalCadastrados: number;
  totalContasDeletadas: number;
}

interface ResultadoBusca {
  id: string;
  nome: string;
  email: string;
  crea_cau: string;
  created_at: string;
}

const CHAVE_SESSAO = 'visacheck_admin_secret';

async function chamarApiAdmin(action: string, senha: string, opcoes: RequestInit = {}) {
  const url = new URL('/api/admin', window.location.origin);
  url.searchParams.set('action', action);

  const resposta = await fetch(url.toString(), {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': senha,
      ...(opcoes.headers || {}),
    },
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados?.erro || 'Erro ao chamar o painel administrativo.');
  }
  return dados;
}

export default function AdminPainel() {
  const [senha, setSenha] = useState<string>(() => sessionStorage.getItem(CHAVE_SESSAO) || '');
  const [autenticado, setAutenticado] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [carregandoStats, setCarregandoStats] = useState(false);

  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [edicaoId, setEdicaoId] = useState<string | null>(null);
  const [novoCreaCau, setNovoCreaCau] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const carregarStats = useCallback(async (senhaAtual: string) => {
    setCarregandoStats(true);
    try {
      const dados = await chamarApiAdmin('stats', senhaAtual);
      setStats(dados);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: erro.message });
    } finally {
      setCarregandoStats(false);
    }
  }, []);

  useEffect(() => {
    if (senha) {
      chamarApiAdmin('stats', senha)
        .then((dados) => {
          setStats(dados);
          setAutenticado(true);
        })
        .catch(() => {
          sessionStorage.removeItem(CHAVE_SESSAO);
          setSenha('');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErroLogin('');
    chamarApiAdmin('stats', senhaDigitada)
      .then((dados) => {
        sessionStorage.setItem(CHAVE_SESSAO, senhaDigitada);
        setSenha(senhaDigitada);
        setStats(dados);
        setAutenticado(true);
      })
      .catch(() => setErroLogin('Senha incorreta.'));
  }

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (termoBusca.trim().length < 2) return;
    setBuscando(true);
    setMensagem(null);
    try {
      const url = new URL('/api/admin', window.location.origin);
      url.searchParams.set('action', 'buscar');
      url.searchParams.set('termo', termoBusca.trim());
      const resposta = await fetch(url.toString(), {
        headers: { 'x-admin-secret': senha },
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados?.erro);
      setResultados(dados.resultados || []);
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: erro.message || 'Erro ao buscar.' });
    } finally {
      setBuscando(false);
    }
  }

  function iniciarEdicao(item: ResultadoBusca) {
    setEdicaoId(item.id);
    setNovoCreaCau(item.crea_cau);
    setMensagem(null);
  }

  async function salvarCreaCau(id: string) {
    if (!novoCreaCau.trim()) return;
    setSalvando(true);
    try {
      const dados = await chamarApiAdmin('atualizar-crea', senha, {
        method: 'POST',
        body: JSON.stringify({ id, novoCreaCau: novoCreaCau.trim() }),
      });
      setResultados((atual) =>
        atual.map((r) => (r.id === id ? { ...r, crea_cau: dados.perfil.crea_cau } : r))
      );
      setEdicaoId(null);
      setMensagem({ tipo: 'sucesso', texto: 'CAU/CREA atualizado com sucesso.' });
    } catch (erro: any) {
      setMensagem({ tipo: 'erro', texto: erro.message });
    } finally {
      setSalvando(false);
    }
  }

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-[#1E3A5F] dark:text-white mb-1">
            Painel administrativo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Acesso restrito.
          </p>
          <input
            type="password"
            value={senhaDigitada}
            onChange={(e) => setSenhaDigitada(e.target.value)}
            placeholder="Senha de administrador"
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            autoFocus
          />
          {erroLogin && <p className="text-sm text-red-600 mb-3">{erroLogin}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-[#1E3A5F] text-white text-sm font-medium py-2 hover:opacity-90 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-semibold text-[#1E3A5F] dark:text-white mb-6">
          Painel administrativo
        </h1>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total cadastrados</p>
            <p className="text-3xl font-semibold text-[#1E3A5F] dark:text-white mt-1">
              {carregandoStats ? '—' : stats?.totalCadastrados ?? '—'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Contas deletadas</p>
            <p className="text-3xl font-semibold text-[#1E3A5F] dark:text-white mt-1">
              {carregandoStats ? '—' : stats?.totalContasDeletadas ?? '—'}
            </p>
          </div>
        </div>
        <button
          onClick={() => carregarStats(senha)}
          className="text-sm text-[#1E3A5F] dark:text-blue-300 underline mb-8"
        >
          Atualizar números
        </button>

        {/* Busca e correção de CAU/CREA */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-sm font-semibold text-[#1E3A5F] dark:text-white mb-3">
            Corrigir CAU/CREA de um profissional
          </h2>
          <form onSubmit={handleBuscar} className="flex gap-2 mb-4">
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou CAU/CREA"
              className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
            <button
              type="submit"
              disabled={buscando}
              className="rounded-md bg-[#1E3A5F] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {buscando ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {mensagem && (
            <p
              className={`text-sm mb-3 ${
                mensagem.tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {mensagem.texto}
            </p>
          )}

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {resultados.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {item.nome}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.email}
                  </p>
                </div>

                {edicaoId === item.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={novoCreaCau}
                      onChange={(e) => setNovoCreaCau(e.target.value)}
                      className="w-32 rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                    />
                    <button
                      onClick={() => salvarCreaCau(item.id)}
                      disabled={salvando}
                      className="text-sm text-white bg-[#1E3A5F] rounded-md px-3 py-1 hover:opacity-90 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEdicaoId(null)}
                      className="text-sm text-slate-500 dark:text-slate-400"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {item.crea_cau}
                    </span>
                    <button
                      onClick={() => iniciarEdicao(item)}
                      className="text-sm text-[#1E3A5F] dark:text-blue-300 underline"
                    >
                      Corrigir
                    </button>
                  </div>
                )}
              </div>
            ))}
            {resultados.length === 0 && termoBusca && !buscando && (
              <p className="text-sm text-slate-400 py-3">Nenhum resultado encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
