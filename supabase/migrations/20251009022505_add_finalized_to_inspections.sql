-- Migration: Add finalized_at column to inspections table
-- This column tracks when a specialist finalized the inspection checklist

-- Add finalized_at column (nullable, will be set when inspection is finalized)
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

-- Add index for performance on finalized_at queries
CREATE INDEX IF NOT EXISTS idx_inspections_finalized_at 
ON public.inspections(finalized_at) WHERE finalized_at IS NOT NULL;

-- Add index for finding inspections by vehicle and finalization status
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_finalized_at 
ON public.inspections(vehicle_id, finalized_at);

-- Add comment for documentation
COMMENT ON COLUMN public.inspections.finalized_at IS 'Timestamp when the specialist finalized this inspection checklist';

