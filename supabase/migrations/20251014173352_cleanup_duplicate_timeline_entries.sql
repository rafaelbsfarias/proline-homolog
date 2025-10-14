-- Migration: Cleanup duplicate timeline entries
-- Issue: save-anomalies endpoint was creating duplicate "Fase Orçamentária Iniciada" entries
-- Solution: Keep only the earliest entry for each vehicle_id + status combination

-- Remove duplicate timeline entries, keeping only the oldest one for each vehicle + status
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY vehicle_id, status 
      ORDER BY created_at ASC
    ) as rn
  FROM vehicle_history
  WHERE status ILIKE 'Fase Orçamentária Iniciada - %'
)
DELETE FROM vehicle_history
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- Log resultado
DO $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count > 0 THEN
    RAISE NOTICE 'Removed % duplicate "Fase Orçamentária Iniciada" entries', v_deleted_count;
  ELSE
    RAISE NOTICE 'No duplicate entries found';
  END IF;
END $$;
