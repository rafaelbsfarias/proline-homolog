-- Migration created with: supabase migration new partner_send_quote_to_admin
-- Purpose: Atomically set quote to pending_admin_approval and update related vehicle status
-- Idempotent: drops and recreates the function safely

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'partner_send_quote_to_admin'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.partner_send_quote_to_admin(uuid, uuid, text);
  END IF;
END $$;

CREATE FUNCTION public.partner_send_quote_to_admin(
  p_partner_id uuid,
  p_quote_id uuid,
  p_vehicle_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vehicle_id uuid;
  v_updated int;
BEGIN
  PERFORM set_config('search_path', 'public', false);

  IF p_partner_id IS NULL OR p_quote_id IS NULL OR coalesce(trim(p_vehicle_status),'') = '' THEN
    RAISE EXCEPTION 'invalid_parameters';
  END IF;

  -- Update quote (only if belongs to partner)
  UPDATE quotes q
     SET status = 'pending_admin_approval',
         locked_for_editing = TRUE,
         sent_to_admin_at = now()
   WHERE q.id = p_quote_id
     AND q.partner_id = p_partner_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'quote_not_found_or_not_owned_by_partner';
  END IF;

  -- Resolve vehicle_id via service_order
  SELECT so.vehicle_id INTO v_vehicle_id
    FROM service_orders so
    JOIN quotes q ON q.service_order_id = so.id
   WHERE q.id = p_quote_id
   LIMIT 1;

  IF v_vehicle_id IS NULL THEN
    RAISE EXCEPTION 'vehicle_not_found_for_quote';
  END IF;

  -- Update vehicle status
  UPDATE vehicles v
     SET status = p_vehicle_status
   WHERE v.id = v_vehicle_id;

  RETURN json_build_object(
    'ok', true,
    'quote_id', p_quote_id,
    'vehicle_id', v_vehicle_id,
    'status', p_vehicle_status
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.partner_send_quote_to_admin(uuid, uuid, text)
IS 'Sets quote to pending_admin_approval and updates vehicle status. SECURITY DEFINER with ownership check.';

