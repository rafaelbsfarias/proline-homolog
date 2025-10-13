-- Migration: Add estimated_days to quote_items
-- Purpose: Allow partners to specify estimated completion time for each service in a quote
-- Business Rule: Each service in a quote can have an estimated number of days for completion

-- Add estimated_days column
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS estimated_days INTEGER;

-- Add check constraint to ensure positive values
ALTER TABLE public.quote_items
ADD CONSTRAINT quote_items_estimated_days_positive 
CHECK (estimated_days IS NULL OR estimated_days > 0);

-- Add index for queries that filter by estimated_days
CREATE INDEX IF NOT EXISTS idx_quote_items_estimated_days 
ON public.quote_items(estimated_days);

-- Add comment for documentation
COMMENT ON COLUMN public.quote_items.estimated_days IS 
'Estimativa em dias para conclusão do serviço. Valor positivo ou NULL.';

-- Update existing records to have a default of NULL (no breaking changes)
-- Partners can update this value when creating or editing quotes
