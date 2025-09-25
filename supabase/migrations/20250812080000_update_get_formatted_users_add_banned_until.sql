-- Update RPC to reflect suspension using auth.users.banned_until
CREATE OR REPLACE FUNCTION get_formatted_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  user_role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(
      (u.raw_user_meta_data->>'name')::TEXT,
      (u.raw_user_meta_data->>'full_name')::TEXT,
      'Nome não informado'
    ) as full_name,
    COALESCE(
      (u.raw_user_meta_data->>'role')::TEXT,
      'client'
    ) as user_role,
    CASE 
      WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'Suspenso'
      WHEN u.email_confirmed_at IS NOT NULL THEN 'Ativo'
      ELSE 'Pendente'
    END as status,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION get_formatted_users() TO authenticated;
