import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
}

/**
 * Define <title> e <meta name="description"> por página.
 * Sem dependência externa (react-helmet etc) — só useEffect direto no <head>.
 *
 * IMPORTANTE (leia antes de confiar 100% em SEO orgânico):
 * Este é um SPA Vite/React puro (client-side rendering). O Google hoje
 * consegue indexar conteúdo renderizado via JS na maioria dos casos, mas
 * com atraso e menos confiabilidade do que HTML pré-renderizado (SSR/SSG).
 * Se o SEO de cauda longa (artigos respondendo "RDC-50 área mínima
 * consultório" etc) virar canal sério de aquisição, vale considerar migrar
 * essas páginas de marketing para pré-renderização estática (ex: um plugin
 * de prerender no Vite, ou mover só o marketing pra Next.js/Astro) — isso
 * fica pra depois, não é bloqueante pra lançar agora.
 */
export function SEO({ title, description }: SEOProps) {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);

  return null;
}
