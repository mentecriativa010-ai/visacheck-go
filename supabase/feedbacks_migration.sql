create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  pagina text,
  mensagem text not null,
  criado_em timestamptz not null default now()
);

alter table feedbacks enable row level security;

drop policy if exists "insert_own_feedback" on feedbacks;
create policy "insert_own_feedback"
  on feedbacks for insert
  to authenticated
  with check (auth.uid() = user_id);
