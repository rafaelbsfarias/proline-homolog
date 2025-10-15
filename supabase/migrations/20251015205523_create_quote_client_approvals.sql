-- Migration: Create quote_client_approvals table
-- Description: Tracks client approval/rejection decisions on quotes
-- Author: Rafael + GitHub Copilot
-- Date: 2025-10-15

-- Create quote_client_approvals table
CREATE TABLE IF NOT EXISTS public.quote_client_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(profile_id) ON DELETE RESTRICT,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  rejection_reason TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.quote_client_approvals IS 
'Stores client approval/rejection decisions on quotes. Part of the 3-track approval system (Trilha Cliente).';

-- Add column comments
COMMENT ON COLUMN public.quote_client_approvals.decision IS 'Client decision: approved or rejected';
COMMENT ON COLUMN public.quote_client_approvals.rejection_reason IS 'Required when decision is rejected - explains why client rejected';
COMMENT ON COLUMN public.quote_client_approvals.comments IS 'Optional additional comments from client';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quote_client_approvals_quote_id ON public.quote_client_approvals(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_client_approvals_client_id ON public.quote_client_approvals(client_id);
CREATE INDEX IF NOT EXISTS idx_quote_client_approvals_decision ON public.quote_client_approvals(decision);
CREATE INDEX IF NOT EXISTS idx_quote_client_approvals_created_at ON public.quote_client_approvals(created_at DESC);

-- Add constraint: rejection_reason required when rejected
ALTER TABLE public.quote_client_approvals
ADD CONSTRAINT check_rejection_reason_when_rejected CHECK (
  (decision = 'rejected' AND rejection_reason IS NOT NULL) OR
  (decision = 'approved')
);

-- Enable RLS
ALTER TABLE public.quote_client_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view their own approvals
DROP POLICY IF EXISTS "Clients can view their own approvals" ON public.quote_client_approvals;
CREATE POLICY "Clients can view their own approvals" ON public.quote_client_approvals
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- RLS Policy: Clients can insert their own approvals
DROP POLICY IF EXISTS "Clients can insert their own approvals" ON public.quote_client_approvals;
CREATE POLICY "Clients can insert their own approvals" ON public.quote_client_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.profile_id = auth.uid()
    )
  );

-- RLS Policy: Admins can view all client approvals
DROP POLICY IF EXISTS "Admins can view all client approvals" ON public.quote_client_approvals;
CREATE POLICY "Admins can view all client approvals" ON public.quote_client_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.profile_id = auth.uid()
    )
  );

-- RLS Policy: Partners can view approvals for their quotes
DROP POLICY IF EXISTS "Partners can view client approvals for their quotes" ON public.quote_client_approvals;
CREATE POLICY "Partners can view client approvals for their quotes" ON public.quote_client_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_client_approvals.quote_id
        AND quotes.partner_id = auth.uid()
    )
  );

-- RLS Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access" ON public.quote_client_approvals;
CREATE POLICY "Service role has full access" ON public.quote_client_approvals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_quote_client_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quote_client_approvals_updated_at ON public.quote_client_approvals;
CREATE TRIGGER update_quote_client_approvals_updated_at
  BEFORE UPDATE ON public.quote_client_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quote_client_approvals_updated_at();

-- Grant permissions
GRANT ALL ON public.quote_client_approvals TO service_role;
GRANT SELECT, INSERT ON public.quote_client_approvals TO authenticated;

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: quote_client_approvals table created';
  RAISE NOTICE '   • Table structure: ✓';
  RAISE NOTICE '   • Indexes: 4 created';
  RAISE NOTICE '   • RLS policies: 5 created';
  RAISE NOTICE '   • Triggers: updated_at trigger';
  RAISE NOTICE '   • Permissions: granted';
  RAISE NOTICE '   • Constraint: rejection_reason required when rejected';
END $$;
