-- Add observations column to vehicles table
-- This migration adds the observations column to the vehicles table to store general observations about vehicles

DO $$
BEGIN
  -- Add observations column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'vehicles'
    AND column_name = 'observations'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN observations text;
  END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN public.vehicles.observations IS 'General observations about the vehicle';