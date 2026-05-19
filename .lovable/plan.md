## Motor Regulatório Computável — Camada Estrutural

Construir a fundação de dados + lógica que transforma o SanitaryAI de viewer para motor regulatório. Sem alterações visuais.

### 1. Banco de dados (migração Supabase)

Novas tabelas (com RLS):

- `ambientes` — catálogo de tipos de ambiente (sanitario_pcd, cme, expurgo, consultorio, circulacao, recepcao, esterilizacao, area_limpa, area_contaminada...). Seed inicial. Leitura pública autenticada.
- `regras_regulatorias` — regras computáveis. Campos: `codigo`, `nome`, `norma`, `categoria` (enum), `ambiente_aplicavel` (text[]), `tipo_validacao` (enum: dimensional, presencial, fluxo, barreira, ventilacao), `parametros` (jsonb: min/max/unidade/operador), `severidade` (enum), `descricao`, `sugestao_corretiva`, `ativa`. Leitura pública autenticada; escrita apenas admin.
- `entidades_arquitetonicas` — entidades extraídas de um projeto. Campos: `projeto_id`, `tipo` (porta, parede, corredor, sanitario...), `ambiente`, `coord_x`, `coord_y`, `largura`, `altura`, `pagina`, `metadados` (jsonb). RLS via `projeto_id`.
- `validacoes` — resultado regra × entidade. Campos: `projeto_id`, `regra_id`, `entidade_id`, `status` (conforme/parcial/inconforme/na), `severidade_efetiva`, `valor_observado`, `detalhes` (jsonb). RLS via `projeto_id`.
- `scores` — snapshot por projeto. Campos: `projeto_id`, `score_geral`, `score_por_norma` (jsonb), `score_por_ambiente` (jsonb), `score_acessibilidade`, `score_fluxo`, `calculado_em`. RLS via `projeto_id`.
- `pareceres` — parecer técnico gerado. Campos: `projeto_id`, `status_final` (aprovado/parcial/revisao/reprovado), `risco_sanitario`, `impacto_regulatorio`, `resumo_executivo`, `checklist` (jsonb), `gerado_em`. RLS via `projeto_id`.

Enums novos: `regra_categoria`, `regra_severidade` (informativo/atencao/critico/bloqueante), `regra_tipo_validacao`, `validacao_status`, `parecer_status`.

Seed: ~15 regras iniciais cobrindo NBR 9050 (porta 80cm, circulação 1,20m, sanitário PCD), RDC 50 (corredor 2m em hospital, ventilação CME, fluxo limpo/sujo), RDC 15 (barreira CME, expurgo separado), RDC 63, RDC 51.

### 2. Camada TypeScript do motor

Estrutura modular em `src/lib/regulatory/`:

```text
src/lib/regulatory/
  types.ts              entidades, regras, severidade, status, parecer
  catalog/
    ambientes.ts        catálogo tipado
    normas.ts           RDC 50, 15, 63, 51, NBR 9050, VISA/SUVISA-GO
    categorias.ts       acessibilidade, fluxo_sanitario, dimensional, ventilacao,
                        funcional, estrutural, biosseguranca, operacao, esterilizacao
  rules/
    index.ts            registry + loader do Supabase
    validators.ts       validadores por tipo (dimensional, presencial, fluxo...)
  engine/
    regulatoryEngine.ts orquestrador: entidades + regras → validações
    scoring.ts          score geral, por norma, por ambiente, acessibilidade, fluxo
    parecer.ts          gera parecer (status, risco, resumo)
    checklist.ts        checklist regulatório por norma
  workflow/
    pipeline.ts         etapas: upload → parsing → análise → validação → revisão → relatório
  adapters/
    README.md           contratos futuros: OCR, IA Vision, Forge, DWG, BIM/IFC, Revit
    parser.contract.ts  interface ParserAdapter (não implementado, só tipos)
```

`regulatoryEngine.ts` exporta `runAnalysis(projetoId)` que: carrega entidades + regras aplicáveis, executa validators, persiste validações, calcula score, gera parecer e checklist. Tudo idempotente.

### 3. Pontos NÃO alterados

- Identidade visual, landing, dark premium, workspace e UX permanecem intactos.
- Nenhuma página ou componente é redesenhado.
- Adapters de OCR/Vision/Forge/DWG/BIM/IFC ficam apenas como interfaces TypeScript (preparação, sem implementação).

### 4. Ordem de execução

1. Migração Supabase (tabelas, enums, RLS, seed de regras + ambientes).
2. Tipos + catálogos (`types.ts`, `catalog/*`).
3. Validators + registry de regras.
4. Engine (run, scoring, parecer, checklist, pipeline).
5. Contratos de adapters futuros.

### 5. Detalhes técnicos

- Severidade → peso: informativo 0, atencao 5, critico 15, bloqueante 40. Score = max(0, 100 − Σ pesos).
- Parecer: bloqueante presente → reprovado; críticos > 3 → revisão; críticos 1-3 → parcialmente conforme; só atenção/informativo → aprovado.
- Validators puros (entidade + parametros → status), facilitando testes.
- Tudo client-side por ora (sem edge function), chamando Supabase via SDK existente. Engine preparada para mover para edge function depois.