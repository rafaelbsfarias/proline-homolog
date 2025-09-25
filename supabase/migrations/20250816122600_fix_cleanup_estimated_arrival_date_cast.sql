-- Fix type mismatch when backfilling estimated_arrival_date from legacy estimatedArrivalDate
-- Cast legacy values safely from text -> date only when ISO formatted

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'estimatedArrivalDate'
  ) THEN
    EXECUTE 'UPDATE public.vehicles '
      || 'SET estimated_arrival_date = COALESCE( '
      || 'estimated_arrival_date, '
      || 'CASE '
      || 'WHEN "estimatedArrivalDate" IS NULL THEN NULL '
      || 'WHEN ("estimatedArrivalDate"::text ~ ''^[0-9]{4}-[0-9]{2}-[0-9]{2}$'') THEN ("estimatedArrivalDate"::text)::date '
      || 'ELSE NULL '
      || 'END '
      || ')';
    EXECUTE 'ALTER TABLE public.vehicles DROP COLUMN "estimatedArrivalDate"';
  END IF;
END $$;
