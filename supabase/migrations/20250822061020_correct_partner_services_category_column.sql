-- Migration to correct the category field in partner_services

BEGIN;

-- 1. Drop the foreign key constraint if it exists
ALTER TABLE public.partner_services
DROP CONSTRAINT IF EXISTS fk_category;

-- 2. Rename the old column if it exists, or add the new one
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='partner_services' AND column_name='category_id') THEN
    ALTER TABLE public.partner_services RENAME COLUMN category_id TO category;
  ELSE
    ALTER TABLE public.partner_services ADD COLUMN IF NOT EXISTS category TEXT;
  END IF;
END $$;

-- 3. Change the column type to TEXT
ALTER TABLE public.partner_services
ALTER COLUMN category TYPE TEXT;

COMMIT;
