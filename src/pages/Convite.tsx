import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

type Status = 'carregando' | 'valido' | 'expirado' | 'invalido' | 'erro';

interface ConviteInfo {
  nome?: string;
  email?: string;
}

export default function Convite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('carregando');
  const [info, setInfo] = useState<ConviteInfo>({});

  useEffect(() => {
    if (!token) {
      setStatus('invalido');
      return;
    }

    let ativo = true;

    fetch(`/api/validar-convite?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ativo) return;

        if (data.valido) {
          setInfo({ nome: data.nome, email: data.email });
          setStatus('valido');
        } else if (data.motivo === 'expirado') {
          setStatus('expirado');
        } else {
          setStatus('invalido');
        }
      })
      .catch(() => {
        if (ativo) setStatus('erro');
      });

    return () => {
      ativo = false;
    };
  }, [token]);

  const irParaCadastro = () => {
    // O token e o e-mail seguem na URL para o /signup poder revalidar o
    // convite no servidor mais pra frente (o passo "proteger o cadastro
    // contra acesso direto" do plano, ainda não implementado).
    navigate(
      `/signup?convite=${encodeURIComponent(token ?? '')}&email=${encodeURIComponent(
        info.email ?? ''
      )}`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md rounded-xl border border-primary/10 bg-background shadow-lg p-8 text-center">
        {status === 'carregando' && (
          <>
            <div className="mx-auto mb-4 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground/70">Verificando seu convite...</p>
          </>
        )}

        {status === 'valido' && (
          <>
            <h1 className="text-xl font-semibold text-primary mb-2">
              {info.nome ? `Olá, ${info.nome}!` : 'Convite confirmado!'}
            </h1>
            <p className="text-foreground/70 mb-6">
              Seu acesso ao teste beta do VISAcheck GO está liberado. Continue para criar sua
              conta.
            </p>
            <button
              onClick={irParaCadastro}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:opacity-90 transition"
            >
              Continuar para o cadastro
            </button>
          </>
        )}

        {status === 'expirado' && (
          <>
            <h1 className="text-xl font-semibold text-primary mb-2">Este link expirou</h1>
            <p className="text-foreground/70">
              Seu convite para o teste do VISAcheck GO já passou do prazo de 7 dias. Entre em
              contato para receber um novo link.
            </p>
          </>
        )}

        {(status === 'invalido' || status === 'erro') && (
          <>
            <h1 className="text-xl font-semibold text-primary mb-2">Link inválido</h1>
            <p className="text-foreground/70">
              Não encontramos esse convite. Verifique se copiou o link completo ou entre em
              contato para receber um novo.
            </p>
          </>
        )}

        <div className="mt-6">
          <Link to="/" className="text-sm text-foreground/40 hover:text-foreground/70">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}