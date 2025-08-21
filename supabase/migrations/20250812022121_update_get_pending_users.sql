-- Dropar a função existente
DROP FUNCTION IF EXISTS get_pending_users();
-- Recriar com cast correto dos tipos
CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(
      p.full_name, 
      (u.raw_user_meta_data->>'full_name')::TEXT,
      'Nome não informado'
    ) as full_name,
    -- Cast p.role para TEXT para compatibilidade
    COALESCE(
      p.role::TEXT,
      (u.raw_user_meta_data->>'role')::TEXT,
      'client'
    ) as user_role,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.confirmed_at IS NULL
  OR (p.id IS NULL AND u.confirmed_at IS NOT NULL)
  ORDER BY u.created_at DESC;
END;
$$;
-- Regarantir permissões
GRANT EXECUTE ON FUNCTION get_pending_users() TO authenticated;
