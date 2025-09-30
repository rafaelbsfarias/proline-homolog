-- Add columns for admin review functionality to quotes table
-- This allows partners to send quotes for admin review and lock editing

DO $$
BEGIN
  -- Add locked_for_editing column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'locked_for_editing'
  ) THEN
    ALTER TABLE public.quotes 
    ADD COLUMN locked_for_editing boolean DEFAULT false NOT NULL;
  END IF;

  -- Add sent_to_admin_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'sent_to_admin_at'
  ) THEN
    ALTER TABLE public.quotes 
    ADD COLUMN sent_to_admin_at timestamp with time zone;
  END IF;

  -- Add admin_reviewed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'admin_reviewed_at'
  ) THEN
    ALTER TABLE public.quotes 
    ADD COLUMN admin_reviewed_at timestamp with time zone;
  END IF;

  -- Add admin_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE public.quotes 
    ADD COLUMN admin_notes text;
  END IF;
END $$;

-- Update existing status enum if needed (add admin_review status)
-- First check if the enum type allows admin_review
DO $$
BEGIN
  -- Check if quote_status enum exists and add admin_review if not present
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'quote_status') 
      AND enumlabel = 'admin_review'
    ) THEN
      ALTER TYPE quote_status ADD VALUE 'admin_review';
    END IF;
  END IF;
END $$;

-- Create index for locked quotes
CREATE INDEX IF NOT EXISTS idx_quotes_locked 
ON public.quotes(locked_for_editing) 
WHERE locked_for_editing = true;

-- Note: Index for admin_review status will be created in a separate migration
-- to avoid enum transaction issues

-- Add comments for documentation
COMMENT ON COLUMN public.quotes.locked_for_editing IS 'Prevents editing when quote is under admin review';
COMMENT ON COLUMN public.quotes.sent_to_admin_at IS 'Timestamp when quote was sent to admin for review';
COMMENT ON COLUMN public.quotes.admin_reviewed_at IS 'Timestamp when admin completed review';
COMMENT ON COLUMN public.quotes.admin_notes IS 'Admin notes/feedback on the quote';
