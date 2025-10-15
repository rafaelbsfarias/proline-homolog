-- Migration: Add delivery dates to part_requests table
-- Purpose: Add estimated and actual delivery dates for part requests
-- Created: 2025-10-15

-- Add estimated delivery date column
ALTER TABLE part_requests
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;

-- Add actual delivery date column
ALTER TABLE part_requests
ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMPTZ;

-- Add check constraint to ensure actual_delivery_date is not before estimated_delivery_date
ALTER TABLE part_requests
ADD CONSTRAINT check_delivery_dates
CHECK (
  actual_delivery_date IS NULL OR
  estimated_delivery_date IS NULL OR
  actual_delivery_date >= estimated_delivery_date
);

-- Add index for estimated delivery date
CREATE INDEX IF NOT EXISTS idx_part_requests_estimated_delivery_date
ON part_requests(estimated_delivery_date);

-- Add index for actual delivery date
CREATE INDEX IF NOT EXISTS idx_part_requests_actual_delivery_date
ON part_requests(actual_delivery_date);

-- Update status enum to include 'ordered' status if not already present
-- Note: The status column already has a check constraint that includes 'ordered'

-- Add comments for documentation
COMMENT ON COLUMN part_requests.estimated_delivery_date IS 'Estimated delivery date when status changes to ordered';
COMMENT ON COLUMN part_requests.actual_delivery_date IS 'Actual delivery date when part is received';