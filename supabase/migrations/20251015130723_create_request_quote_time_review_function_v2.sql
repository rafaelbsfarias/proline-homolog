-- Migration: Create request_quote_time_review function (idempotent)
-- Description: Creates or replaces the function for handling quote time revision requests
-- This migration is idempotent and can be run multiple times safely

CREATE OR REPLACE FUNCTION public.request_quote_time_review(
  p_quote_id UUID,
  p_specialist_id UUID,
  p_comments TEXT DEFAULT NULL,
  p_revision_requests JSONB DEFAULT NULL,
  p_reviewed_item_ids UUID[] DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  current_revision_count INT;
BEGIN
  -- Lock the quote row and get current revision count
  SELECT revision_count INTO current_revision_count
  FROM public.quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  -- Check revision limit (max 3 revisions)
  IF COALESCE(current_revision_count, 0) >= 3 THEN
    RAISE EXCEPTION 'Limite de revisões atingido (máximo 3)';
  END IF;

  -- Insert the review record
  INSERT INTO public.quote_time_reviews (
    quote_id,
    specialist_id,
    action,
    comments,
    revision_requests,
    reviewed_item_ids,
    created_by
  ) VALUES (
    p_quote_id,
    p_specialist_id,
    'revision_requested',
    COALESCE(p_comments, ''),
    COALESCE(p_revision_requests, '{}'::jsonb),
    COALESCE(p_reviewed_item_ids, ARRAY[]::UUID[]),
    p_specialist_id
  );

  -- Update the quote status and increment revision_count
  UPDATE public.quotes
  SET
    status = 'specialist_time_revision_requested',
    revision_count = COALESCE(current_revision_count, 0) + 1
  WHERE id = p_quote_id;

  -- Log successful operation
  RAISE NOTICE 'Quote time revision requested successfully for quote %', p_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.request_quote_time_review(UUID, UUID, TEXT, JSONB, UUID[]) TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.request_quote_time_review(UUID, UUID, TEXT, JSONB, UUID[]) IS
'Creates a time revision request for a quote. Idempotent function that handles the complete revision workflow.';