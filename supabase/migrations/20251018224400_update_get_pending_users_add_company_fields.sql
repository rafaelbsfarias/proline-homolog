-- Update get_pending_users function to include company fields
DROP FUNCTION IF EXISTS get_pending_users();
CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ,
  company_name TEXT,
  cnpj TEXT,
  phone TEXT
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
    u.created_at,
    c.company_name,
    c.document_number as cnpj,
    COALESCE(
      (u.raw_user_meta_data->>'phone')::TEXT,
      (u.raw_user_meta_data->>'phone_number')::TEXT,
      ''
    ) as phone
  FROM auth.users u
  LEFT JOIN public.clients c ON u.id = c.profile_id
  WHERE u.confirmed_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION get_pending_users() TO authenticated;
