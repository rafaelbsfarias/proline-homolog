-- Consulta simples para testar o relacionamento entre vehicles e vehicle_collections
SELECT v.id AS vehicle_id,
       v.plate,
       v.client_id,
       v.pickup_address_id,
       v.collection_id,
       vc.id AS collection_id,
       vc.collection_address,
       vc.status AS collection_status
FROM vehicles v
LEFT JOIN vehicle_collections vc ON v.collection_id = vc.id
LIMIT 20;
