-- Migration: Add 'finalized' status to quote_status enum
-- Ensures quotes can be marked as finalized after execution completion

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'quote_status' AND e.enumlabel = 'finalized'
    ) THEN
        ALTER TYPE quote_status ADD VALUE 'finalized';
    END IF;
END $$;

-- Update enum comment for documentation
COMMENT ON TYPE quote_status IS 'Quote statuses: pending_partner, pending_admin_approval, admin_review, pending_client_approval, specialist_time_approved, specialist_time_revision_requested, approved, rejected, finalized';

