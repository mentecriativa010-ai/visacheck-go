import { useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const location = useLocation();

  async function enviarFeedback() {
    if (!mensagem.trim()) return;
    setEnviando(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("feedbacks").insert({
      user_id: userData.user?.id,
      pagina: location.pathname,
      mensagem: mensagem.trim(),
    });

    setEnviando(false);

    if (!error) {
      setEnviado(true);
      setMensagem("");
      setTimeout(() => {
        setEnviado(false);
        setOpen(false);
      }, 1500);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-slate-900 text-white px-4 py-3 shadow-lg hover:bg-slate-700 transition-colors"
      >
        Enviar feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            {enviado ? (
              <p className="text-center text-slate-700 py-6">
                Feedback enviado. Obrigado!
              </p>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">Deixe seu feedback</h3>
                <p className="text-sm text-slate-500 mb-3">
                  O que funcionou bem, o que travou, o que faria diferenÃ§a.
                </p>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={5}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Escreva aqui..."
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviarFeedback}
                    disabled={enviando || !mensagem.trim()}
                    className="px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
                  >
                    {enviando ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
