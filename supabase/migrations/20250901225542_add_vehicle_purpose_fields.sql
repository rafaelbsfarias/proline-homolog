-- Add preparation and commercialization fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS preparacao BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS comercializacao BOOLEAN DEFAULT FALSE;

-- Add comments to the new columns
COMMENT ON COLUMN public.vehicles.preparacao IS 'Indicates if the vehicle is intended for preparation services';
COMMENT ON COLUMN public.vehicles.comercializacao IS 'Indicates if the vehicle is intended for commercialization services';

-- Update RLS policies to include the new fields (if needed)
-- The existing policies should cover these new fields automatically