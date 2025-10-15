-- Migration: Add decision column to quote_time_reviews
-- Description: Adds explicit decision column to track specialist approval/revision decisions
-- Author: Rafael + GitHub Copilot
-- Date: 2025-10-15

-- Add decision column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quote_time_reviews'
      AND column_name = 'decision'
  ) THEN
    ALTER TABLE public.quote_time_reviews
    ADD COLUMN decision TEXT CHECK (decision IN ('approved', 'revision_requested'));
    
    RAISE NOTICE '✅ Column decision added to quote_time_reviews';
  ELSE
    RAISE NOTICE 'ℹ️  Column decision already exists in quote_time_reviews';
  END IF;
END $$;

-- Add column comment
COMMENT ON COLUMN public.quote_time_reviews.decision IS 
'Specialist decision on time estimates: approved or revision_requested';

-- Backfill existing records based on action column
-- The action column already contains the decision values we need
UPDATE public.quote_time_reviews
SET decision = action
WHERE decision IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quote_time_reviews_decision ON public.quote_time_reviews(decision);

-- Log success
DO $$
DECLARE
  v_approved_count INTEGER;
  v_revision_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_approved_count FROM public.quote_time_reviews WHERE decision = 'approved';
  SELECT COUNT(*) INTO v_revision_count FROM public.quote_time_reviews WHERE decision = 'revision_requested';
  
  RAISE NOTICE '✅ Migration completed: decision column added to quote_time_reviews';
  RAISE NOTICE '   • Column: decision (approved | revision_requested)';
  RAISE NOTICE '   • Index: idx_quote_time_reviews_decision';
  RAISE NOTICE '   • Backfill: % approved, % revision_requested', v_approved_count, v_revision_count;
END $$;
