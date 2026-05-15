
-- Enums
create type public.app_role as enum ('admin', 'user');
create type public.user_type as enum ('profissional', 'empresa');
create type public.projeto_status as enum ('pendente', 'analisando', 'aprovado', 'parcial', 'reprovado');
create type public.severidade as enum ('critico', 'atencao', 'conforme');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tipo_usuario public.user_type not null default 'profissional',
  nome text,
  email text,
  telefone text,
  crea_cau text,
  registro_profissional text,
  cnpj text,
  razao_social text,
  nome_fantasia text,
  responsavel_tecnico text,
  email_corporativo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles: select own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles: update own" on public.profiles for update using (auth.uid() = id);
create policy "Profiles: insert own" on public.profiles for insert with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "Roles: select own" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Projetos
create table public.projetos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome_projeto text not null,
  tipo_arquivo text not null,
  arquivo_url text,
  arquivo_path text,
  status public.projeto_status not null default 'pendente',
  score_conformidade integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projetos enable row level security;

create policy "Projetos: select own/admin" on public.projetos for select using (auth.uid() = usuario_id or public.has_role(auth.uid(), 'admin'));
create policy "Projetos: insert own" on public.projetos for insert with check (auth.uid() = usuario_id);
create policy "Projetos: update own/admin" on public.projetos for update using (auth.uid() = usuario_id or public.has_role(auth.uid(), 'admin'));
create policy "Projetos: delete own/admin" on public.projetos for delete using (auth.uid() = usuario_id or public.has_role(auth.uid(), 'admin'));

-- Analises
create table public.analises (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  norma text not null,
  descricao_problema text not null,
  sugestao text not null,
  severidade public.severidade not null,
  coordenada_x numeric not null default 0,
  coordenada_y numeric not null default 0,
  pagina integer not null default 1,
  created_at timestamptz not null default now()
);
alter table public.analises enable row level security;

create policy "Analises: select via projeto" on public.analises for select using (
  exists (select 1 from public.projetos p where p.id = projeto_id and (p.usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
);
create policy "Analises: insert via projeto" on public.analises for insert with check (
  exists (select 1 from public.projetos p where p.id = projeto_id and p.usuario_id = auth.uid())
);
create policy "Analises: delete via projeto" on public.analises for delete using (
  exists (select 1 from public.projetos p where p.id = projeto_id and (p.usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
);

-- Relatorios
create table public.relatorios (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  relatorio_pdf text,
  status_final public.projeto_status not null,
  gerado_em timestamptz not null default now()
);
alter table public.relatorios enable row level security;

create policy "Relatorios: select via projeto" on public.relatorios for select using (
  exists (select 1 from public.projetos p where p.id = projeto_id and (p.usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
);
create policy "Relatorios: insert via projeto" on public.relatorios for insert with check (
  exists (select 1 from public.projetos p where p.id = projeto_id and p.usuario_id = auth.uid())
);

-- Trigger to create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, tipo_usuario, telefone, crea_cau, registro_profissional, cnpj, razao_social, nome_fantasia, responsavel_tecnico, email_corporativo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'razao_social'),
    coalesce((new.raw_user_meta_data->>'tipo_usuario')::public.user_type, 'profissional'),
    new.raw_user_meta_data->>'telefone',
    new.raw_user_meta_data->>'crea_cau',
    new.raw_user_meta_data->>'registro_profissional',
    new.raw_user_meta_data->>'cnpj',
    new.raw_user_meta_data->>'razao_social',
    new.raw_user_meta_data->>'nome_fantasia',
    new.raw_user_meta_data->>'responsavel_tecnico',
    new.raw_user_meta_data->>'email_corporativo'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_projetos before update on public.projetos
  for each row execute function public.touch_updated_at();

-- Storage bucket
insert into storage.buckets (id, name, public) values ('projetos', 'projetos', false)
on conflict (id) do nothing;

create policy "Projetos storage: select own" on storage.objects for select
  using (bucket_id = 'projetos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Projetos storage: insert own" on storage.objects for insert
  with check (bucket_id = 'projetos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Projetos storage: delete own" on storage.objects for delete
  using (bucket_id = 'projetos' and auth.uid()::text = (storage.foldername(name))[1]);
