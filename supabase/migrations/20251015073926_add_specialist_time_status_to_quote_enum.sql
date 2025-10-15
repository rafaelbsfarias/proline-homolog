-- Add new specialist time approval statuses to quote_status enum
-- This migration is idempotent

-- Add 'specialist_time_approved' status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'specialist_time_approved' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'quote_status')
    ) THEN
        ALTER TYPE quote_status ADD VALUE 'specialist_time_approved';
    END IF;
END $$;

-- Add 'specialist_time_revision_requested' status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'specialist_time_revision_requested' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'quote_status')
    ) THEN
        ALTER TYPE quote_status ADD VALUE 'specialist_time_revision_requested';
    END IF;
END $$;

-- Add comment explaining the new statuses
COMMENT ON TYPE quote_status IS 
'Status of quotes: 
- pending_admin_approval: Waiting for admin to approve
- pending_client_approval: Waiting for client to approve
- approved: Approved by admin
- rejected: Rejected
- specialist_time_approved: Specialist approved the estimated times
- specialist_time_revision_requested: Specialist requested revision of times';