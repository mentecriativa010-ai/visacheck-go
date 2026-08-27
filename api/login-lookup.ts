import { createClient } from "@supabase/supabase-js";

const LIMITE_TENTATIVAS = 8;
const JANELA_MINUTOS = 10;

function obterClienteSupabase() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient(url, chave);
}

function obterIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "desconhecido";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://visacheck-go.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido." });

  const { creaCau, cnpj } = req.body ?? {};
  if (!creaCau && !cnpj) {
    return res.status(400).json({ error: "Informe CREA/CAU ou CNPJ." });
  }

  const supabase = obterClienteSupabase();
  if (!supabase) return res.status(500).json({ error: "Configuracao do servidor ausente." });

  const ip = obterIP(req);
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000).toISOString();

  const { count, error: erroContagem } = await supabase
    .from("tentativas_login_lookup")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("criado_em", desde);

  if (erroContagem) {
    console.error("[login-lookup] erro ao contar tentativas:", erroContagem);
  } else if ((count ?? 0) >= LIMITE_TENTATIVAS) {
    return res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
  }

  await supabase.from("tentativas_login_lookup").insert({ ip });

  const { data: email, error } = await supabase.rpc("get_email_by_credentials", {
    _crea_cau: creaCau ?? "",
    _cnpj: cnpj ?? "",
  });

  if (error) {
    console.error("[login-lookup] erro na RPC:", error);
    return res.status(500).json({ error: "Erro ao processar login." });
  }

  return res.status(200).json({ email: email ?? null });
}