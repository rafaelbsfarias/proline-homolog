-- Add ON DELETE CASCADE to vehicles_client_id_fkey

-- Drop the existing foreign key constraint
ALTER TABLE public.vehicles
DROP CONSTRAINT vehicles_client_id_fkey;
-- Re-add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.vehicles
ADD CONSTRAINT vehicles_client_id_fkey
FOREIGN KEY (client_id) REFERENCES public.clients(profile_id) ON DELETE CASCADE;
-- Validate the constraint (if it was previously NOT VALID)
ALTER TABLE public.vehicles
VALIDATE CONSTRAINT vehicles_client_id_fkey;
