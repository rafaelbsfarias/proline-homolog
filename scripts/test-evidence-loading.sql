-- Script de verificação de evidências
-- Testa se as evidências estão sendo salvas e carregadas corretamente

\echo '=========================================='
\echo '🔍 TESTE DE CARREGAMENTO DE EVIDÊNCIAS'
\echo '=========================================='
\echo ''

-- 1. Verificar estrutura da tabela
\echo '📋 1. Estrutura da tabela mechanics_checklist_evidences:'
\d mechanics_checklist_evidences

\echo ''
\echo '=========================================='

-- 2. Verificar evidências salvas para o quote de teste
\echo '📊 2. Evidências salvas para quote_id 4d7d160a-1c8e-47e4-853e-efa9da78bdc9:'
SELECT 
  id,
  item_key,
  LEFT(storage_path, 60) || '...' as storage_path_preview,
  CASE 
    WHEN storage_path LIKE '%/itens/%' THEN '❌ PASTA ANTIGA (itens)'
    WHEN storage_path LIKE '%/evidences/%' THEN '✅ PASTA NOVA (evidences)'
    ELSE '⚠️  OUTRO PADRÃO'
  END as estrutura_pasta,
  created_at
FROM mechanics_checklist_evidences
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
ORDER BY created_at DESC
LIMIT 10;

\echo ''
\echo '=========================================='

-- 3. Contagem por padrão de pasta
\echo '📈 3. Contagem de evidências por estrutura de pasta:'
SELECT 
  CASE 
    WHEN storage_path LIKE '%/itens/%' THEN 'itens (antiga)'
    WHEN storage_path LIKE '%/evidences/%' THEN 'evidences (nova)'
    ELSE 'outro'
  END as tipo_pasta,
  COUNT(*) as quantidade
FROM mechanics_checklist_evidences
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
GROUP BY tipo_pasta;

\echo ''
\echo '=========================================='

-- 4. Verificar evidências por item_key
\echo '🔑 4. Evidências agrupadas por item_key:'
SELECT 
  item_key,
  COUNT(*) as quantidade_evidencias,
  STRING_AGG(DISTINCT 
    CASE 
      WHEN storage_path LIKE '%/itens/%' THEN 'itens'
      WHEN storage_path LIKE '%/evidences/%' THEN 'evidences'
      ELSE 'outro'
    END, ', ') as tipos_pasta
FROM mechanics_checklist_evidences
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
GROUP BY item_key
ORDER BY item_key;

\echo ''
\echo '=========================================='

-- 5. Verificar se há evidências em outras quotes
\echo '📦 5. Total de evidências em todas as quotes:'
SELECT 
  COUNT(*) as total_evidencias,
  COUNT(DISTINCT quote_id) as quotes_com_evidencias,
  COUNT(DISTINCT item_key) as items_com_evidencias
FROM mechanics_checklist_evidences;

\echo ''
\echo '=========================================='
\echo '✅ Teste concluído!'
\echo '=========================================='
