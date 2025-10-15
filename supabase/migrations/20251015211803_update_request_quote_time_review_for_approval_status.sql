-- Migration: Update request_quote_time_review function for approval_status
-- Description: Updates the function to work with the new 3-track approval system
-- Date: 2025-10-15

CREATE OR REPLACE FUNCTION public.request_quote_time_review(
  p_quote_id UUID,
  p_specialist_id UUID,
  p_comments TEXT DEFAULT NULL,
  p_revision_requests JSONB DEFAULT NULL,
  p_reviewed_item_ids UUID[] DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  current_revision_count INT;
  current_approval_status JSONB;
BEGIN
  -- Lock the quote row and get current revision count and approval_status
  SELECT revision_count, approval_status 
  INTO current_revision_count, current_approval_status
  FROM public.quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  -- Check revision limit (max 3 revisions)
  IF COALESCE(current_revision_count, 0) >= 3 THEN
    RAISE EXCEPTION 'Limite de revisões atingido (máximo 3)';
  END IF;

  -- Insert the review record with decision field
  INSERT INTO public.quote_time_reviews (
    quote_id,
    specialist_id,
    action,
    decision,
    comments,
    revision_requests,
    reviewed_item_ids,
    created_by
  ) VALUES (
    p_quote_id,
    p_specialist_id,
    'revision_requested',
    'revision_requested',
    COALESCE(p_comments, ''),
    COALESCE(p_revision_requests, '{}'::jsonb),
    COALESCE(p_reviewed_item_ids, ARRAY[]::UUID[]),
    p_specialist_id
  );

  -- Update approval_status.specialist_time to 'revision_requested'
  UPDATE public.quotes
  SET
    approval_status = jsonb_set(
      COALESCE(current_approval_status, '{"admin": "pending", "specialist_time": "pending", "client": "pending"}'::jsonb),
      '{specialist_time}',
      '"revision_requested"'::jsonb
    ),
    revision_count = COALESCE(current_revision_count, 0) + 1
  WHERE id = p_quote_id;

  -- Log successful operation
  RAISE NOTICE 'Quote time revision requested successfully for quote %', p_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission (idempotent)
GRANT EXECUTE ON FUNCTION public.request_quote_time_review(UUID, UUID, TEXT, JSONB, UUID[]) TO authenticated;

-- Update comment
COMMENT ON FUNCTION public.request_quote_time_review(UUID, UUID, TEXT, JSONB, UUID[]) IS
'Creates a time revision request for a quote. Updates approval_status.specialist_time to revision_requested. Part of the 3-track approval system.';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: request_quote_time_review function updated';
  RAISE NOTICE '   • Now updates approval_status.specialist_time field';
  RAISE NOTICE '   • Compatible with 3-track approval system';
END $$;
