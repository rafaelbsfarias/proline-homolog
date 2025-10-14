-- Script para verificar dados do checklist
-- Substitua o quote_id pelo seu ID real

\echo '=== 1. CHECKLIST PRINCIPAL ==='
SELECT 
  id,
  vehicle_id,
  inspection_id,
  quote_id,
  status,
  general_observations,
  created_at,
  updated_at
FROM mechanics_checklist
WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e';

\echo '\n=== 2. CHECKLIST ITEMS (com part_requests) ==='
SELECT 
  id,
  item_key,
  item_status,
  item_notes,
  CASE 
    WHEN part_request IS NOT NULL THEN 'SIM'
    ELSE 'NÃO'
  END as tem_part_request,
  part_request::text as part_request_json,
  quote_id,
  inspection_id,
  created_at
FROM mechanics_checklist_items
WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e'
ORDER BY created_at DESC;

\echo '\n=== 3. EVIDÊNCIAS ==='
SELECT 
  id,
  item_key,
  storage_path,
  quote_id,
  inspection_id,
  created_at
FROM mechanics_checklist_evidence
WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e'
ORDER BY created_at DESC;

\echo '\n=== 4. RESUMO ==='
SELECT 
  (SELECT COUNT(*) FROM mechanics_checklist WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e') as total_checklists,
  (SELECT COUNT(*) FROM mechanics_checklist_items WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e') as total_items,
  (SELECT COUNT(*) FROM mechanics_checklist_items WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e' AND part_request IS NOT NULL) as items_com_part_request,
  (SELECT COUNT(*) FROM mechanics_checklist_evidence WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e') as total_evidencias;

\echo '\n=== 5. EXEMPLO DE PART_REQUEST ==='
SELECT 
  item_key,
  part_request
FROM mechanics_checklist_items
WHERE quote_id = 'c03deec9-1043-4d90-8308-0e4b1c83f92e'
  AND part_request IS NOT NULL
LIMIT 1;
