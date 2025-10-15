CREATE OR REPLACE FUNCTION request_quote_time_review(
  p_quote_id UUID,
  p_specialist_id UUID,
  p_comments TEXT,
  p_revision_requests JSONB,
  p_reviewed_item_ids UUID[]
) RETURNS VOID AS $$
DECLARE
  current_revision_count INT;
BEGIN
  -- Lock the quote row and get current revision count
  SELECT revision_count INTO current_revision_count FROM public.quotes WHERE id = p_quote_id FOR UPDATE;

  -- Check revision limit
  IF COALESCE(current_revision_count, 0) >= 3 THEN
    RAISE EXCEPTION 'Limite de revisões atingido';
  END IF;

  -- Insert the review record
  INSERT INTO public.quote_time_reviews (quote_id, specialist_id, action, comments, revision_requests, reviewed_item_ids, created_by)
  VALUES (p_quote_id, p_specialist_id, 'revision_requested', p_comments, p_revision_requests, p_reviewed_item_ids, p_specialist_id);

  -- Update the quote status and increment revision_count
  UPDATE public.quotes
  SET
    status = 'specialist_time_revision_requested',
    revision_count = COALESCE(current_revision_count, 0) + 1
  WHERE id = p_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;