CREATE OR REPLACE FUNCTION get_collections_for_approval(p_client_id uuid)
RETURNS jsonb AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
        FROM (
            SELECT
                vc.id,
                vc.collection_address as address,
                vc.collection_fee_per_vehicle as fee,
                MIN(v.estimated_arrival_date) as date,
                jsonb_agg(jsonb_build_object('id', v.id, 'plate', v.plate, 'brand', v.brand, 'model', v.model)) as vehicles
            FROM vehicle_collections vc
            JOIN vehicles v ON vc.id = v.collection_id
            WHERE vc.client_id = p_client_id
              AND v.status = 'AGUARDANDO APROVAÇÃO DA COLETA'
            GROUP BY vc.id, vc.collection_address, vc.collection_fee_per_vehicle
        ) t
    );
END;
$$ LANGUAGE plpgsql;