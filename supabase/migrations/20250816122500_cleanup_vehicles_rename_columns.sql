-- Cleanup inconsistent columns in public.vehicles on remote
-- - Normalize fipe_value (drop legacy camelCase variants after backfill)
-- - Normalize estimated_arrival_date as DATE (backfill from legacy columns)

-- Ensure fipe_value exists
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS fipe_value numeric;
-- Backfill from legacy "fipeValue" (camelCase) if it exists, then drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'fipeValue'
  ) THEN
    EXECUTE 'UPDATE public.vehicles SET fipe_value = COALESCE(fipe_value, NULLIF(("fipeValue")::text, '''')::numeric)';
    EXECUTE 'ALTER TABLE public.vehicles DROP COLUMN "fipeValue"';
  END IF;
END $$;
-- Backfill from legacy lowercase variant "fipevalue" if it exists, then drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'fipevalue'
  ) THEN
    EXECUTE 'UPDATE public.vehicles SET fipe_value = COALESCE(fipe_value, NULLIF((fipevalue)::text, '''')::numeric)';
    EXECUTE 'ALTER TABLE public.vehicles DROP COLUMN fipevalue';
  END IF;
END $$;
-- Normalize estimated_arrival_date to DATE
-- 1) Ensure target column exists (DATE)
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS estimated_arrival_date date;
-- 2) Backfill from camelCase legacy column if present
DO $$ BEGIN END $$;
-- 3) If a text-typed estimated_arrival_date existed on some environments, convert it
DO $$
DECLARE
  v_is_text boolean;
BEGIN
  SELECT TRUE
  INTO v_is_text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'vehicles'
    AND column_name = 'estimated_arrival_date'
    AND data_type = 'text'
  LIMIT 1;

  IF v_is_text THEN
    -- Create temp date column and migrate values when in ISO format
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'estimated_arrival_date_tmp'
    ) THEN
      ALTER TABLE public.vehicles ADD COLUMN estimated_arrival_date_tmp date;
    END IF;

    EXECUTE 'UPDATE public.vehicles '
      || 'SET estimated_arrival_date_tmp = CASE '
      || 'WHEN estimated_arrival_date ~ ''^[0-9]{4}-[0-9]{2}-[0-9]{2}$'' THEN estimated_arrival_date::date '
      || 'ELSE NULL '
      || 'END';

    -- Drop text column and rename tmp to final
    EXECUTE 'ALTER TABLE public.vehicles DROP COLUMN estimated_arrival_date';
    ALTER TABLE public.vehicles RENAME COLUMN estimated_arrival_date_tmp TO estimated_arrival_date;
  END IF;
END $$;
