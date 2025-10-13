-- Migration: Update review_status constraint to include pending_approval and rejected
-- Created: 2025-10-13
-- Description: Adiciona novos status ao campo review_status para permitir fluxo completo de aprovação/rejeição

-- Drop old constraint
ALTER TABLE partner_services 
DROP CONSTRAINT IF EXISTS partner_services_review_status_check;

-- Add new constraint with pending_approval and rejected
ALTER TABLE partner_services 
ADD CONSTRAINT partner_services_review_status_check 
CHECK (review_status IN ('approved', 'pending_review', 'pending_approval', 'rejected', 'in_revision'));

-- Comment
COMMENT ON CONSTRAINT partner_services_review_status_check ON partner_services IS 
'Allowed review statuses: approved, pending_review, pending_approval, rejected, in_revision';
