-- Migration: Add review fields to partner_services
-- Purpose: Allow admin to request service review with specific feedback
-- Business Rule: Admin can mark service for review specifying what needs revision

-- Add review status column
ALTER TABLE public.partner_services
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('approved', 'pending_review', 'in_revision'));

-- Add review feedback column
ALTER TABLE public.partner_services
ADD COLUMN IF NOT EXISTS review_feedback TEXT;

-- Add review requested at timestamp
ALTER TABLE public.partner_services
ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;

-- Add review requested by (admin user_id)
ALTER TABLE public.partner_services
ADD COLUMN IF NOT EXISTS review_requested_by UUID REFERENCES auth.users(id);

-- Add index for review status queries
CREATE INDEX IF NOT EXISTS idx_partner_services_review_status 
ON public.partner_services(review_status);

-- Add compound index for partner + review status
CREATE INDEX IF NOT EXISTS idx_partner_services_partner_review 
ON public.partner_services(partner_id, review_status);

-- Comments for documentation
COMMENT ON COLUMN public.partner_services.review_status IS 
'Status da revisão: approved (aprovado), pending_review (aguardando revisão do parceiro), in_revision (parceiro está revisando)';

COMMENT ON COLUMN public.partner_services.review_feedback IS 
'Feedback do admin sobre o que precisa ser revisado (Nome, Descrição, Preço, etc)';

COMMENT ON COLUMN public.partner_services.review_requested_at IS 
'Timestamp de quando a revisão foi solicitada pelo admin';

COMMENT ON COLUMN public.partner_services.review_requested_by IS 
'ID do admin que solicitou a revisão';
