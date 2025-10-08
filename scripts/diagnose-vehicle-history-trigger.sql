-- =====================================================
-- SCRIPT DE DIAGNÓSTICO: vehicle_history_trigger
-- =====================================================
-- Data: 2025-01-09
-- Objetivo: Diagnosticar problema de timeline não atualizando
-- Uso: Executar no Supabase SQL Editor ou psql
--
-- Tempo estimado: ~30 segundos
-- Nenhuma modificação será feita (apenas SELECT)
-- =====================================================

\echo '=====================================================';
\echo 'DIAGNÓSTICO: vehicle_history_trigger';
\echo '=====================================================';
\echo '';

-- =====================================================
-- Seção 1: STATUS DO TRIGGER
-- =====================================================
\echo '=== SEÇÃO 1: STATUS DO TRIGGER ===';
\echo '';

SELECT 
  trigger_name,
  event_object_table as target_table,
  action_timing,
  string_agg(event_manipulation, ', ') as events
FROM information_schema.triggers
WHERE trigger_name = 'vehicle_history_trigger'
GROUP BY trigger_name, event_object_table, action_timing;

\echo '';

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

\echo '';
\echo '';

-- =====================================================
-- Seção 2: FORMATOS DE STATUS
-- =====================================================
\echo '=== SEÇÃO 2: FORMATOS DE STATUS ===';
\echo '';
\echo 'Status em vehicles (últimos 20 únicos):';

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

\echo '';
\echo 'Status em vehicle_history (últimos 20 únicos):';

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

\echo '';
\echo '';

-- =====================================================
-- Seção 3: COMPARAÇÃO DIRETA
-- =====================================================
\echo '=== SEÇÃO 3: VEÍCULOS COM STATUS DE ANÁLISE ===';
\echo '';

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

\echo '';
\echo '';

-- =====================================================
-- Seção 4: INCONSISTÊNCIAS CRÍTICAS
-- =====================================================
\echo '=== SEÇÃO 4: INCONSISTÊNCIAS (Vehicles SEM History) ===';
\echo '';

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

\echo '';
\echo '';

-- =====================================================
-- Seção 5: MUDANÇAS RECENTES SEM HISTÓRICO
-- =====================================================
\echo '=== SEÇÃO 5: MUDANÇAS RECENTES (Últimos 7 dias) ===';
\echo '';

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

\echo '';
\echo '';

-- =====================================================
-- Seção 6: MISMATCH DE FORMATOS
-- =====================================================
\echo '=== SEÇÃO 6: MISMATCH DE FORMATOS ===';
\echo '';

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

\echo '';
\echo '';

-- =====================================================
-- Seção 7: CONTADORES GERAIS
-- =====================================================
\echo '=== SEÇÃO 7: ESTATÍSTICAS GERAIS ===';
\echo '';

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

\echo '';
\echo '';

-- =====================================================
-- Seção 8: CÓDIGO DA FUNÇÃO DO TRIGGER
-- =====================================================
\echo '=== SEÇÃO 8: CÓDIGO DA FUNÇÃO (verificar lógica) ===';
\echo '';

SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'log_vehicle_history';

\echo '';
\echo '';

-- =====================================================
-- CONCLUSÃO E RECOMENDAÇÕES
-- =====================================================
\echo '=====================================================';
\echo 'DIAGNÓSTICO COMPLETO';
\echo '=====================================================';
\echo '';
\echo 'PRÓXIMOS PASSOS:';
\echo '';
\echo '1. Se trigger estiver DISABLED:';
\echo '   ALTER TABLE vehicles ENABLE TRIGGER vehicle_history_trigger;';
\echo '';
\echo '2. Se formatos estiverem inconsistentes:';
\echo '   -- Executar migration de padronização';
\echo '   -- Ver: docs/TRIGGER_DIAGNOSTIC_GUIDE.md';
\echo '';
\echo '3. Se veículos tiverem status mas não histórico:';
\echo '   -- Executar backfill de dados históricos';
\echo '   -- Ver: docs/TRIGGER_DIAGNOSTIC_GUIDE.md';
\echo '';
\echo '4. Para mais detalhes:';
\echo '   -- Consultar: docs/TIMELINE_DOCUMENTATION_INDEX.md';
\echo '';
\echo '=====================================================';
