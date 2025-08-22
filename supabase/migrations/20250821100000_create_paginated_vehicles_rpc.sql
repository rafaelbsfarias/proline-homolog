CREATE OR REPLACE FUNCTION get_client_vehicles_paginated(
    p_client_id uuid,
    p_page_size integer,
    p_page_num integer
)
RETURNS json AS $$
DECLARE
    v_offset integer;
    v_total_count bigint;
    v_vehicles json;
BEGIN
    v_offset := (p_page_num - 1) * p_page_size;

    -- Get the total count of vehicles for the client
    SELECT count(*) INTO v_total_count
    FROM public.vehicles
    WHERE client_id = p_client_id;

    -- Get the paginated vehicle data and aggregate it into a JSON array
    SELECT COALESCE(json_agg(v.*), '[]'::json) INTO v_vehicles
    FROM (
        SELECT
            id,
            plate,
            brand,
            model,
            color,
            year,
            status
        FROM
            public.vehicles
        WHERE
            client_id = p_client_id
        ORDER BY
            created_at DESC
        LIMIT
            p_page_size
        OFFSET
            v_offset
    ) v;

    -- Combine results into a single JSON object
    RETURN json_build_object(
        'vehicles', v_vehicles,
        'total_count', v_total_count
    );

END;
$$ LANGUAGE plpgsql;
