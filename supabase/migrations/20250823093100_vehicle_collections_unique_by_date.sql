-- Ensure vehicle_collections can store multiple dates per address by making
-- (client_id, collection_address, collection_date) unique instead of just
-- (client_id, collection_address).
DO $$
DECLARE cons RECORD;
BEGIN
  FOR cons IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public'
      AND cl.relname = 'vehicle_collections'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%(client_id, collection_address)%'
  LOOP
    EXECUTE format('ALTER TABLE public.vehicle_collections DROP CONSTRAINT %I', cons.conname);
  END LOOP;
END $$;

ALTER TABLE public.vehicle_collections
ADD CONSTRAINT vehicle_collections_client_addr_date_uniq
UNIQUE (client_id, collection_address, collection_date);

