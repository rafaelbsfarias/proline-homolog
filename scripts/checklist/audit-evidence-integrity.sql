-- =====================================================
-- AUDIT: INTEGRIDADE DE EVIDÊNCIAS (STORAGE x BANCO)
-- Verifica correspondência entre mechanics_checklist_evidences.storage_path e storage.objects.name
-- Detecta caminhos antigos, prefixos temporários e órfãos (em ambas as pontas)
-- Uso: psql $DB_URL -f scripts/checklist/audit-evidence-integrity.sql
-- =====================================================
\echo '=========================================='
\echo '🖼️  AUDITORIA: Integridade das Evidências'
\echo '=========================================='
\echo ''

-- 1) Amostra das evidências e extração do possível path de storage
\echo '=== 1. Amostra de evidências (storage_path preview) ==='
SELECT 
  id,
  item_key,
  quote_id,
  LEFT(COALESCE(storage_path, ''), 90) AS storage_path_preview,
  CASE 
    WHEN storage_path ILIKE '%/itens/%' THEN '❌ pasta antiga (itens)'
    WHEN storage_path ILIKE '%/evidences/%' THEN '✅ pasta nova (evidences)'
    ELSE '⚠️  padrão desconhecido'
  END AS padrao
FROM mechanics_checklist_evidences
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '=== 2. Estatística por padrão de pasta ==='
SELECT 
  CASE 
    WHEN storage_path ILIKE '%/itens/%' THEN 'itens (antiga)'
    WHEN storage_path ILIKE '%/evidences/%' THEN 'evidences (nova)'
    ELSE 'outro'
  END AS tipo_pasta,
  COUNT(*) AS quantidade
FROM mechanics_checklist_evidences
GROUP BY tipo_pasta
ORDER BY quantidade DESC;

\echo ''
\echo '=== 3. Construção de chave de junção (storage_path -> storage.name) ==='
-- Considera 3 possibilidades de armazenamento no banco:
--  a) Caminho "curto" relativo ao bucket (ex: evidences/sparkPlugs/abc.jpg)
--  b) Caminho completo público do Supabase (ex: .../storage/v1/object/public/vehicle-media/evidences/...)
--  c) Caminho completo com querystring
WITH evidence_paths AS (
  SELECT 
    id,
    quote_id,
    item_key,
    storage_path AS storage_name_candidate
  FROM mechanics_checklist_evidences
)
SELECT 
  COUNT(*) AS total_evidences,
  COUNT(*) FILTER (WHERE storage_name_candidate ILIKE 'evidences/%') AS em_pasta_evidences,
  COUNT(*) FILTER (WHERE storage_name_candidate ILIKE 'itens/%') AS em_pasta_itens,
  COUNT(*) FILTER (WHERE storage_name_candidate ILIKE '%tmp/%' OR storage_name_candidate ILIKE '%/tmp/%') AS com_tmp,
  COUNT(*) FILTER (WHERE storage_name_candidate ILIKE '%/pre/%' OR storage_name_candidate ILIKE 'pre/%') AS com_pre
FROM evidence_paths;

\echo ''
\echo '=== 4. Evidências sem correspondência no Storage (órfãs no banco) ==='
WITH evidence_paths AS (
  SELECT 
    id, quote_id, item_key,
    storage_path AS storage_name_candidate
  FROM mechanics_checklist_evidences
)
SELECT 
  e.id, e.quote_id, e.item_key, LEFT(e.storage_name_candidate, 100) AS storage_key
FROM evidence_paths e
LEFT JOIN storage.objects s 
  ON s.bucket_id = 'vehicle-media' AND s.name = e.storage_name_candidate
WHERE s.id IS NULL
ORDER BY e.quote_id
LIMIT 200;

\echo ''
\echo '=== 5. Objetos no Storage sem referência no banco (órfãos no storage) ==='
SELECT 
  s.name AS storage_key,
  s.created_at,
  CASE 
    WHEN s.name ILIKE 'evidences/%' THEN 'pasta nova'
    WHEN s.name ILIKE 'itens/%' THEN 'pasta antiga'
    ELSE 'outra'
  END AS pasta
FROM storage.objects s
LEFT JOIN (
  SELECT 
    storage_path AS storage_name_candidate
  FROM mechanics_checklist_evidences
) e
  ON e.storage_name_candidate = s.name
WHERE s.bucket_id = 'vehicle-media'
  AND e.storage_name_candidate IS NULL
  AND (s.name ILIKE 'evidences/%' OR s.name ILIKE 'itens/%' OR s.name ILIKE '%/tmp/%' OR s.name ILIKE '%/pre/%')
ORDER BY s.created_at DESC
LIMIT 200;

\echo ''
\echo '=== 6. Itens com múltiplas referências no banco (potencial duplicidade de referência) ==='
SELECT quote_id, item_key, COUNT(*) AS refs
FROM mechanics_checklist_evidences
GROUP BY quote_id, item_key
HAVING COUNT(*) > 1
ORDER BY refs DESC, quote_id
LIMIT 50;

\echo ''
\echo '=========================================='
\echo '✅ Auditoria de evidências concluída'
\echo '=========================================='
