CREATE OR REPLACE FUNCTION get_clients_with_vehicle_count()
RETURNS TABLE (id uuid, full_name text, vehicle_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    COUNT(v.id) AS vehicle_count
  FROM
    profiles p
  LEFT JOIN
    vehicles v ON p.id = v.client_id
  WHERE
    p.role = 'client'
  GROUP BY
    p.id, p.full_name;
END;
$$;
