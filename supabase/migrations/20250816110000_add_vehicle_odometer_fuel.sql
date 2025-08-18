-- Add current_odometer and fuel_level to vehicles
-- Also creates fuel_level_enum if not exists

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_level_enum') THEN
    CREATE TYPE fuel_level_enum AS ENUM ('empty','quarter','half','three_quarters','full');
  END IF;
END $$;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS current_odometer integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fuel_level fuel_level_enum NOT NULL DEFAULT 'half';

