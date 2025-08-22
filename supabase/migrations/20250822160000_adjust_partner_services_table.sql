-- Migration to adjust the partner_services table

-- 1. Add the optional category_id column with a foreign key to service_categories
ALTER TABLE public.partner_services
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD CONSTRAINT fk_category
  FOREIGN KEY (category_id)
  REFERENCES public.service_categories(id)
  ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partner_services_category_id ON public.partner_services(category_id);

-- 2. Drop the estimated_days column
ALTER TABLE public.partner_services
DROP COLUMN IF EXISTS estimated_days;
