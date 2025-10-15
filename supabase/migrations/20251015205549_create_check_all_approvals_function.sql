-- Migration: Create check_all_approvals_completed function
-- Description: Function to check if all 3 approval tracks are completed and update quote status
-- Author: Rafael + GitHub Copilot
-- Date: 2025-10-15

-- Create function to check if all approvals are completed
CREATE OR REPLACE FUNCTION public.check_all_approvals_completed(p_quote_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_approval_status JSONB;
  v_admin_status TEXT;
  v_specialist_status TEXT;
  v_client_status TEXT;
  v_all_approved BOOLEAN;
BEGIN
  -- Get current approval_status
  SELECT approval_status INTO v_approval_status
  FROM public.quotes
  WHERE id = p_quote_id;
  
  IF v_approval_status IS NULL THEN
    RAISE EXCEPTION 'Quote % not found or approval_status is NULL', p_quote_id;
  END IF;
  
  -- Extract individual statuses
  v_admin_status := v_approval_status->>'admin';
  v_specialist_status := v_approval_status->>'specialist_time';
  v_client_status := v_approval_status->>'client';
  
  -- Check if all are approved
  v_all_approved := (
    v_admin_status = 'approved' AND
    v_specialist_status = 'approved' AND
    v_client_status = 'approved'
  );
  
  -- If all approved and status is not 'approved', update it
  IF v_all_approved THEN
    UPDATE public.quotes
    SET status = 'approved'
    WHERE id = p_quote_id
      AND status != 'approved';
      
    IF FOUND THEN
      RAISE NOTICE '✅ Quote % status updated to approved (all 3 tracks completed)', p_quote_id;
    END IF;
  END IF;
  
  RETURN v_all_approved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function comment
COMMENT ON FUNCTION public.check_all_approvals_completed(UUID) IS 
'Checks if all 3 approval tracks (admin, specialist_time, client) are completed. Updates quote status to approved if all are approved.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_all_approvals_completed(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_all_approvals_completed(UUID) TO authenticated;

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: check_all_approvals_completed function created';
  RAISE NOTICE '   • Function: public.check_all_approvals_completed(quote_id UUID)';
  RAISE NOTICE '   • Returns: BOOLEAN (true if all approved)';
  RAISE NOTICE '   • Side effect: Updates quote status to approved when all tracks complete';
  RAISE NOTICE '   • Permissions: granted to service_role and authenticated';
END $$;
