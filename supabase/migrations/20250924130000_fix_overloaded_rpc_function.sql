-- Step 1: Drop the old function with the incorrect 'text' parameter for status
DROP FUNCTION IF EXISTS get_client_vehicles_paginated(uuid, integer, integer, text, text);

-- Step 2: Recreate the function with the correct 'text[]' parameter
CREATE OR REPLACE FUNCTION get_client_vehicles_paginated(
    p_client_id uuid,
    p_page_size integer,
    p_page_num integer,
    p_plate_filter text,
    p_status_filter text[]
)
RETURNS json AS $$
DECLARE
    v_offset integer;
    v_total_count bigint;
    v_filtered_total_count bigint;
    v_vehicles json;
    v_status_counts json;
BEGIN
    v_offset := (p_page_num - 1) * p_page_size;

    -- 1. Global total count (unfiltered)
    SELECT count(*) INTO v_total_count
    FROM public.vehicles
    WHERE client_id = p_client_id;

    -- 2. Global status counts (unfiltered)
    SELECT COALESCE(json_object_agg(status, count), '{}'::json)
    INTO v_status_counts
    FROM (
        SELECT status, count(*) AS count
        FROM public.vehicles
        WHERE client_id = p_client_id
        GROUP BY status
    ) AS status_counts;

    -- 3. Get paginated vehicles and the new filtered count
    WITH filtered_vehicles AS (
        SELECT *
        FROM public.vehicles
        WHERE
            client_id = p_client_id
            AND (p_plate_filter IS NULL OR p_plate_filter = '' OR plate ILIKE '%' || p_plate_filter || '%')
            AND (p_status_filter IS NULL OR cardinality(p_status_filter) = 0 OR status = ANY(p_status_filter))
    )
    SELECT
        (SELECT count(*) FROM filtered_vehicles),
        COALESCE(json_agg(v.*), '[]'::json)
    INTO
        v_filtered_total_count,
        v_vehicles
    FROM (
        SELECT
            id, plate, brand, model, year, color, status, created_at, fipe_value,
            current_odometer, fuel_level, estimated_arrival_date, pickup_address_id
        FROM filtered_vehicles
        ORDER BY created_at DESC
        LIMIT p_page_size
        OFFSET v_offset
    ) v;

    -- 4. Return consolidated JSON with the new field
    RETURN json_build_object(
        'vehicles', v_vehicles,
        'total_count', v_total_count,
        'filtered_total_count', v_filtered_total_count,
        'status_counts', v_status_counts
    );
END;
$$ LANGUAGE plpgsql;
