
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profissao TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, nome, tipo_usuario, telefone, crea_cau, registro_profissional, cnpj, razao_social, nome_fantasia, responsavel_tecnico, email_corporativo, profissao)
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
    new.raw_user_meta_data->>'email_corporativo',
    new.raw_user_meta_data->>'profissao'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$function$;
