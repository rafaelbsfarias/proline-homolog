-- Script de Verificação: Part Requests no Checklist
-- Usage: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/verify-part-requests.sql

\echo '=========================================='
\echo '🔍 VERIFICAÇÃO DE PART REQUESTS'
\echo '=========================================='
\echo ''

-- 1. Verificar schema da tabela
\echo '=== 1. SCHEMA DA TABELA mechanics_checklist_items ==='
\echo ''
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'mechanics_checklist_items'
  AND column_name IN ('id', 'item_key', 'item_status', 'part_request', 'quote_id')
ORDER BY ordinal_position;

\echo ''
\echo '=== 2. ITEMS DO QUOTE DE TESTE ==='
\echo 'Quote ID: 4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
\echo ''
SELECT 
  id,
  item_key,
  item_status,
  LEFT(COALESCE(item_notes, ''), 50) as item_notes_preview,
  CASE 
    WHEN part_request IS NOT NULL THEN '✅ SIM'
    ELSE '❌ NÃO'
  END as tem_part_request,
  created_at
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
ORDER BY created_at DESC
LIMIT 10;

\echo ''
\echo '=== 3. ITEMS COM PART_REQUEST (todos os quotes) ==='
\echo ''
SELECT 
  COUNT(*) as total_items_com_part_request,
  COUNT(DISTINCT quote_id) as quotes_distintos,
  COUNT(DISTINCT item_key) as items_distintos
FROM mechanics_checklist_items 
WHERE part_request IS NOT NULL;

\echo ''
\echo '=== 4. EXEMPLO DE PART_REQUEST (se existir) ==='
\echo ''
SELECT 
  item_key,
  item_status,
  jsonb_pretty(part_request) as part_request_json,
  quote_id,
  created_at
FROM mechanics_checklist_items 
WHERE part_request IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

\echo ''
\echo '=== 5. DETALHES DO QUOTE DE TESTE ==='
\echo ''
SELECT 
  q.id as quote_id,
  q.status,
  p.company_name as partner,
  p.category as partner_category,
  v.brand,
  v.model,
  v.plate,
  q.created_at
FROM quotes q
JOIN partners p ON q.partner_id = p.profile_id
JOIN service_orders so ON q.service_order_id = so.id
JOIN vehicles v ON so.vehicle_id = v.id
WHERE q.id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';

\echo ''
\echo '=== 6. RESUMO POR ITEM_KEY (quote de teste) ==='
\echo ''
SELECT 
  item_key,
  item_status,
  CASE 
    WHEN part_request IS NOT NULL THEN '✅'
    ELSE '❌'
  END as part_req,
  CASE
    WHEN item_notes IS NOT NULL AND item_notes != '' THEN '✅'
    ELSE '❌'
  END as notas
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
ORDER BY 
  CASE item_status 
    WHEN 'NOK' THEN 1 
    WHEN 'ATT' THEN 2 
    WHEN 'OK' THEN 3 
  END,
  item_key;

\echo ''
\echo '=== 7. COMPARAÇÃO: EVIDENCES vs ITEMS ==='
\echo ''
SELECT 
  'Evidences' as tipo,
  COUNT(*) as total,
  COUNT(DISTINCT item_key) as items_distintos
FROM mechanics_checklist_evidences
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
UNION ALL
SELECT 
  'Items' as tipo,
  COUNT(*) as total,
  COUNT(DISTINCT item_key) as items_distintos
FROM mechanics_checklist_items
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';

\echo ''
\echo '=========================================='
\echo '✅ VERIFICAÇÃO CONCLUÍDA'
\echo '=========================================='
\echo ''
\echo '📊 INTERPRETAÇÃO DOS RESULTADOS:'
\echo ''
\echo '1. Se "tem_part_request" = ❌ NÃO:'
\echo '   → Bug confirmado: part_request não está sendo salvo'
\echo ''
\echo '2. Se "tem_part_request" = ✅ SIM:'
\echo '   → Verificar estrutura do JSON em "part_request_json"'
\echo '   → Deve conter: peca, quantidade, observacoes'
\echo ''
\echo '3. Se "total_items_com_part_request" = 0:'
\echo '   → Nenhum part_request foi salvo ainda (normal em dev)'
\echo ''
\echo '4. Comparar Evidences vs Items:'
\echo '   → Ambos devem ter registros se checklist foi salvo'
\echo ''
\echo '=========================================='
\echo '📄 Documentação: docs/BUG_PART_REQUESTS_NOT_SAVING.md'
\echo '=========================================='
