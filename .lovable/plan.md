## SanitaryAI — MVP Etapa 1

Este é um escopo grande (substitui completamente a landing page atual por um SaaS). Vou implementar o MVP em uma sequência objetiva, mantendo arquitetura escalável.

### Decisões iniciais
- **Backend**: ativar **Lovable Cloud** (auth + Postgres + Storage).
- **Identidade visual**: dark premium, grafite/azul profundo, accent cyan tecnológico, glassmorphism discreto, tipografia Inter + JetBrains Mono. (Já definida pelo briefing, sem perguntas.)
- **Landing page atual**: será arquivada — a nova rota `/` vira marketing curto com CTA para `/login` e `/signup`; o app fica em `/app/*` protegido.

### Estrutura de rotas
```
/                       → landing curta (hero + CTA login/signup)
/login, /signup         → auth (profissional ou empresa, tabs)
/forgot-password, /reset-password
/app/dashboard          → KPIs, gráficos, histórico
/app/projects           → lista + upload drag-drop
/app/projects/:id       → viewer PDF + painel de inconformidades
/app/projects/:id/report → relatório técnico + exportar PDF
/app/settings           → perfil
```

### Modelo de dados (Lovable Cloud)
- `profiles` (espelha auth.users): tipo_usuario, nome, telefone, crea_cau, registro_profissional, cnpj, empresa, razao_social, nome_fantasia, responsavel_tecnico, email_corporativo
- `user_roles` + enum `app_role` (`admin`, `user`) + função `has_role` (padrão seguro de roles)
- `projetos`: usuario_id, nome_projeto, tipo_arquivo, arquivo_url, arquivo_path, status (`pendente|analisando|aprovado|parcial|reprovado`), score_conformidade, created_at
- `analises`: projeto_id, norma, descricao_problema, sugestao, severidade (`critico|atencao|conforme`), coordenada_x, coordenada_y, pagina
- `relatorios`: projeto_id, relatorio_pdf (url), status_final, gerado_em
- **Storage bucket** `projetos` (privado) com RLS por `auth.uid()`
- RLS em todas as tabelas: usuário só vê o que é seu; admin vê tudo via `has_role`

### Engine simulada de análise
Trigger ao criar projeto: client-side gera 3–7 marcações pseudo-aleatórias com base num catálogo fixo (largura de porta, lavatório ausente, fluxo cruzado, sanitário PCD, ventilação, CME) associadas às normas (RDC 50/63/15/51, NBR 9050, COE Goiânia, SUVISA-GO). Calcula score = 100 − Σ pesos. Insere linhas em `analises` e atualiza `projetos.status`/`score`. Estrutura encapsulada em `src/lib/analysisEngine.ts` para troca futura por IA real.

### Viewer + Relatório
- Viewer PDF: `react-pdf` com zoom/pan, overlay absoluto de marcações (pontos coloridos) clicáveis → sheet lateral com norma/descrição/sugestão.
- Relatório: página HTML imprimível (`window.print()` com `@media print`) com resumo, score circular (Recharts), tabela de inconformidades, classificação final. Exportar PDF = print-to-PDF do navegador (suficiente para MVP, sem dependência extra).

### Dashboard
KPIs (cards): total, aprovados, pendentes, com inconformidades, score médio. Gráfico de barras (status por mês) e donut (distribuição de severidade) com Recharts. Lista dos 5 projetos recentes.

### Design system
- Atualizar `index.css` + `tailwind.config.ts` com nova paleta dark (HSL): background grafite, surface translúcida, accent cyan, danger, warning, success.
- Tipografia: Inter (UI) + JetBrains Mono (números/códigos de norma). Remover Playfair.
- Componentes shadcn já disponíveis; criar `AppShell` com sidebar minimalista + topbar.
- Framer Motion para fades sutis em página/cards.

### Stack adicional a instalar
`react-pdf`, `pdfjs-dist`, `react-dropzone`, `framer-motion` (verificar), `recharts` (verificar), `date-fns`.

### Sequência de execução
1. Ativar Lovable Cloud.
2. Migrations: enum, tabelas, RLS, trigger de profile, bucket storage + policies.
3. Atualizar design system (cores, fontes, AppShell).
4. Auth: páginas login/signup (tabs Profissional/Empresa), forgot/reset, `ProtectedRoute`, `useAuth` hook com `onAuthStateChange`.
5. Dashboard com KPIs + gráficos.
6. Upload (dropzone → Storage → insert projeto → roda engine simulada).
7. Lista de projetos + página de detalhe (viewer PDF + marcações).
8. Página de relatório imprimível.
9. Substituir `Index.tsx` por landing curta com CTAs.
10. Smoke test no preview.

### Fora desta etapa (conforme briefing)
DWG real, AutoCAD Web, IA real/OpenAI, BIM, APIs governamentais, multiempresa avançado.

### Observação de escopo
Isso é um app grande — vou entregar a estrutura completa e funcional, mas algumas telas (ex.: settings) ficam mínimas. Avise se quiser priorizar algo diferente antes de eu começar.