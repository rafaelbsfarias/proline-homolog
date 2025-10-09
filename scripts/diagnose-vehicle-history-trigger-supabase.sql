-- =====================================================
-- SCRIPT DE DIAGNÓSTICO: vehicle_history_trigger
-- =====================================================
-- Versão adaptada para Supabase Dashboard
-- Data: 2025-10-08
-- Objetivo: Diagnosticar estado atual do sistema antes de melhorias
-- =====================================================

-- =====================================================
-- Seção 1: STATUS DO TRIGGER
-- =====================================================
SELECT '=== SEÇÃO 1: STATUS DO TRIGGER ===' as section;

SELECT 
  trigger_name,
  event_object_table as target_table,
  action_timing,
  string_agg(event_manipulation, ', ') as events
FROM information_schema.triggers
WHERE trigger_name = 'vehicle_history_trigger'
GROUP BY trigger_name, event_object_table, action_timing;

-- Verificar se está habilitado
SELECT 
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
    WHEN 'R' THEN '⚠️ REPLICA MODE'
    WHEN 'A' THEN '✅ ALWAYS'
  END as status,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'vehicle_history_trigger';

-- =====================================================
-- Seção 2: FORMATOS DE STATUS
-- =====================================================
SELECT '=== SEÇÃO 2: FORMATOS DE STATUS ===' as section;

SELECT 'Status em vehicles (últimos 20 únicos):' as info;

SELECT DISTINCT 
  status,
  COUNT(*) OVER (PARTITION BY status) as count,
  CASE 
    WHEN status LIKE '%ANÁLISE%' THEN '🔴 COM ACENTO'
    WHEN status LIKE '%ANALISE%' THEN '⚠️ SEM ACENTO'
    ELSE '✅ OUTROS'
  END as formato
FROM vehicles
WHERE status IS NOT NULL
ORDER BY status
LIMIT 20;

SELECT 'Status em vehicle_history (últimos 20 únicos):' as info;

SELECT DISTINCT 
  status,
  COUNT(*) OVER (PARTITION BY status) as count,
  CASE 
    WHEN status LIKE '%ANÁLISE%' THEN '🔴 COM ACENTO'
    WHEN status LIKE '%ANALISE%' THEN '⚠️ SEM ACENTO'
    ELSE '✅ OUTROS'
  END as formato
FROM vehicle_history
WHERE status IS NOT NULL
ORDER BY status
LIMIT 20;

-- =====================================================
-- Seção 3: VEÍCULOS COM STATUS DE ANÁLISE
-- =====================================================
SELECT '=== SEÇÃO 3: VEÍCULOS COM STATUS DE ANÁLISE ===' as section;

SELECT 
  v.id,
  v.plate,
  v.status as vehicle_status,
  TO_CHAR(v.updated_at, 'YYYY-MM-DD HH24:MI:SS') as vehicle_updated,
  vh.status as history_status,
  TO_CHAR(vh.created_at, 'YYYY-MM-DD HH24:MI:SS') as history_created,
  CASE 
    WHEN vh.id IS NULL THEN '❌ SEM HISTÓRICO'
    WHEN v.updated_at > vh.created_at THEN '⚠️ VEHICLE MAIS RECENTE'
    ELSE '✅ SINCRONIZADO'
  END as sync_status
FROM vehicles v
LEFT JOIN LATERAL (
  SELECT * FROM vehicle_history vh_inner
  WHERE vh_inner.vehicle_id = v.id 
    AND (vh_inner.status LIKE '%ANÁLISE%' OR vh_inner.status LIKE '%ANALISE%')
  ORDER BY vh_inner.created_at DESC
  LIMIT 1
) vh ON true
WHERE v.status LIKE '%ANÁLISE%' OR v.status LIKE '%ANALISE%'
ORDER BY v.updated_at DESC
LIMIT 20;

-- =====================================================
-- Seção 4: INCONSISTÊNCIAS CRÍTICAS
-- =====================================================
SELECT '=== SEÇÃO 4: INCONSISTÊNCIAS (Vehicles SEM History) ===' as section;

SELECT 
  v.id,
  v.plate,
  v.status,
  TO_CHAR(v.created_at, 'YYYY-MM-DD HH24:MI:SS') as created,
  TO_CHAR(v.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated,
  COALESCE((
    SELECT COUNT(*) 
    FROM vehicle_history vh 
    WHERE vh.vehicle_id = v.id
  ), 0) as history_count
FROM vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_history vh WHERE vh.vehicle_id = v.id
)
ORDER BY v.created_at DESC
LIMIT 10;

-- =====================================================
-- Seção 5: MUDANÇAS RECENTES SEM HISTÓRICO
-- =====================================================
SELECT '=== SEÇÃO 5: MUDANÇAS RECENTES (Últimos 7 dias) ===' as section;

SELECT 
  v.id,
  v.plate,
  v.status as current_status,
  TO_CHAR(v.updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_update,
  COALESCE((
    SELECT vh.status 
    FROM vehicle_history vh 
    WHERE vh.vehicle_id = v.id 
    ORDER BY vh.created_at DESC 
    LIMIT 1
  ), '❌ NENHUM') as last_history_status,
  COALESCE(
    TO_CHAR((
      SELECT vh.created_at 
      FROM vehicle_history vh 
      WHERE vh.vehicle_id = v.id 
      ORDER BY vh.created_at DESC 
      LIMIT 1
    ), 'YYYY-MM-DD HH24:MI:SS'),
    '❌ NENHUM'
  ) as last_history_created,
  CASE 
    WHEN v.updated_at > COALESCE((
      SELECT MAX(vh.created_at)
      FROM vehicle_history vh 
      WHERE vh.vehicle_id = v.id
    ), '1970-01-01'::timestamp) THEN '❌ DESATUALIZADO'
    ELSE '✅ ATUALIZADO'
  END as sync_status
FROM vehicles v
WHERE v.updated_at > NOW() - INTERVAL '7 days'
  AND (v.status LIKE '%ANÁLISE%' OR v.status LIKE '%ANALISE%')
ORDER BY v.updated_at DESC
LIMIT 20;

-- =====================================================
-- Seção 6: MISMATCH DE FORMATOS
-- =====================================================
SELECT '=== SEÇÃO 6: MISMATCH DE FORMATOS ===' as section;

WITH vehicle_statuses AS (
  SELECT DISTINCT status FROM vehicles
  WHERE status LIKE '%ANÁLISE%' OR status LIKE '%ANALISE%'
),
history_statuses AS (
  SELECT DISTINCT status FROM vehicle_history
  WHERE status LIKE '%ANÁLISE%' OR status LIKE '%ANALISE%'
)
SELECT 
  COALESCE(vs.status, '❌ Não existe em vehicles') as in_vehicles,
  COALESCE(hs.status, '❌ Não existe em history') as in_history,
  CASE 
    WHEN vs.status IS NULL THEN '⚠️ APENAS EM HISTORY'
    WHEN hs.status IS NULL THEN '❌ APENAS EM VEHICLES (TRIGGER FALHOU?)'
    WHEN vs.status = hs.status THEN '✅ MATCH EXATO'
    WHEN UPPER(vs.status) = UPPER(hs.status) THEN '⚠️ CASE DIFERENTE'
    ELSE '❌ FORMATO COMPLETAMENTE DIFERENTE'
  END as comparison
FROM vehicle_statuses vs
FULL OUTER JOIN history_statuses hs ON vs.status = hs.status;

-- =====================================================
-- Seção 7: ESTATÍSTICAS GERAIS
-- =====================================================
SELECT '=== SEÇÃO 7: ESTATÍSTICAS GERAIS ===' as section;

SELECT 
  'Total de Veículos' as metric,
  COUNT(*)::text as value
FROM vehicles
UNION ALL
SELECT 
  'Veículos com Histórico' as metric,
  COUNT(DISTINCT vehicle_id)::text as value
FROM vehicle_history
UNION ALL
SELECT 
  'Total de Registros de Histórico' as metric,
  COUNT(*)::text as value
FROM vehicle_history
UNION ALL
SELECT 
  'Veículos SEM Histórico' as metric,
  COUNT(*)::text as value
FROM vehicles v
WHERE NOT EXISTS (SELECT 1 FROM vehicle_history vh WHERE vh.vehicle_id = v.id)
UNION ALL
SELECT 
  'Status do Trigger' as metric,
  CASE tgenabled
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
  END as value
FROM pg_trigger
WHERE tgname = 'vehicle_history_trigger'
LIMIT 1;

-- =====================================================
-- DIAGNÓSTICO COMPLETO
-- =====================================================
SELECT '=== DIAGNÓSTICO COMPLETO ===' as section;
SELECT 'Execute este script e documente os resultados em docs/timeline-analysis/diagnostics/' as next_step;
