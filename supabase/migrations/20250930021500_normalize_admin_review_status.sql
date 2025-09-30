-- Normalize legacy quote status 'admin_review' into 'pending_admin_approval'
-- Safe to run multiple times

DO $$
BEGIN
  -- If column exists and enum supports both values, update rows
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'status'
  ) THEN
    UPDATE public.quotes
       SET status = 'pending_admin_approval'
     WHERE status = 'admin_review';
  END IF;
END $$;

COMMENT ON SCHEMA public IS 'Normalized quotes.status: admin_review -> pending_admin_approval';

