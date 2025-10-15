-- Migration: Adicionar campo category a mechanics_checklist
-- Objetivo: Normalizar categoria do parceiro diretamente no checklist
-- Status: Fase 1 da refatoração (Normalização de Categorias)

-- =====================================================
-- 1. ADICIONAR COLUNA category
-- =====================================================

-- Adicionar coluna category (nullable inicialmente para backfill)
ALTER TABLE mechanics_checklist
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_category 
  ON mechanics_checklist(category);

-- =====================================================
-- 2. BACKFILL: Popular category a partir de partner_categories
-- =====================================================

-- Função helper para normalizar nome da categoria
CREATE OR REPLACE FUNCTION normalize_category_name(cat_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN cat_name ILIKE '%mecânica%' OR cat_name ILIKE '%mecanica%' THEN 'mecanica'
    WHEN cat_name ILIKE '%funilaria%' OR cat_name ILIKE '%pintura%' THEN 'funilaria_pintura'
    WHEN cat_name ILIKE '%lavagem%' THEN 'lavagem'
    WHEN cat_name ILIKE '%pneu%' THEN 'pneus'
    WHEN cat_name ILIKE '%loja%' OR cat_name ILIKE '%peça%' THEN 'loja'
    WHEN cat_name ILIKE '%pátio%' OR cat_name ILIKE '%patio%' OR cat_name ILIKE '%atacado%' THEN 'patio_atacado'
    WHEN cat_name ILIKE '%elétrica%' OR cat_name ILIKE '%eletrica%' THEN 'eletrica'
    ELSE LOWER(REPLACE(REPLACE(cat_name, '/', '_'), ' ', '_'))
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar registros existentes com a categoria do parceiro
UPDATE mechanics_checklist mc
SET category = (
  SELECT normalize_category_name(p.category)
  FROM partners p
  WHERE p.profile_id = mc.partner_id
)
WHERE mc.category IS NULL AND mc.partner_id IS NOT NULL;

-- =====================================================
-- 3. COMENTÁRIOS E CONSTRAINTS
-- =====================================================

COMMENT ON COLUMN mechanics_checklist.category IS 
  'Categoria normalizada do parceiro (mecanica, funilaria_pintura, lavagem, etc.)';

COMMENT ON FUNCTION normalize_category_name(TEXT) IS
  'Normaliza nome da categoria para formato snake_case padronizado';

-- =====================================================
-- 4. ATUALIZAR MIGRATION_STATUS
-- =====================================================

-- Registrar progresso da migração
DO $$
BEGIN
  -- Log de execução
  RAISE NOTICE 'Migration 20251014190405: category field added to mechanics_checklist';
  RAISE NOTICE 'Backfill completed for existing records';
  RAISE NOTICE 'Next step: Update APIs to populate category on insert';
END $$;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. Campo category é NULLABLE para não quebrar código existente
-- 2. Backfill automático para registros existentes
-- 3. Novos registros devem incluir category explicitamente
-- 4. Em próxima migration: tornar category NOT NULL
-- 5. Função normalize_category_name pode ser reutilizada no código

-- Verificar resultado do backfill
-- SELECT 
--   category, 
--   COUNT(*) as count,
--   COUNT(DISTINCT partner_id) as distinct_partners
-- FROM mechanics_checklist
-- GROUP BY category
-- ORDER BY count DESC;
