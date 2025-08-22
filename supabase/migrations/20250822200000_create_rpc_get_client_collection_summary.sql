CREATE OR REPLACE FUNCTION get_client_collection_summary(p_client_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    groups_data jsonb;
    approval_groups_data jsonb;
    approval_total_data numeric;
BEGIN
    -- Get groups for 'PONTO DE COLETA SELECIONADO'
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
    INTO groups_data
    FROM (
        SELECT
            vc.id as "addressId", -- Returning as addressId for frontend compatibility
            vc.collection_address as "address",
            vc.collection_fee_per_vehicle as "collection_fee",
            COUNT(v.id) as "vehicle_count"
        FROM vehicle_collections vc
        JOIN vehicles v ON vc.id = v.collection_id
        WHERE vc.client_id = p_client_id
          AND v.status = 'PONTO DE COLETA SELECIONADO'
        GROUP BY vc.id
    ) t;

    -- Get groups for 'AGUARDANDO APROVAÇÃO DA COLETA'
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
    INTO approval_groups_data
    FROM (
        SELECT
            vc.id as "addressId",
            vc.collection_address as "address",
            vc.collection_fee_per_vehicle as "collection_fee",
            MIN(v.estimated_arrival_date) as "collection_date",
            COUNT(v.id) as "vehicle_count"
        FROM vehicle_collections vc
        JOIN vehicles v ON vc.id = v.collection_id
        WHERE vc.client_id = p_client_id
          AND v.status = 'AGUARDANDO APROVAÇÃO DA COLETA'
        GROUP BY vc.id
    ) t;

    -- Calculate approval total
    SELECT COALESCE(SUM(ag.vehicle_count * ag.collection_fee), 0)
    INTO approval_total_data
    FROM (
        SELECT
            COUNT(v.id) as vehicle_count,
            vc.collection_fee_per_vehicle as collection_fee
        FROM vehicle_collections vc
        JOIN vehicles v ON vc.id = v.collection_id
        WHERE vc.client_id = p_client_id
          AND v.status = 'AGUARDANDO APROVAÇÃO DA COLETA'
        GROUP BY vc.id
    ) ag;

    result := jsonb_build_object(
        'groups', groups_data,
        'approvalGroups', approval_groups_data,
        'approvalTotal', approval_total_data
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;