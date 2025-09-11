CREATE OR REPLACE FUNCTION get_client_vehicles_paginated(
    p_client_id uuid,
    p_page_size integer,
    p_page_num integer,
    p_plate_filter text,
    p_status_filter text
)
RETURNS json AS $$
DECLARE
    v_offset integer;
    v_total_count bigint;
    v_vehicles json;
    v_status_counts json;
BEGIN
    v_offset := (p_page_num - 1) * p_page_size;

    -- Total global de veículos do cliente (sem filtros)
    SELECT count(*) INTO v_total_count
    FROM public.vehicles
    WHERE client_id = p_client_id;

    -- Contagem por todos os status disponíveis do cliente, sem filtros
    SELECT COALESCE(json_object_agg(status, count), '{}'::json)
    INTO v_status_counts
    FROM (
        SELECT status, count(*) AS count
        FROM public.vehicles
        WHERE client_id = p_client_id
        GROUP BY status
    ) AS status_counts;

    -- Lista paginada de veículos com filtros aplicados
    SELECT COALESCE(json_agg(v.*), '[]'::json) INTO v_vehicles
    FROM (
        SELECT
            id,
            plate,
            brand,
            model,
            year,
            color,
            status,
            created_at,
            fipe_value,
            current_odometer,
            fuel_level,
            estimated_arrival_date,
            pickup_address_id
        FROM
            public.vehicles
        WHERE
            client_id = p_client_id
            AND (p_status_filter IS NULL OR p_status_filter = '' OR trim(lower(status)) = trim(lower(p_status_filter)))
        ORDER BY
            created_at DESC
        LIMIT
            p_page_size
        OFFSET
            v_offset
    ) v;

    -- Retorna JSON consolidado com veículos, contagem total e status
    RETURN json_build_object(
        'vehicles', v_vehicles,
        'total_count', v_total_count,
        'status_counts', v_status_counts
    );
END;
$$ LANGUAGE plpgsql;
