-- Migration: Create trigger for auto-updating quote status on approval
-- Description: Automatically checks and updates quote status when approval_status changes
-- Author: Rafael + GitHub Copilot
-- Date: 2025-10-15

-- Create trigger function
CREATE OR REPLACE FUNCTION public.trigger_check_all_approvals()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if approval_status was actually modified
  IF (TG_OP = 'UPDATE' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status) OR
     (TG_OP = 'INSERT') THEN
    
    -- Call the check function (it will update status if needed)
    PERFORM public.check_all_approvals_completed(NEW.id);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function comment
COMMENT ON FUNCTION public.trigger_check_all_approvals() IS 
'Trigger function that automatically checks if all approvals are completed when approval_status changes.';

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS auto_check_approvals_on_update ON public.quotes;

-- Create trigger on quotes table
CREATE TRIGGER auto_check_approvals_on_update
  AFTER INSERT OR UPDATE OF approval_status ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_all_approvals();

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: auto-approval trigger created';
  RAISE NOTICE '   • Trigger: auto_check_approvals_on_update';
  RAISE NOTICE '   • Table: public.quotes';
  RAISE NOTICE '   • Events: INSERT, UPDATE (approval_status column)';
  RAISE NOTICE '   • Function: trigger_check_all_approvals()';
  RAISE NOTICE '   • Behavior: Automatically updates status to approved when all 3 tracks complete';
END $$;
