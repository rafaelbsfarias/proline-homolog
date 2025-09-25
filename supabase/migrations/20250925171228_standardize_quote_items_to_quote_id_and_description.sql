-- Standardize quote_items to use quote_id FK and description field
-- Defensive migration: handles presence/absence of columns to avoid errors

DO $$
BEGIN
  -- 1) Ensure quote_id column exists on quote_items
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'quote_id'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN quote_id uuid;
  END IF;

  -- 2) If budget_id exists but quote_id is null, backfill quote_id from budget_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'budget_id'
  ) THEN
    -- backfill
    UPDATE public.quote_items SET quote_id = COALESCE(quote_id, budget_id) WHERE quote_id IS NULL;
  END IF;

  -- 3) Create FK and index for quote_id if not present
  -- Index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_quote_items_quote_id'
  ) THEN
    CREATE INDEX idx_quote_items_quote_id ON public.quote_items(quote_id);
  END IF;

  -- Drop old FK pointing to budget_id if exists (best-effort)
  -- Then create FK for quote_id
  BEGIN
    ALTER TABLE public.quote_items
      DROP CONSTRAINT IF EXISTS quote_items_budget_id_fkey,
      DROP CONSTRAINT IF EXISTS quote_items_quote_id_fkey;
  EXCEPTION WHEN undefined_object THEN
    -- ignore
  END;

  -- Create new FK to quotes(id) if not exists
  BEGIN
    ALTER TABLE public.quote_items
      ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
  END;

  -- 4) Make quote_id NOT NULL if data allows (only when no nulls remain)
  IF NOT EXISTS (
    SELECT 1 FROM public.quote_items WHERE quote_id IS NULL LIMIT 1
  ) THEN
    ALTER TABLE public.quote_items ALTER COLUMN quote_id SET NOT NULL;
  END IF;

  -- 5) Standardize description column (migrate from notes when present)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN description text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'notes'
  ) THEN
    UPDATE public.quote_items SET description = COALESCE(description, notes) WHERE notes IS NOT NULL;
  END IF;

  -- 6) Optional: drop legacy columns if safe
  -- Drop budget_id if fully migrated and not used elsewhere
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'budget_id'
  ) THEN
    BEGIN
      ALTER TABLE public.quote_items DROP COLUMN budget_id;
    EXCEPTION WHEN dependent_objects_still_exist THEN
      -- keep legacy column if referenced elsewhere
    END;
  END IF;

  -- Drop notes column after migration
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_items' AND column_name = 'notes'
  ) THEN
    BEGIN
      ALTER TABLE public.quote_items DROP COLUMN notes;
    EXCEPTION WHEN dependent_objects_still_exist THEN
      -- keep if referenced
    END;
  END IF;
END $$;

COMMENT ON INDEX public.idx_quote_items_quote_id IS 'Accelerates lookups of quote_items by quote_id';
