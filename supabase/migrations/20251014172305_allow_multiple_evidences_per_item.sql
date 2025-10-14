-- Migration: Allow multiple evidences per checklist item
-- Remove UNIQUE constraint to allow multiple evidences for the same item_key

-- 1) Drop the unique constraint
ALTER TABLE mechanics_checklist_evidences 
  DROP CONSTRAINT IF EXISTS mechanics_checklist_evidences_inspection_id_item_key_key;

-- 2) Add an index to maintain query performance
CREATE INDEX IF NOT EXISTS idx_mce_inspection_item 
  ON mechanics_checklist_evidences(inspection_id, item_key);

-- Note: This migration is idempotent
-- Running it multiple times will not cause errors
