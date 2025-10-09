-- Migration: partner_save_checklist_update_vehicle_status
-- Purpose: Update vehicle status to 'Fase Orçamentaria' when partner saves checklist
-- Idempotent: drops and recreates the function safely

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'partner_save_checklist_update_vehicle_status'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.partner_save_checklist_update_vehicle_status(uuid, uuid, text);
  END IF;
END $$;

CREATE FUNCTION public.partner_save_checklist_update_vehicle_status(
  p_partner_id uuid,
  p_vehicle_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_status text;
  v_history_id uuid;
  v_has_access boolean;
  v_service_category_name text;
BEGIN
  PERFORM set_config('search_path', 'public', false);

  -- Validação de parâmetros
  IF p_partner_id IS NULL OR p_vehicle_id IS NULL THEN
    RAISE EXCEPTION 'invalid_parameters';
  END IF;

  -- Verificar se o partner tem acesso ao veículo e obter categoria
  SELECT sc.name INTO v_service_category_name
  FROM quotes q
  JOIN service_orders so ON q.service_order_id = so.id
  JOIN inspection_services insp_svc ON so.inspection_service_id = insp_svc.id
  JOIN service_categories sc ON insp_svc.service_category_id = sc.id
  WHERE q.partner_id = p_partner_id
    AND so.vehicle_id = p_vehicle_id
    AND q.status = 'pending_partner'
  LIMIT 1;

  IF v_service_category_name IS NULL THEN
    RAISE EXCEPTION 'partner_does_not_have_access_to_vehicle_or_no_pending_quote';
  END IF;

  -- Construir novo status
  v_new_status := 'Fase Orçamentária Iniciada - ' || v_service_category_name;

  -- Atualizar status do veículo
  UPDATE vehicles
     SET status = 'Fase Orçamentaria'
   WHERE id = p_vehicle_id;

  -- Criar entrada no histórico do veículo
  INSERT INTO vehicle_history (vehicle_id, status, notes)
  VALUES (p_vehicle_id, v_new_status, 'Parceiro salvou checklist de anomalias')
  RETURNING id INTO v_history_id;

  RETURN json_build_object(
    'ok', true,
    'vehicle_id', p_vehicle_id,
    'status', 'Fase Orçamentaria',
    'history_entry', v_new_status,
    'history_id', v_history_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.partner_save_checklist_update_vehicle_status(uuid, uuid)
IS 'Updates vehicle status to "Fase Orçamentaria" and creates vehicle_history entry when partner saves checklist. SECURITY DEFINER with access check. Auto-detects service category from pending quote.';
