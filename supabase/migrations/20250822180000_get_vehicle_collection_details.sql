-- Migration idempotente para criar a RPC get_vehicle_collection_details
-- Criada com base nas boas práticas do projeto

CREATE OR REPLACE FUNCTION get_vehicle_collection_details()
RETURNS TABLE (
  vehicle_id uuid,
  plate text,
  client_id uuid,
  pickup_address_id uuid,
  collection_id uuid,
  collection_address text,
  collection_status text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS vehicle_id,
    v.plate,
    v.client_id,
    v.pickup_address_id,
    v.collection_id,
    vc.collection_address,
    vc.status AS collection_status
  FROM vehicles v
  LEFT JOIN vehicle_collections vc ON v.collection_id = vc.id;
END;
$$;
