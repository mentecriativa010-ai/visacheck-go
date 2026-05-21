CREATE OR REPLACE FUNCTION public.get_email_by_credentials(_crea_cau text, _cnpj text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles
  WHERE crea_cau = _crea_cau AND cnpj = _cnpj
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_credentials(text, text) TO anon, authenticated;