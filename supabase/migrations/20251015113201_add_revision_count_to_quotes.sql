-- Migration: Add revision_count to quotes table
-- Purpose: Track how many times a specialist has requested revisions for a quote
-- This prevents infinite revision loops by allowing max 3 revisions

-- Add the revision_count column with default 0
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0 NOT NULL;

-- Comment the column for documentation
COMMENT ON COLUMN quotes.revision_count IS 'Number of times specialist has requested time revisions for this quote. Used to limit revision loops (max 3).';

-- Populate existing records by counting revision_requested actions
UPDATE quotes 
SET revision_count = (
  SELECT COUNT(*) 
  FROM quote_time_reviews 
  WHERE quote_time_reviews.quote_id = quotes.id 
    AND quote_time_reviews.action = 'revision_requested'
)
WHERE revision_count = 0;

-- Create index for better query performance when filtering by revision_count
CREATE INDEX IF NOT EXISTS idx_quotes_revision_count 
ON quotes (revision_count) 
WHERE revision_count > 0;

-- Optional: Add constraint to prevent negative values (safety check)
ALTER TABLE quotes 
ADD CONSTRAINT check_revision_count_non_negative 
CHECK (revision_count >= 0);
