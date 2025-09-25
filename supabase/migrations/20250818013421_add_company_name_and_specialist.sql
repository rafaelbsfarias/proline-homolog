DROP FUNCTION IF EXISTS get_clients_with_vehicle_count();
CREATE OR REPLACE FUNCTION get_clients_with_vehicle_count()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    company_name TEXT, -- Added company_name
    vehicle_count BIGINT,
    specialist_names TEXT -- Added specialist_names
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    c.company_name,
    COUNT(v.id) AS vehicle_count,
    STRING_AGG(sp.full_name, ', ') FILTER (WHERE sp.full_name IS NOT NULL) AS specialist_names
  FROM
    profiles p
  LEFT JOIN
    clients c ON p.id = c.profile_id
  LEFT JOIN
    vehicles v ON p.id = v.client_id
  LEFT JOIN
    client_specialists cs ON p.id = cs.client_id
  LEFT JOIN
    profiles sp ON cs.specialist_id = sp.id AND sp.role = 'specialist'
  WHERE
    p.role = 'client'
  GROUP BY
    p.id, p.full_name, c.company_name;
END;
$$;
