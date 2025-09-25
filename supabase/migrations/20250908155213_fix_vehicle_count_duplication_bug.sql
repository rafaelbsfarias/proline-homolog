-- Fix vehicle count duplication bug in get_clients_with_vehicle_count function
-- This migration corrects the issue where vehicle counts were multiplied by the number of associated specialists

-- Drop the existing function to recreate it with the fix
DROP FUNCTION IF EXISTS get_clients_with_vehicle_count();

-- Create the corrected function using CTEs to avoid duplication
CREATE OR REPLACE FUNCTION get_clients_with_vehicle_count()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    company_name TEXT,
    vehicle_count BIGINT,
    specialist_names TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH
    -- CTE to count vehicles per client (avoids duplication)
    vehicle_counts AS (
      SELECT
        v.client_id,
        COUNT(v.id) AS vehicle_count
      FROM vehicles v
      GROUP BY v.client_id
    ),
    -- CTE to aggregate specialist names per client (avoids duplication)
    specialist_agg AS (
      SELECT
        cs.client_id,
        STRING_AGG(DISTINCT sp.full_name, ', ') FILTER (WHERE sp.full_name IS NOT NULL) AS specialist_names
      FROM client_specialists cs
      JOIN profiles sp ON cs.specialist_id = sp.id AND sp.role = 'specialist'
      GROUP BY cs.client_id
    )
  SELECT
    p.id,
    p.full_name,
    c.company_name,
    COALESCE(vc.vehicle_count, 0) AS vehicle_count,
    COALESCE(sa.specialist_names, 'Nenhum') AS specialist_names
  FROM profiles p
  LEFT JOIN clients c ON p.id = c.profile_id
  LEFT JOIN vehicle_counts vc ON p.id = vc.client_id
  LEFT JOIN specialist_agg sa ON p.id = sa.client_id
  WHERE p.role = 'client';
END;
$$;

-- Add comment to document the fix
COMMENT ON FUNCTION get_clients_with_vehicle_count() IS
'Returns client information with correct vehicle counts and specialist names.
Fixed duplication bug where vehicle counts were multiplied by number of specialists.
Uses CTEs to aggregate data separately and avoid JOIN duplication.';

-- Verify the function works correctly
-- This is a test query that can be run to validate the fix
-- SELECT * FROM get_clients_with_vehicle_count() LIMIT 5;