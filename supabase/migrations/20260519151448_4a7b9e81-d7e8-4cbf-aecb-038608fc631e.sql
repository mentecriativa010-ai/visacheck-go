
-- ============ ENUMS ============
create type public.regra_categoria as enum (
  'acessibilidade','fluxo_sanitario','dimensional','ventilacao',
  'funcional','estrutural','biosseguranca','operacao','esterilizacao'
);

create type public.regra_severidade as enum (
  'informativo','atencao','critico','bloqueante'
);

create type public.regra_tipo_validacao as enum (
  'dimensional','presencial','fluxo','barreira','ventilacao','area_minima'
);

create type public.validacao_status as enum (
  'conforme','parcial','inconforme','nao_aplicavel'
);

create type public.parecer_status as enum (
  'aprovado','parcialmente_conforme','revisao_necessaria','reprovado'
);

-- ============ TABELAS DE CATÁLOGO ============
create table public.ambientes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  grupo text,
  created_at timestamptz not null default now()
);

alter table public.ambientes enable row level security;

create policy "Ambientes: select authenticated"
  on public.ambientes for select
  to authenticated using (true);

create policy "Ambientes: admin write"
  on public.ambientes for all
  to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create table public.regras_regulatorias (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  norma text not null,
  categoria public.regra_categoria not null,
  ambiente_aplicavel text[] not null default '{}',
  tipo_validacao public.regra_tipo_validacao not null,
  parametros jsonb not null default '{}'::jsonb,
  severidade public.regra_severidade not null,
  descricao text not null,
  sugestao_corretiva text not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.regras_regulatorias enable row level security;

create policy "Regras: select authenticated"
  on public.regras_regulatorias for select
  to authenticated using (true);

create policy "Regras: admin write"
  on public.regras_regulatorias for all
  to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create trigger trg_regras_updated
  before update on public.regras_regulatorias
  for each row execute function public.touch_updated_at();

-- ============ TABELAS POR PROJETO ============
create table public.entidades_arquitetonicas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  tipo text not null,
  ambiente text,
  coord_x numeric not null default 0,
  coord_y numeric not null default 0,
  largura numeric,
  altura numeric,
  pagina integer not null default 1,
  metadados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_entidades_projeto on public.entidades_arquitetonicas(projeto_id);
alter table public.entidades_arquitetonicas enable row level security;

create policy "Entidades: select via projeto"
  on public.entidades_arquitetonicas for select
  using (exists (select 1 from public.projetos p
                 where p.id = projeto_id
                   and (p.usuario_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create policy "Entidades: insert via projeto"
  on public.entidades_arquitetonicas for insert
  with check (exists (select 1 from public.projetos p
                      where p.id = projeto_id and p.usuario_id = auth.uid()));

create policy "Entidades: update via projeto"
  on public.entidades_arquitetonicas for update
  using (exists (select 1 from public.projetos p
                 where p.id = projeto_id
                   and (p.usuario_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create policy "Entidades: delete via projeto"
  on public.entidades_arquitetonicas for delete
  using (exists (select 1 from public.projetos p
                 where p.id = projeto_id
                   and (p.usuario_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.validacoes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  regra_id uuid not null references public.regras_regulatorias(id) on delete restrict,
  entidade_id uuid references public.entidades_arquitetonicas(id) on delete cascade,
  status public.validacao_status not null,
  severidade_efetiva public.regra_severidade not null,
  valor_observado numeric,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_validacoes_projeto on public.validacoes(projeto_id);
alter table public.validacoes enable row level security;

create policy "Validacoes: select via projeto"
  on public.validacoes for select
  using (exists (select 1 from public.projetos p
                 where p.id = projeto_id
                   and (p.usuario_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create policy "Validacoes: insert via projeto"
  on public.validacoes for insert
  with check (exists (select 1 from public.projetos p
                      where p.id = projeto_id and p.usuario_id = auth.uid()));

create policy "Validacoes: delete via projeto"
  on public.validacoes for delete
  using (exists (select 1 from public.projetos p
                 where p.id = projeto_id
                   and (p.usuario_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  score_geral integer not null default 0,
  score_por_norma jsonb not null default '{}'::jsonb,
  score_por_ambiente jsonb not null default '{}'::jsonb,
  score_acessibilidade integer not null default 0,
  score_fluxo integer not null default 0,
  calculado_em timestamptz not null default now()
);

create index idx_scores_projeto on public.scores(projeto_id);
alter table public.scores enable row level security;

create policy "Scores: select via projeto"
  on public.scores for select
  using (exists (select 1 from public.projetos p
                 where p.id = projeto_id
                   and (p.usuario_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create policy "Scores: insert via projeto"
  on public.scores for insert
  with check (exists (select 1 from public.projetos p
                      where p.id = projeto_id and p.usuario_id = auth.uid()));

create table public.pareceres (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  status_final public.parecer_status not null,
  risco_sanitario text,
  impacto_regulatorio text,
  resumo_executivo text,
  checklist jsonb not null default '{}'::jsonb,
  gerado_em timestamptz not null default now()
);

create index idx_pareceres_projeto on public.pareceres(projeto_id);
alter table public.pareceres enable row level security;

create policy "Pareceres: select via projeto"
  on public.pareceres for select
  using (exists (select 1 from public.projetos p
                 where p.id = projeto_id
                   and (p.usuario_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create policy "Pareceres: insert via projeto"
  on public.pareceres for insert
  with check (exists (select 1 from public.projetos p
                      where p.id = projeto_id and p.usuario_id = auth.uid()));

-- ============ SEED AMBIENTES ============
insert into public.ambientes (codigo, nome, grupo, descricao) values
  ('parede','Parede','estrutural','Elemento de vedação vertical'),
  ('porta','Porta','circulacao','Vão de acesso entre ambientes'),
  ('corredor','Corredor','circulacao','Via de circulação horizontal'),
  ('circulacao','Circulação','circulacao','Área de fluxo de pessoas'),
  ('sanitario','Sanitário','sanitario','Sanitário comum'),
  ('sanitario_pcd','Sanitário PCD','sanitario','Sanitário acessível NBR 9050'),
  ('lavatorio','Lavatório','sanitario','Bancada de higienização'),
  ('consultorio','Consultório','assistencial','Sala de atendimento clínico'),
  ('recepcao','Recepção','apoio','Área de acolhimento'),
  ('cme','CME','esterilizacao','Central de Material Esterilizado'),
  ('expurgo','Expurgo','biosseguranca','Área de descarte de material contaminado'),
  ('esterilizacao','Esterilização','esterilizacao','Sala de esterilização'),
  ('area_limpa','Área Limpa','biosseguranca','Área limpa do fluxo CME'),
  ('area_contaminada','Área Contaminada','biosseguranca','Área suja/contaminada do fluxo CME'),
  ('ventilacao','Ventilação','infraestrutura','Sistema de ventilação/exaustão');

-- ============ SEED REGRAS REGULATÓRIAS ============
insert into public.regras_regulatorias
  (codigo, nome, norma, categoria, ambiente_aplicavel, tipo_validacao, parametros, severidade, descricao, sugestao_corretiva) values

  ('nbr9050_porta_minima','Largura mínima de porta acessível','NBR 9050','acessibilidade',
   array['sanitario_pcd','circulacao','consultorio'],'dimensional',
   '{"campo":"largura","operador":">=","valor":0.80,"unidade":"m"}'::jsonb,
   'critico','Porta inferior ao mínimo exigido pela NBR 9050.',
   'Aumentar largura da porta para no mínimo 80 cm.'),

  ('nbr9050_circulacao_min','Circulação acessível mínima','NBR 9050','acessibilidade',
   array['circulacao','corredor'],'dimensional',
   '{"campo":"largura","operador":">=","valor":1.20,"unidade":"m"}'::jsonb,
   'critico','Faixa de circulação abaixo de 1,20 m.',
   'Ampliar circulação para no mínimo 1,20 m.'),

  ('nbr9050_san_pcd_area','Área mínima de sanitário PCD','NBR 9050','acessibilidade',
   array['sanitario_pcd'],'area_minima',
   '{"campo":"area","operador":">=","valor":3.20,"unidade":"m2"}'::jsonb,
   'bloqueante','Sanitário PCD com área inferior a 3,20 m².',
   'Redimensionar para garantir área mínima de 3,20 m² com círculo de manobra.'),

  ('nbr9050_san_pcd_presenca','Presença obrigatória de sanitário PCD','NBR 9050','acessibilidade',
   array['sanitario_pcd'],'presencial',
   '{"obrigatorio":true,"min_quantidade":1}'::jsonb,
   'bloqueante','Edificação sem sanitário acessível.',
   'Incluir ao menos um sanitário acessível conforme NBR 9050.'),

  ('rdc50_corredor_assistencial','Corredor assistencial mínimo','RDC 50','dimensional',
   array['corredor'],'dimensional',
   '{"campo":"largura","operador":">=","valor":2.00,"unidade":"m","contexto":"assistencial"}'::jsonb,
   'critico','Corredor de uso assistencial inferior a 2,00 m.',
   'Ajustar corredor assistencial para no mínimo 2,00 m.'),

  ('rdc50_consultorio_area','Área mínima de consultório','RDC 50','dimensional',
   array['consultorio'],'area_minima',
   '{"campo":"area","operador":">=","valor":7.50,"unidade":"m2"}'::jsonb,
   'critico','Consultório com área inferior a 7,50 m².',
   'Redimensionar consultório para no mínimo 7,50 m².'),

  ('rdc50_lavatorio_consultorio','Lavatório obrigatório em consultório','RDC 50','funcional',
   array['consultorio'],'presencial',
   '{"obrigatorio":true,"dependencia":"lavatorio"}'::jsonb,
   'critico','Consultório sem lavatório de higienização.',
   'Instalar lavatório de mãos no consultório.'),

  ('rdc50_ventilacao_cme','Ventilação/exaustão na CME','RDC 50','ventilacao',
   array['cme','esterilizacao'],'ventilacao',
   '{"obrigatorio":true,"renovacoes_h":6}'::jsonb,
   'critico','CME sem sistema de exaustão dimensionado.',
   'Prever sistema de ventilação mecânica com no mínimo 6 renovações/h.'),

  ('rdc50_fluxo_limpo_sujo','Separação de fluxo limpo e sujo','RDC 50','fluxo_sanitario',
   array['cme','area_limpa','area_contaminada'],'fluxo',
   '{"separacao":"obrigatoria","cruzamento":"proibido"}'::jsonb,
   'bloqueante','Cruzamento entre fluxo limpo e contaminado.',
   'Reorganizar layout para evitar cruzamento entre áreas limpas e contaminadas.'),

  ('rdc15_barreira_cme','Barreira física na CME','RDC 15','biosseguranca',
   array['cme'],'barreira',
   '{"barreira":"obrigatoria","entre":["area_limpa","area_contaminada"]}'::jsonb,
   'bloqueante','Ausência de barreira física entre áreas limpa e contaminada da CME.',
   'Implantar barreira física (parede ou pass-through) entre áreas limpa e contaminada.'),

  ('rdc15_expurgo_separado','Expurgo segregado','RDC 15','biosseguranca',
   array['expurgo'],'presencial',
   '{"obrigatorio":true,"isolado":true}'::jsonb,
   'critico','Expurgo não isolado de áreas limpas.',
   'Isolar expurgo com acesso controlado e sinalização.'),

  ('rdc15_esterilizacao_area','Área mínima de esterilização','RDC 15','esterilizacao',
   array['esterilizacao'],'area_minima',
   '{"campo":"area","operador":">=","valor":6.00,"unidade":"m2"}'::jsonb,
   'critico','Sala de esterilização com área insuficiente.',
   'Redimensionar sala de esterilização para no mínimo 6,00 m².'),

  ('rdc63_recepcao','Recepção identificada e acessível','RDC 63','funcional',
   array['recepcao'],'presencial',
   '{"obrigatorio":true,"acessivel":true}'::jsonb,
   'atencao','Recepção não identificada ou sem acessibilidade.',
   'Garantir recepção sinalizada e com balcão acessível.'),

  ('rdc51_lavatorio_assistencial','Lavatório em área assistencial','RDC 51','operacao',
   array['consultorio','cme','esterilizacao'],'presencial',
   '{"obrigatorio":true,"dependencia":"lavatorio"}'::jsonb,
   'critico','Área assistencial sem lavatório dedicado.',
   'Instalar lavatório exclusivo na área assistencial.'),

  ('nbr9050_rota_acessivel','Rota acessível contínua','NBR 9050','acessibilidade',
   array['circulacao','corredor','recepcao'],'fluxo',
   '{"continuidade":"obrigatoria","desnivel_max":0.015,"unidade":"m"}'::jsonb,
   'critico','Rota acessível interrompida ou com desnível superior a 1,5 cm.',
   'Eliminar desníveis e garantir rota acessível contínua entre ambientes.');
