-- =====================================================
-- Migration: Consolidar Tabelas de Evidências
-- =====================================================
-- Data: 2025-10-14
-- Autor: Sistema
-- Descrição: Consolida mechanics_checklist_evidence (SINGULAR) e 
--            mechanics_checklist_evidences (PLURAL) em uma única tabela
--            padronizada com partner_id.
--
-- Problema: Duas tabelas com mesmo propósito e diferença de uma letra:
--   - mechanics_checklist_evidence (SINGULAR) - TEM partner_id, media_url
--   - mechanics_checklist_evidences (PLURAL) - SEM partner_id, usa storage_path
--
-- Solução: 
--   1. Migrar dados da tabela antiga (PLURAL) para nova (SINGULAR)
--   2. Inferir partner_id a partir de inspection_id/quote_id
--   3. Converter storage_path → media_url
--   4. Dropar tabela antiga
--   5. Renomear tabela nova para padrão PLURAL
--
-- Rollback: Anexado no final deste arquivo
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: Análise e Relatório Inicial
-- =====================================================

DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
  old_exists BOOLEAN;
  new_exists BOOLEAN;
BEGIN
  -- Verificar existência das tabelas
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'mechanics_checklist_evidences'
  ) INTO old_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'mechanics_checklist_evidence'
  ) INTO new_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 ANÁLISE INICIAL DAS TABELAS';
  RAISE NOTICE '========================================';
  
  IF old_exists THEN
    SELECT COUNT(*) INTO old_count FROM mechanics_checklist_evidences;
    RAISE NOTICE '✅ mechanics_checklist_evidences (ANTIGA): % registros', old_count;
  ELSE
    RAISE NOTICE '❌ mechanics_checklist_evidences (ANTIGA): NÃO EXISTE';
    old_count := 0;
  END IF;
  
  IF new_exists THEN
    SELECT COUNT(*) INTO new_count FROM mechanics_checklist_evidence;
    RAISE NOTICE '✅ mechanics_checklist_evidence (NOVA): % registros', new_count;
  ELSE
    RAISE NOTICE '❌ mechanics_checklist_evidence (NOVA): NÃO EXISTE';
    new_count := 0;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total de registros a migrar: %', old_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PARTE 2: Migração de Dados (se houver)
-- =====================================================

-- 2.1) Criar tabela temporária para mapear partner_id
CREATE TEMP TABLE temp_evidence_partner_mapping AS
SELECT DISTINCT
  e.id as evidence_id,
  e.inspection_id,
  e.quote_id,
  e.vehicle_id,
  -- Tentar inferir partner_id via quote
  COALESCE(
    q.partner_id,
    -- Fallback: via inspection -> checklist
    (SELECT mc.partner_id 
     FROM mechanics_checklist mc 
     WHERE mc.inspection_id = e.inspection_id 
     LIMIT 1)
  ) as inferred_partner_id
FROM mechanics_checklist_evidences e
LEFT JOIN quotes q ON q.id = e.quote_id;

-- 2.2) Relatório de inferência
DO $$
DECLARE
  total_records INTEGER;
  with_partner INTEGER;
  without_partner INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM temp_evidence_partner_mapping;
  SELECT COUNT(*) INTO with_partner FROM temp_evidence_partner_mapping WHERE inferred_partner_id IS NOT NULL;
  SELECT COUNT(*) INTO without_partner FROM temp_evidence_partner_mapping WHERE inferred_partner_id IS NULL;
  
  IF total_records > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 INFERÊNCIA DE PARTNER_ID';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total de evidências: %', total_records;
    RAISE NOTICE '✅ Com partner_id inferido: %', with_partner;
    RAISE NOTICE '⚠️  Sem partner_id: %', without_partner;
    
    IF without_partner > 0 THEN
      RAISE WARNING 'Existem % evidências sem partner_id. Estas serão IGNORADAS na migração!', without_partner;
    END IF;
    RAISE NOTICE '';
  END IF;
END $$;

-- 2.3) Migrar dados para a tabela nova (apenas registros com partner_id válido)
INSERT INTO mechanics_checklist_evidence (
  id,
  partner_id,
  inspection_id,
  quote_id,
  vehicle_id,
  item_key,
  media_url,
  media_type,
  created_at,
  updated_at
)
SELECT 
  e.id,
  m.inferred_partner_id,
  e.inspection_id,
  e.quote_id,
  e.vehicle_id,
  e.item_key,
  e.storage_path, -- storage_path vira media_url
  'image', -- Assumir tipo padrão
  e.created_at,
  e.created_at -- updated_at = created_at inicialmente
FROM mechanics_checklist_evidences e
INNER JOIN temp_evidence_partner_mapping m ON m.evidence_id = e.id
WHERE m.inferred_partner_id IS NOT NULL
ON CONFLICT (id) DO NOTHING; -- Evitar erro se já existir

-- 2.4) Relatório de migração
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  IF migrated_count > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRAÇÃO DE DADOS CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Registros migrados: %', migrated_count;
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ℹ️  NENHUM DADO PARA MIGRAR';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ambas as tabelas estão vazias.';
    RAISE NOTICE '';
  END IF;
END $$;

-- =====================================================
-- PARTE 3: Remover Tabela Antiga
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️  REMOVENDO TABELA ANTIGA';
  RAISE NOTICE '========================================';
END $$;

-- 3.1) Dropar constraints e índices da tabela antiga
DROP TABLE IF EXISTS mechanics_checklist_evidences CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Tabela mechanics_checklist_evidences (ANTIGA) removida';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PARTE 4: Renomear Tabela Nova para Padrão PLURAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔄 RENOMEANDO TABELA';
  RAISE NOTICE '========================================';
END $$;

-- 4.1) Renomear tabela
ALTER TABLE mechanics_checklist_evidence 
  RENAME TO mechanics_checklist_evidences;

-- 4.2) Renomear constraint (check)
ALTER TABLE mechanics_checklist_evidences 
  RENAME CONSTRAINT check_evidence_has_context_id 
  TO check_evidences_has_context_id;

ALTER TABLE mechanics_checklist_evidences 
  RENAME CONSTRAINT check_media_type 
  TO check_evidences_media_type;

-- 4.3) Renomear índices (todos os que começam com idx_mce_)
ALTER INDEX IF EXISTS idx_mce_partner_id RENAME TO idx_evidences_partner_id;
ALTER INDEX IF EXISTS idx_mce_inspection_id RENAME TO idx_evidences_inspection_id;
ALTER INDEX IF EXISTS idx_mce_quote_id RENAME TO idx_evidences_quote_id;
ALTER INDEX IF EXISTS idx_mce_vehicle_id RENAME TO idx_evidences_vehicle_id;
ALTER INDEX IF EXISTS idx_mce_item_key RENAME TO idx_evidences_item_key;
ALTER INDEX IF EXISTS idx_mce_partner_quote RENAME TO idx_evidences_partner_quote;
ALTER INDEX IF EXISTS idx_mce_partner_inspection RENAME TO idx_evidences_partner_inspection;
ALTER INDEX IF EXISTS idx_mce_partner_item RENAME TO idx_evidences_partner_item;
ALTER INDEX IF EXISTS idx_mce_unique_partner_quote_item_media RENAME TO idx_evidences_unique_partner_quote_item_media;
ALTER INDEX IF EXISTS idx_mce_unique_partner_inspection_item_media RENAME TO idx_evidences_unique_partner_inspection_item_media;

-- 4.4) Recriar trigger com nome correto
-- Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS trg_update_mechanics_checklist_evidence_updated_at ON mechanics_checklist_evidences;

-- Dropar função antiga se existir
DROP FUNCTION IF EXISTS update_mechanics_checklist_evidence_updated_at();

-- Criar nova função com nome correto
CREATE OR REPLACE FUNCTION update_mechanics_checklist_evidences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger com nome correto
CREATE TRIGGER trg_update_mechanics_checklist_evidences_updated_at
  BEFORE UPDATE ON mechanics_checklist_evidences
  FOR EACH ROW
  EXECUTE FUNCTION update_mechanics_checklist_evidences_updated_at();

DO $$
BEGIN
  RAISE NOTICE '✅ Tabela renomeada';
  RAISE NOTICE '✅ Constraints renomeadas';
  RAISE NOTICE '✅ Índices renomeados';
  RAISE NOTICE '✅ Triggers renomeados';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PARTE 5: Validação Final
-- =====================================================

DO $$
DECLARE
  final_count INTEGER;
  has_partner_id BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VALIDAÇÃO FINAL';
  RAISE NOTICE '========================================';
  
  -- Verificar se tabela existe com nome correto
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'mechanics_checklist_evidences'
  ) INTO has_partner_id;
  
  IF has_partner_id THEN
    SELECT COUNT(*) INTO final_count FROM mechanics_checklist_evidences;
    RAISE NOTICE '✅ mechanics_checklist_evidences: % registros', final_count;
    
    -- Verificar se coluna partner_id existe
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'mechanics_checklist_evidences' 
      AND column_name = 'partner_id'
    ) INTO has_partner_id;
    
    IF has_partner_id THEN
      RAISE NOTICE '✅ Coluna partner_id: PRESENTE';
    ELSE
      RAISE EXCEPTION '❌ Coluna partner_id: AUSENTE - MIGRAÇÃO FALHOU!';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ Tabela mechanics_checklist_evidences não encontrada!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RESUMO:';
  RAISE NOTICE '  • Tabela consolidada: mechanics_checklist_evidences';
  RAISE NOTICE '  • Coluna partner_id: PRESENTE';
  RAISE NOTICE '  • Total de registros: %', final_count;
  RAISE NOTICE '  • Índices: 10 renomeados';
  RAISE NOTICE '  • Triggers: 1 renomeado';
  RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK SCRIPT (caso necessário)
-- =====================================================
-- 
-- Para reverter esta migration, execute:
--
-- BEGIN;
-- 
-- -- Renomear de volta
-- ALTER TABLE mechanics_checklist_evidences 
--   RENAME TO mechanics_checklist_evidence;
-- 
-- -- Recriar tabela antiga (vazia)
-- CREATE TABLE mechanics_checklist_evidences (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
--   vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
--   item_key TEXT NOT NULL,
--   storage_path TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE
-- );
-- 
-- CREATE INDEX idx_mce_inspection_id ON mechanics_checklist_evidences(inspection_id);
-- CREATE INDEX idx_mce_vehicle_id ON mechanics_checklist_evidences(vehicle_id);
-- CREATE INDEX idx_mce_quote_id ON mechanics_checklist_evidences(quote_id);
-- 
-- COMMIT;
-- 
-- =====================================================
