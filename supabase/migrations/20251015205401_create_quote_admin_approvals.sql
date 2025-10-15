-- Migration: Create quote_admin_approvals table
-- Description: Tracks admin approval decisions on quote values
-- Author: Rafael + GitHub Copilot
-- Date: 2025-10-15

-- Create quote_admin_approvals table
CREATE TABLE IF NOT EXISTS public.quote_admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.admins(profile_id) ON DELETE RESTRICT,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'revision_requested')),
  comments TEXT,
  reviewed_values JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.quote_admin_approvals IS 
'Stores admin approval decisions on quote values. Part of the 3-track approval system (Trilha Admin).';

-- Add column comments
COMMENT ON COLUMN public.quote_admin_approvals.decision IS 'Admin decision: approved or revision_requested';
COMMENT ON COLUMN public.quote_admin_approvals.comments IS 'Optional comments explaining the decision or requesting changes';
COMMENT ON COLUMN public.quote_admin_approvals.reviewed_values IS 'Snapshot of values reviewed by admin at approval time';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quote_admin_approvals_quote_id ON public.quote_admin_approvals(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_admin_approvals_admin_id ON public.quote_admin_approvals(admin_id);
CREATE INDEX IF NOT EXISTS idx_quote_admin_approvals_decision ON public.quote_admin_approvals(decision);
CREATE INDEX IF NOT EXISTS idx_quote_admin_approvals_created_at ON public.quote_admin_approvals(created_at DESC);

-- Enable RLS
ALTER TABLE public.quote_admin_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all approvals
DROP POLICY IF EXISTS "Admins can view all approvals" ON public.quote_admin_approvals;
CREATE POLICY "Admins can view all approvals" ON public.quote_admin_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.profile_id = auth.uid()
    )
  );

-- RLS Policy: Admins can insert their own approvals
DROP POLICY IF EXISTS "Admins can insert their own approvals" ON public.quote_admin_approvals;
CREATE POLICY "Admins can insert their own approvals" ON public.quote_admin_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.profile_id = auth.uid()
    )
  );

-- RLS Policy: Partners can view approvals for their quotes
DROP POLICY IF EXISTS "Partners can view approvals for their quotes" ON public.quote_admin_approvals;
CREATE POLICY "Partners can view approvals for their quotes" ON public.quote_admin_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_admin_approvals.quote_id
        AND quotes.partner_id = auth.uid()
    )
  );

-- RLS Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access" ON public.quote_admin_approvals;
CREATE POLICY "Service role has full access" ON public.quote_admin_approvals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_quote_admin_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quote_admin_approvals_updated_at ON public.quote_admin_approvals;
CREATE TRIGGER update_quote_admin_approvals_updated_at
  BEFORE UPDATE ON public.quote_admin_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quote_admin_approvals_updated_at();

-- Grant permissions
GRANT ALL ON public.quote_admin_approvals TO service_role;
GRANT SELECT, INSERT ON public.quote_admin_approvals TO authenticated;

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: quote_admin_approvals table created';
  RAISE NOTICE '   • Table structure: ✓';
  RAISE NOTICE '   • Indexes: 4 created';
  RAISE NOTICE '   • RLS policies: 4 created';
  RAISE NOTICE '   • Triggers: updated_at trigger';
  RAISE NOTICE '   • Permissions: granted';
END $$;
