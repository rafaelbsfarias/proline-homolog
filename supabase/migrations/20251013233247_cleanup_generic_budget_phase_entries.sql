-- Migration: cleanup_generic_budget_phase_entries
-- Purpose: Remove generic "FASE ORÇAMENTÁRIA" entries from vehicle_history
-- Issue: The vehicle_history_trigger was creating generic entries when status was updated
-- Solution: Delete entries that match exactly "FASE ORÇAMENTÁRIA" (without category specification)
--          Keep entries like "Fase Orçamentária Iniciada - {Category}" which are correct

-- Clean up generic "FASE ORÇAMENTÁRIA" entries that were created by the trigger
-- These are different from the correct "Fase Orçamentária Iniciada - {Category}" entries
DELETE FROM vehicle_history
WHERE status = 'FASE ORÇAMENTÁRIA'
  AND status NOT ILIKE 'Fase Orçamentária Iniciada - %';

-- Log the cleanup
DO $$
DECLARE
  v_deleted_count int;
BEGIN
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count > 0 THEN
    RAISE NOTICE 'Removed % generic "FASE ORÇAMENTÁRIA" entries from vehicle_history', v_deleted_count;
  ELSE
    RAISE NOTICE 'No generic "FASE ORÇAMENTÁRIA" entries found to remove';
  END IF;
END $$;
