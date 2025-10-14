-- This migration fixes the service_categories table by:
-- 1. Correctly assigning the 'type' for each service category.
-- 2. Replacing the restrictive admin-only RLS policy with one that allows all authenticated users to read.
-- 3. Making the 'type' column non-nullable and removing its incorrect default value.

-- Step 1: Update the 'type' column for existing service categories
UPDATE public.service_categories
SET type = 'preparacao'
WHERE key IN ('mechanics', 'body_paint', 'washing', 'tires');

UPDATE public.service_categories
SET type = 'comercializacao'
WHERE key IN ('loja', 'patio_atacado');

-- Step 2: Drop the old admin-only policy
DROP POLICY IF EXISTS "svc_cat_admin_all" ON public.service_categories;

-- Step 3: Create a new policy to allow all authenticated users to read
-- Drop the policy if it exists to make this script re-runnable
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.service_categories;
CREATE POLICY "Enable read access for all authenticated users" ON public.service_categories
FOR SELECT
TO authenticated
USING (true);

-- Step 4: Alter column to not have a default value anymore and set it to NOT NULL
ALTER TABLE public.service_categories
ALTER COLUMN type DROP DEFAULT;

ALTER TABLE public.service_categories
ALTER COLUMN type SET NOT NULL;
