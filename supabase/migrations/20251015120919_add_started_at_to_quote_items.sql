-- Migration: Add started_at timestamp to quote_items
-- Purpose: Track when service execution starts (not just when it's completed)

-- Add started_at column
ALTER TABLE quote_items 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quote_items_started_at 
ON quote_items (started_at) 
WHERE started_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN quote_items.started_at IS 'Timestamp quando o parceiro iniciou a execução deste serviço';

-- Optional: Add constraint to ensure started_at is before completed_at
ALTER TABLE quote_items 
ADD CONSTRAINT check_started_before_completed 
CHECK (started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at);
