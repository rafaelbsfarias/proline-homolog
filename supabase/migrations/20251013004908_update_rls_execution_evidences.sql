-- Migration: Update RLS for execution_evidences to allow partner-managed CRUD via client
-- Idempotent: uses IF NOT EXISTS checks for policies and indexes

-- Ensure RLS is enabled on target table
ALTER TABLE IF EXISTS public.execution_evidences ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for policy predicates
CREATE INDEX IF NOT EXISTS idx_execution_evidences_quote_item_id
  ON public.execution_evidences (quote_item_id);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id
  ON public.quote_items (quote_id);

CREATE INDEX IF NOT EXISTS idx_quote_items_budget_id
  ON public.quote_items (budget_id);

-- Policy: partners can SELECT evidences for their own quotes' items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'execution_evidences' AND policyname = 'partners_select_evidences'
  ) THEN
    CREATE POLICY partners_select_evidences
      ON public.execution_evidences
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.quote_items qi
          JOIN public.quotes q ON q.id = COALESCE(qi.quote_id, qi.budget_id)
          WHERE qi.id = execution_evidences.quote_item_id
            AND q.partner_id = auth.uid()
        )
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'partner'
        )
      );
  END IF;
END
$$;

-- Policy: partners can INSERT evidences for their own quotes' items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'execution_evidences' AND policyname = 'partners_insert_evidences'
  ) THEN
    CREATE POLICY partners_insert_evidences
      ON public.execution_evidences
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.quote_items qi
          JOIN public.quotes q ON q.id = COALESCE(qi.quote_id, qi.budget_id)
          WHERE qi.id = execution_evidences.quote_item_id
            AND q.partner_id = auth.uid()
        )
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'partner'
        )
      );
  END IF;
END
$$;

-- Policy: partners can DELETE evidences for their own quotes' items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'execution_evidences' AND policyname = 'partners_delete_evidences'
  ) THEN
    CREATE POLICY partners_delete_evidences
      ON public.execution_evidences
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.quote_items qi
          JOIN public.quotes q ON q.id = COALESCE(qi.quote_id, qi.budget_id)
          WHERE qi.id = execution_evidences.quote_item_id
            AND q.partner_id = auth.uid()
        )
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'partner'
        )
      );
  END IF;
END
$$;
