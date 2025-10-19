-- ============================================
-- DIAGNÓSTICO: Imagens do Checklist do Especialista
-- ============================================
-- Data: 19/10/2025
-- Objetivo: Verificar estado dos dados de mídia do checklist
-- ============================================

-- 1️⃣ VERIFICAR IMAGENS SALVAS NO BANCO
-- ============================================
SELECT 
  im.id,
  im.storage_path,
  im.uploaded_by,
  im.created_at,
  i.id as inspection_id,
  i.vehicle_id,
  i.specialist_id,
  i.finalized,
  v.plate,
  v.client_id,
  p.full_name as uploader_name,
  p.role as uploader_role
FROM inspection_media im
JOIN inspections i ON i.id = im.inspection_id
JOIN vehicles v ON v.id = i.vehicle_id
JOIN profiles p ON p.id = im.uploaded_by
ORDER BY im.created_at DESC
LIMIT 20;

-- 2️⃣ CONTAR TOTAL DE IMAGENS POR INSPEÇÃO
-- ============================================
SELECT 
  i.id as inspection_id,
  i.vehicle_id,
  v.plate,
  i.finalized,
  COUNT(im.id) as total_images,
  i.created_at as inspection_date
FROM inspections i
LEFT JOIN inspection_media im ON im.inspection_id = i.id
JOIN vehicles v ON v.id = i.vehicle_id
GROUP BY i.id, i.vehicle_id, v.plate, i.finalized, i.created_at
HAVING COUNT(im.id) > 0
ORDER BY i.created_at DESC
LIMIT 10;

-- 3️⃣ VERIFICAR PATHS DAS IMAGENS (FORMATO CORRETO)
-- ============================================
SELECT 
  im.storage_path,
  CASE 
    WHEN im.storage_path ~ '^[a-f0-9-]+/[a-f0-9-]+/[0-9]+-[0-9]+-[a-z0-9]+\.[a-z]+$' 
    THEN '✅ Formato correto'
    ELSE '❌ Formato incorreto'
  END as path_validation,
  split_part(im.storage_path, '/', 1) as vehicle_id_from_path,
  split_part(im.storage_path, '/', 2) as user_id_from_path,
  split_part(im.storage_path, '/', 3) as filename,
  i.vehicle_id as actual_vehicle_id,
  im.uploaded_by as actual_user_id,
  CASE 
    WHEN split_part(im.storage_path, '/', 1)::uuid = i.vehicle_id 
    THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as vehicle_id_match,
  CASE 
    WHEN split_part(im.storage_path, '/', 2)::uuid = im.uploaded_by 
    THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as user_id_match
FROM inspection_media im
JOIN inspections i ON i.id = im.inspection_id
ORDER BY im.created_at DESC
LIMIT 20;

-- 4️⃣ VERIFICAR INSPEÇÕES SEM IMAGENS (POSSÍVEL PROBLEMA)
-- ============================================
SELECT 
  i.id as inspection_id,
  i.vehicle_id,
  v.plate,
  i.specialist_id,
  p.full_name as specialist_name,
  i.finalized,
  i.created_at,
  COUNT(im.id) as image_count
FROM inspections i
JOIN vehicles v ON v.id = i.vehicle_id
LEFT JOIN inspection_media im ON im.inspection_id = i.id
LEFT JOIN profiles p ON p.id = i.specialist_id
GROUP BY i.id, i.vehicle_id, v.plate, i.specialist_id, p.full_name, i.finalized, i.created_at
HAVING COUNT(im.id) = 0
ORDER BY i.created_at DESC
LIMIT 10;

-- 5️⃣ VERIFICAR VÍNCULOS CLIENTE-ESPECIALISTA
-- ============================================
SELECT 
  cs.client_id,
  cs.specialist_id,
  c.full_name as client_name,
  s.full_name as specialist_name,
  COUNT(DISTINCT v.id) as total_vehicles,
  COUNT(DISTINCT i.id) as total_inspections,
  COUNT(DISTINCT im.id) as total_images
FROM client_specialists cs
JOIN profiles c ON c.id = cs.client_id
JOIN profiles s ON s.id = cs.specialist_id
LEFT JOIN vehicles v ON v.client_id = cs.client_id
LEFT JOIN inspections i ON i.vehicle_id = v.id
LEFT JOIN inspection_media im ON im.inspection_id = i.id
GROUP BY cs.client_id, cs.specialist_id, c.full_name, s.full_name
ORDER BY total_images DESC;

-- 6️⃣ VERIFICAR STORAGE OBJECTS (ARQUIVO FÍSICO EXISTE?)
-- ============================================
-- ⚠️ Nota: Esta query só funciona se você tiver permissão para acessar storage.objects
SELECT 
  o.id,
  o.name as storage_path,
  o.bucket_id,
  o.owner,
  o.created_at,
  o.updated_at,
  o.last_accessed_at,
  pg_size_pretty(COALESCE(o.metadata->>'size', '0')::bigint) as file_size
FROM storage.objects o
WHERE o.bucket_id = 'vehicle-media'
ORDER BY o.created_at DESC
LIMIT 20;

-- 7️⃣ COMPARAR REGISTROS DB vs STORAGE
-- ============================================
SELECT 
  'inspection_media' as source,
  COUNT(*) as total_records
FROM inspection_media
UNION ALL
SELECT 
  'storage.objects' as source,
  COUNT(*) as total_records
FROM storage.objects
WHERE bucket_id = 'vehicle-media';

-- 8️⃣ VERIFICAR IMAGENS ÓRFÃS (NO STORAGE MAS NÃO NO DB)
-- ============================================
-- ⚠️ Nota: Pode ser lento se houver muitos arquivos
SELECT 
  o.name as storage_path,
  o.created_at,
  pg_size_pretty(COALESCE(o.metadata->>'size', '0')::bigint) as file_size,
  CASE 
    WHEN im.id IS NULL THEN '❌ Órfão (não está no DB)'
    ELSE '✅ OK (está no DB)'
  END as status
FROM storage.objects o
LEFT JOIN inspection_media im ON im.storage_path = o.name
WHERE o.bucket_id = 'vehicle-media'
ORDER BY o.created_at DESC
LIMIT 20;

-- 9️⃣ VERIFICAR IMAGENS NO DB MAS NÃO NO STORAGE
-- ============================================
SELECT 
  im.storage_path,
  im.created_at,
  i.vehicle_id,
  v.plate,
  CASE 
    WHEN o.id IS NULL THEN '❌ Arquivo não existe no storage'
    ELSE '✅ Arquivo existe no storage'
  END as file_status
FROM inspection_media im
JOIN inspections i ON i.id = im.inspection_id
JOIN vehicles v ON v.id = i.vehicle_id
LEFT JOIN storage.objects o ON o.name = im.storage_path AND o.bucket_id = 'vehicle-media'
ORDER BY im.created_at DESC
LIMIT 20;

-- 🔟 VERIFICAR ÚLTIMA INSPEÇÃO COM IMAGENS PARA TESTE
-- ============================================
SELECT 
  i.id as inspection_id,
  i.vehicle_id,
  v.plate,
  v.brand,
  v.model,
  i.specialist_id,
  p.full_name as specialist_name,
  p.email as specialist_email,
  i.finalized,
  i.created_at,
  json_agg(
    json_build_object(
      'id', im.id,
      'path', im.storage_path,
      'uploaded_by', im.uploaded_by,
      'created_at', im.created_at
    ) ORDER BY im.created_at
  ) FILTER (WHERE im.id IS NOT NULL) as images
FROM inspections i
JOIN vehicles v ON v.id = i.vehicle_id
LEFT JOIN profiles p ON p.id = i.specialist_id
LEFT JOIN inspection_media im ON im.inspection_id = i.id
WHERE i.finalized = false
GROUP BY i.id, i.vehicle_id, v.plate, v.brand, v.model, i.specialist_id, p.full_name, p.email, i.finalized, i.created_at
HAVING COUNT(im.id) > 0
ORDER BY i.created_at DESC
LIMIT 1;

-- ============================================
-- RESUMO ESTATÍSTICO
-- ============================================
SELECT 
  '📊 ESTATÍSTICAS GERAIS' as category,
  '' as metric,
  '' as value
UNION ALL
SELECT 
  'Inspeções',
  'Total de inspeções',
  COUNT(*)::text
FROM inspections
UNION ALL
SELECT 
  'Inspeções',
  'Inspeções finalizadas',
  COUNT(*)::text
FROM inspections
WHERE finalized = true
UNION ALL
SELECT 
  'Inspeções',
  'Inspeções não finalizadas',
  COUNT(*)::text
FROM inspections
WHERE finalized = false
UNION ALL
SELECT 
  'Imagens',
  'Total de imagens no DB',
  COUNT(*)::text
FROM inspection_media
UNION ALL
SELECT 
  'Imagens',
  'Total de arquivos no storage',
  COUNT(*)::text
FROM storage.objects
WHERE bucket_id = 'vehicle-media'
UNION ALL
SELECT 
  'Inspeções',
  'Inspeções com imagens',
  COUNT(DISTINCT inspection_id)::text
FROM inspection_media
UNION ALL
SELECT 
  'Inspeções',
  'Inspeções sem imagens',
  (
    SELECT COUNT(*) 
    FROM inspections i 
    WHERE NOT EXISTS (
      SELECT 1 FROM inspection_media im WHERE im.inspection_id = i.id
    )
  )::text;
