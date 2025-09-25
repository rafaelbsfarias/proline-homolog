CREATE OR REPLACE FUNCTION public.get_specialist_clients_with_vehicle_count(
    p_specialist_id UUID
)
RETURNS TABLE (
    client_id UUID,
    client_full_name TEXT,
    vehicle_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.client_id,
        p.full_name AS client_full_name,
        COUNT(v.id) AS vehicle_count
    FROM
        public.client_specialists cs
    JOIN
        public.profiles p ON cs.client_id = p.id
    LEFT JOIN
        public.vehicles v ON cs.client_id = v.client_id
    WHERE
        cs.specialist_id = p_specialist_id
    GROUP BY
        cs.client_id, p.full_name;
END;
$$;
