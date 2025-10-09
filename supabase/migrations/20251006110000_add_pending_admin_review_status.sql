-- Add pending_admin_review status to mechanics_checklist

-- First, remove the old constraint
ALTER TABLE public.mechanics_checklist
DROP CONSTRAINT IF EXISTS mechanics_checklist_status_check;

-- Then, add the new constraint with the new status
ALTER TABLE public.mechanics_checklist
ADD CONSTRAINT mechanics_checklist_status_check
CHECK (status IN ('in_progress', 'completed', 'submitted', 'pending_admin_review'));
