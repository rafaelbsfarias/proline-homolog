-- Migration: Add approval_status JSONB column to quotes table
-- Description: Creates JSONB column to track approval status for 3 independent tracks (admin, specialist_time, client)
-- Author: Rafael + GitHub Copilot
-- Date: 2025-10-15

-- Add approval_status column with default structure
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS approval_status JSONB DEFAULT '{"admin": "pending", "specialist_time": "pending", "client": "pending"}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.quotes.approval_status IS 
'Tracks approval status for 3 independent tracks. Structure: {"admin": "pending|approved|revision_requested", "specialist_time": "pending|approved|revision_requested", "client": "pending|approved|rejected"}';

-- Create index for faster queries on approval_status
CREATE INDEX IF NOT EXISTS idx_quotes_approval_status ON public.quotes USING gin (approval_status);

-- Backfill existing quotes with default approval_status
UPDATE public.quotes
SET approval_status = '{"admin": "pending", "specialist_time": "pending", "client": "pending"}'::jsonb
WHERE approval_status IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE public.quotes
ALTER COLUMN approval_status SET NOT NULL;

-- Add validation constraint to ensure correct structure
ALTER TABLE public.quotes
ADD CONSTRAINT check_approval_status_structure CHECK (
  approval_status ? 'admin' AND
  approval_status ? 'specialist_time' AND
  approval_status ? 'client'
);

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: approval_status column added to quotes table';
  RAISE NOTICE '   • Column type: JSONB';
  RAISE NOTICE '   • Default value: {"admin": "pending", "specialist_time": "pending", "client": "pending"}';
  RAISE NOTICE '   • Index created: idx_quotes_approval_status';
  RAISE NOTICE '   • Existing quotes backfilled';
END $$;
