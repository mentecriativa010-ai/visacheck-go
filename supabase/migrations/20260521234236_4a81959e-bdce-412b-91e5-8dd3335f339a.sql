
-- 1) Recreate handle_new_user with normalization (UPPER + trim) for crea_cau and cnpj
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
    nullif(upper(btrim(new.raw_user_meta_data->>'crea_cau')), ''),
    new.raw_user_meta_data->>'registro_profissional',
    nullif(btrim(new.raw_user_meta_data->>'cnpj'), ''),
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

-- 2) Create the missing trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Make credential lookup case/space-insensitive
CREATE OR REPLACE FUNCTION public.get_email_by_credentials(_crea_cau text, _cnpj text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT email FROM public.profiles
  WHERE (
    (_crea_cau <> '' AND upper(btrim(crea_cau)) = upper(btrim(_crea_cau)))
    OR (_cnpj <> '' AND btrim(cnpj) = btrim(_cnpj))
  )
  LIMIT 1;
$function$;
