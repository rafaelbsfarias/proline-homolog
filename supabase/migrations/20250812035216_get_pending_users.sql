-- Versão com cast do email
DROP FUNCTION IF EXISTS get_pending_users();
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
    u.email::TEXT, -- Cast para TEXT
    COALESCE(
      (u.raw_user_meta_data->>'name')::TEXT,
      (u.raw_user_meta_data->>'full_name')::TEXT,
      'Nome não informado'
    ) as full_name,
    COALESCE(
      (u.raw_user_meta_data->>'role')::TEXT,
      'client'
    ) as user_role,
    u.created_at
  FROM auth.users u
  WHERE u.confirmed_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION get_pending_users() TO authenticated;
