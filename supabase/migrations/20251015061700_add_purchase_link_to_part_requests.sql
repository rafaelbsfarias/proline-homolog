-- Migration: Add purchase_link to part_requests table
-- Purpose: Add optional purchase link field for part requests
-- Created: 2025-10-15

-- Add purchase_link column to part_requests table
ALTER TABLE part_requests
ADD COLUMN IF NOT EXISTS purchase_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN part_requests.purchase_link IS 'Optional URL link to purchase the part online';