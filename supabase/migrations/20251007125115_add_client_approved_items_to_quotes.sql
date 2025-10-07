-- Migration: Add client_approved_items to quotes table
-- This field stores the IDs of items approved by the client
-- Allows partial approval by client (select which services to proceed with)

-- Add column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'client_approved_items'
    ) THEN
        ALTER TABLE quotes ADD COLUMN client_approved_items jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN quotes.client_approved_items IS 'Array of quote_item IDs approved by the client. If empty array, all items are approved. Enables partial approval by client.';
