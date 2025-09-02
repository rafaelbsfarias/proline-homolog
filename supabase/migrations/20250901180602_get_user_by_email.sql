DROP FUNCTION IF EXISTS get_user_by_email(TEXT);

CREATE FUNCTION get_user_by_email(p_email TEXT)
RETURNS TABLE(id uuid, email text, user_metadata jsonb) AS $$
  SELECT id, email, raw_user_meta_data as user_metadata
  FROM auth.users
  WHERE email = p_email LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
