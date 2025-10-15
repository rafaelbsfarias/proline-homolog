-- =====================================================
-- VERIFICAÇÃO DE SCHEMA - Gaps Identificados
-- =====================================================
-- Data: 14 de Outubro de 2025
-- Objetivo: Verificar se colunas partner_id e quote_id existem
-- =====================================================

-- 1. VERIFICAR COLUNAS EM mechanics_checklist_items
-- =====================================================
\echo '=== 1. Colunas em mechanics_checklist_items ==='
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'mechanics_checklist_items'
ORDER BY ordinal_position;

-- 2. VERIFICAR COLUNAS EM mechanics_checklist_evidence
-- =====================================================
\echo ''
\echo '=== 2. Colunas em mechanics_checklist_evidences ==='
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'mechanics_checklist_evidences'
ORDER BY ordinal_position;

-- 3. VERIFICAR ÍNDICES RELACIONADOS
-- =====================================================
\echo ''
\echo '=== 3. Índices em mechanics_checklist_items ==='
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'mechanics_checklist_items'
ORDER BY indexname;

\echo ''
\echo '=== 4. Índices em mechanics_checklist_evidence ==='
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'mechanics_checklist_evidence'
ORDER BY indexname;

-- 4. VERIFICAR CONSTRAINTS
-- =====================================================
\echo ''
\echo '=== 5. Constraints em mechanics_checklist_items ==='
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.mechanics_checklist_items'::regclass
ORDER BY conname;

\echo ''
\echo '=== 6. Constraints em mechanics_checklist_evidences ==='
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.mechanics_checklist_evidences'::regclass
ORDER BY conname;

-- 5. TESTAR ISOLAMENTO DE DADOS (se colunas existirem)
-- =====================================================
\echo ''
\echo '=== 7. Teste de Isolamento - Items por Partner/Quote ==='
SELECT 
  COALESCE(partner_id::text, 'NULL') as partner_id,
  COALESCE(quote_id::text, 'NULL') as quote_id,
  COALESCE(inspection_id::text, 'NULL') as inspection_id,
  COUNT(*) as total_items
FROM mechanics_checklist_items
GROUP BY partner_id, quote_id, inspection_id
HAVING COUNT(*) > 0
ORDER BY total_items DESC
LIMIT 10;

\echo ''
\echo '=== 8. Teste de Isolamento - Evidences por Partner/Quote ==='
SELECT 
  COALESCE(partner_id::text, 'NULL') as partner_id,
  COALESCE(quote_id::text, 'NULL') as quote_id,
  COALESCE(inspection_id::text, 'NULL') as inspection_id,
  COUNT(*) as total_evidences
FROM mechanics_checklist_evidence
GROUP BY partner_id, quote_id, inspection_id
HAVING COUNT(*) > 0
ORDER BY total_evidences DESC
LIMIT 10;

-- 6. VERIFICAR DADOS ÓRFÃOS (sem partner_id)
-- =====================================================
\echo ''
\echo '=== 9. Items SEM partner_id (potencial problema) ==='
SELECT 
  COUNT(*) as items_without_partner,
  COUNT(DISTINCT inspection_id) as unique_inspections,
  COUNT(DISTINCT quote_id) as unique_quotes
FROM mechanics_checklist_items
WHERE partner_id IS NULL;

\echo ''
\echo '=== 10. Evidences SEM partner_id (potencial problema) ==='
SELECT 
  COUNT(*) as evidences_without_partner,
  COUNT(DISTINCT inspection_id) as unique_inspections,
  COUNT(DISTINCT quote_id) as unique_quotes
FROM mechanics_checklist_evidence
WHERE partner_id IS NULL;

-- 7. VERIFICAR RLS POLICIES
-- =====================================================
\echo ''
\echo '=== 11. RLS Policies em mechanics_checklist_items ==='
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'mechanics_checklist_items'
ORDER BY policyname;

\echo ''
\echo '=== 12. RLS Policies em mechanics_checklist_evidence ==='
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'mechanics_checklist_evidence'
ORDER BY policyname;

-- 8. RESUMO EXECUTIVO
-- =====================================================
\echo ''
\echo '=== 13. RESUMO EXECUTIVO ==='
\echo ''

DO $$
DECLARE
  items_has_partner BOOLEAN;
  items_has_quote BOOLEAN;
  evidence_has_partner BOOLEAN;
  evidence_has_quote BOOLEAN;
BEGIN
  -- Verificar mechanics_checklist_items
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanics_checklist_items' 
    AND column_name = 'partner_id'
  ) INTO items_has_partner;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanics_checklist_items' 
    AND column_name = 'quote_id'
  ) INTO items_has_quote;
  
  -- Verificar mechanics_checklist_evidence
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanics_checklist_evidence' 
    AND column_name = 'partner_id'
  ) INTO evidence_has_partner;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanics_checklist_evidence' 
    AND column_name = 'quote_id'
  ) INTO evidence_has_quote;
  
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'RESUMO - STATUS DAS COLUNAS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📋 mechanics_checklist_items:';
  RAISE NOTICE '   partner_id: %', CASE WHEN items_has_partner THEN '✅ OK' ELSE '❌ FALTANDO' END;
  RAISE NOTICE '   quote_id:   %', CASE WHEN items_has_quote THEN '✅ OK' ELSE '❌ FALTANDO' END;
  RAISE NOTICE '';
  RAISE NOTICE '📋 mechanics_checklist_evidence:';
  RAISE NOTICE '   partner_id: %', CASE WHEN evidence_has_partner THEN '✅ OK' ELSE '❌ FALTANDO' END;
  RAISE NOTICE '   quote_id:   %', CASE WHEN evidence_has_quote THEN '✅ OK' ELSE '❌ FALTANDO' END;
  RAISE NOTICE '';
  
  IF NOT items_has_partner OR NOT items_has_quote THEN
    RAISE NOTICE '⚠️  AÇÃO NECESSÁRIA:';
    RAISE NOTICE '   Criar migration para mechanics_checklist_items';
    RAISE NOTICE '';
  END IF;
  
  IF NOT evidence_has_partner OR NOT evidence_has_quote THEN
    RAISE NOTICE '⚠️  AÇÃO NECESSÁRIA:';
    RAISE NOTICE '   Criar migration para mechanics_checklist_evidence';
    RAISE NOTICE '';
  END IF;
  
  IF items_has_partner AND items_has_quote AND evidence_has_partner AND evidence_has_quote THEN
    RAISE NOTICE '✅ TODAS COLUNAS PRESENTES';
    RAISE NOTICE '   Próximo passo: Verificar se código está usando as colunas';
    RAISE NOTICE '';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
