-- Ensure unique index/constraint on vehicles.plate and FK with ON DELETE CASCADE

-- 1) Ensure unique index on plate and attach as constraint if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'vehicles' AND indexname = 'vehicles_plate_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX vehicles_plate_key ON public.vehicles(plate)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'vehicles'
      AND constraint_name = 'vehicles_plate_key'
      AND constraint_type = 'UNIQUE'
  ) THEN
    EXECUTE 'ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_plate_key UNIQUE USING INDEX vehicles_plate_key';
  END IF;
END $$;
-- 2) Ensure client FK has ON DELETE CASCADE
DO $$
DECLARE
  v_del CHAR(1);
  v_exists BOOLEAN;
BEGIN
  SELECT TRUE
  INTO v_exists
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE c.conname = 'vehicles_client_id_fkey' AND n.nspname = 'public' AND t.relname = 'vehicles'
  LIMIT 1;

  IF v_exists THEN
    SELECT c.confdeltype
    INTO v_del
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'vehicles_client_id_fkey' AND n.nspname = 'public' AND t.relname = 'vehicles'
    LIMIT 1;

    IF v_del IS DISTINCT FROM 'c' THEN
      EXECUTE 'ALTER TABLE public.vehicles DROP CONSTRAINT vehicles_client_id_fkey';
      EXECUTE 'ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(profile_id) ON DELETE CASCADE';
    END IF;
  ELSE
    EXECUTE 'ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(profile_id) ON DELETE CASCADE';
  END IF;
END $$;
