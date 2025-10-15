-- Migration: Add part_request column to mechanics_checklist_items
-- This allows storing part purchase requests directly in checklist items

-- Add part_request column as JSONB to store structured data
ALTER TABLE mechanics_checklist_items
ADD COLUMN IF NOT EXISTS part_request JSONB DEFAULT NULL;

-- Create index for querying items with part requests
CREATE INDEX IF NOT EXISTS idx_mci_part_request_not_null 
  ON mechanics_checklist_items(inspection_id) 
  WHERE part_request IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mci_part_request_by_quote
  ON mechanics_checklist_items(quote_id)
  WHERE part_request IS NOT NULL;

-- Add comment
COMMENT ON COLUMN mechanics_checklist_items.part_request IS 
'JSONB field storing part purchase request data: {partName, partDescription, quantity, estimatedPrice}';

-- Example of part_request structure:
-- {
--   "partName": "Pastilha de Freio",
--   "partDescription": "Pastilha de freio dianteira original",
--   "quantity": 1,
--   "estimatedPrice": 250.00
-- }
