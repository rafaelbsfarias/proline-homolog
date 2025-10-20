-- Remove quilometragem and percentual_fipe columns from clients table
-- These fields are no longer needed in the client registration form

ALTER TABLE public.clients DROP COLUMN IF EXISTS quilometragem;
ALTER TABLE public.clients DROP COLUMN IF EXISTS percentual_fipe;