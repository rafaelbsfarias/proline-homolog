-- Add 'pending_specialist_approval' status to quote_status enum
-- This status comes BEFORE pending_admin_approval in the workflow:
-- 1. pending_specialist_approval (specialist reviews time estimates)
-- 2. pending_admin_approval (admin approves the quote)
-- 3. approved (final approval)

DO $$ BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'public.quote_status'::regtype 
        AND enumlabel = 'pending_specialist_approval'
    ) THEN
        ALTER TYPE public.quote_status ADD VALUE 'pending_specialist_approval';
        RAISE NOTICE 'Added pending_specialist_approval to quote_status enum';
    ELSE
        RAISE NOTICE 'pending_specialist_approval already exists in quote_status enum';
    END IF;
END $$;

-- Add comment to explain the workflow
COMMENT ON TYPE public.quote_status IS 
'Quote status workflow:
1. pending_specialist_approval - Specialist reviews time estimates
2. pending_admin_approval - Admin approves the quote  
3. approved - Final approval
4. specialist_time_revision_requested - Specialist requests changes to time estimates
5. admin_review - Admin reviews partner updates
6. specialist_time_approved - Specialist approved time estimates
7. pending_client_approval - Client approves the quote
8. rejected - Quote was rejected
9. pending_partner - Partner needs to take action
10. queued - Quote is queued for processing';
