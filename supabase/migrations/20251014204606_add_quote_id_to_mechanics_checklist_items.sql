-- Migration: Add quote_id column to mechanics_checklist_items table
-- This allows loading checklist items by quote_id in addition to inspection_id

-- Add quote_id column
ALTER TABLE mechanics_checklist_items
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mci_quote_id ON mechanics_checklist_items(quote_id);

-- Update unique constraint to include quote_id as alternative to inspection_id
-- Drop old constraint
ALTER TABLE mechanics_checklist_items
DROP CONSTRAINT IF EXISTS mechanics_checklist_items_inspection_id_item_key_key;

-- Add new constraint that allows either inspection_id OR quote_id + item_key to be unique
-- Note: We can't enforce UNIQUE on nullable columns directly, so we'll use a partial index
CREATE UNIQUE INDEX IF NOT EXISTS mechanics_checklist_items_inspection_item_unique
  ON mechanics_checklist_items (inspection_id, item_key)
  WHERE inspection_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS mechanics_checklist_items_quote_item_unique
  ON mechanics_checklist_items (quote_id, item_key)
  WHERE quote_id IS NOT NULL;

-- Add check constraint to ensure at least one ID is provided
ALTER TABLE mechanics_checklist_items
ADD CONSTRAINT check_has_inspection_or_quote
  CHECK (inspection_id IS NOT NULL OR quote_id IS NOT NULL);

-- Make inspection_id nullable since quote_id can be used instead
ALTER TABLE mechanics_checklist_items
ALTER COLUMN inspection_id DROP NOT NULL;

COMMENT ON COLUMN mechanics_checklist_items.quote_id IS 'Quote ID - alternative identifier to inspection_id for loading checklist items';
