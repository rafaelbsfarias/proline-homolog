-- Migration: Update partner_send_quote_to_admin for approval_status
-- Description: Updates function to initialize approval_status with 3 pending tracks when quote is sent
-- Date: 2025-10-15

CREATE OR REPLACE FUNCTION public.partner_send_quote_to_admin(
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
  -- Initialize approval_status with all 3 tracks as 'pending'
  UPDATE quotes q
     SET status = 'pending_admin_approval',
         locked_for_editing = TRUE,
         sent_to_admin_at = now(),
         approval_status = jsonb_build_object(
           'admin', 'pending',
           'specialist_time', 'pending',
           'client', 'pending'
         )
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
    'status', p_vehicle_status,
    'approval_status', jsonb_build_object(
      'admin', 'pending',
      'specialist_time', 'pending',
      'client', 'pending'
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.partner_send_quote_to_admin(uuid, uuid, text)
IS 'Sets quote to pending_admin_approval, initializes approval_status with 3 pending tracks, and updates vehicle status. Part of 3-track approval system.';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: partner_send_quote_to_admin function updated';
  RAISE NOTICE '   • Now initializes approval_status with 3 pending tracks';
  RAISE NOTICE '   • Compatible with 3-track approval system';
END $$;
