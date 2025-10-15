-- Migration: fix_duplicate_timeline_entries_budget_phase
-- Purpose: Make partner_save_checklist_update_vehicle_status idempotent to prevent duplicate timeline entries
-- Issue: Multiple API endpoints and this function were creating duplicate "Fase Orçamentária Iniciada" entries
-- Solution: Check if entry exists before inserting, remove duplicates if any exist

-- Step 1: Clean up existing duplicates
DO $$
DECLARE
  v_vehicle_id uuid;
  v_status text;
  v_min_id uuid;
  v_delete_count int;
BEGIN
  -- For each vehicle and "Fase Orçamentária Iniciada" status, keep only the earliest entry
  FOR v_vehicle_id, v_status IN
    SELECT DISTINCT vehicle_id, status
    FROM vehicle_history
    WHERE status ILIKE 'Fase Orçamentária Iniciada - %'
  LOOP
    -- Get the ID of the earliest entry (by created_at)
    SELECT id INTO v_min_id
    FROM vehicle_history
    WHERE vehicle_id = v_vehicle_id
      AND status = v_status
    ORDER BY created_at ASC
    LIMIT 1;

    -- Delete all duplicates (keep only the earliest)
    DELETE FROM vehicle_history
    WHERE vehicle_id = v_vehicle_id
      AND status = v_status
      AND id != v_min_id;

    GET DIAGNOSTICS v_delete_count = ROW_COUNT;

    IF v_delete_count > 0 THEN
      RAISE NOTICE 'Removed % duplicate entries for vehicle % with status %', v_delete_count, v_vehicle_id, v_status;
    END IF;
  END LOOP;
END $$;

-- Step 2: Update function to be idempotent
DROP FUNCTION IF EXISTS public.partner_save_checklist_update_vehicle_status(uuid, uuid);

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
  v_existing_history_id uuid;
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

  -- *** IDEMPOTÊNCIA: Verificar se já existe entrada na timeline com este status ***
  SELECT id INTO v_existing_history_id
  FROM vehicle_history
  WHERE vehicle_id = p_vehicle_id
    AND status = v_new_status
  LIMIT 1;

  -- Se já existe, retornar o ID existente; caso contrário, criar novo
  IF v_existing_history_id IS NOT NULL THEN
    v_history_id := v_existing_history_id;
    RAISE NOTICE 'Timeline entry already exists, skipping insert: %', v_new_status;
  ELSE
    -- Criar entrada no histórico do veículo
    INSERT INTO vehicle_history (vehicle_id, status, partner_service, notes)
    VALUES (p_vehicle_id, v_new_status, v_service_category_name, 'Parceiro salvou checklist de anomalias')
    RETURNING id INTO v_history_id;
  END IF;

  RETURN json_build_object(
    'ok', true,
    'vehicle_id', p_vehicle_id,
    'status', 'Fase Orçamentaria',
    'history_entry', v_new_status,
    'partner_service', v_service_category_name,
    'history_id', v_history_id,
    'was_duplicate', v_existing_history_id IS NOT NULL
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.partner_save_checklist_update_vehicle_status(uuid, uuid)
IS 'Updates vehicle status to "Fase Orçamentaria" and creates vehicle_history entry with partner_service when partner saves checklist. SECURITY DEFINER with access check. Auto-detects service category from pending quote. IDEMPOTENT - checks if entry exists before inserting.';
