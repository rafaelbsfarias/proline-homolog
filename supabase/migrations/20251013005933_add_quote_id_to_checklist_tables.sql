-- Migration: Adicionar quote_id às tabelas de checklist de parceiros
-- Objetivo: Corrigir arquitetura onde parceiros usavam inspection_id "emprestado"
-- Agora parceiros terão seu próprio quote_id para relacionar dados

-- =====================================================
-- 1. ADICIONAR COLUNA quote_id EM mechanics_checklist
-- =====================================================

ALTER TABLE mechanics_checklist
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Tornar inspection_id opcional (parceiros não precisam mais dele)
ALTER TABLE mechanics_checklist
  ALTER COLUMN inspection_id DROP NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_quote_id 
  ON mechanics_checklist(quote_id);

-- Comentário explicativo
COMMENT ON COLUMN mechanics_checklist.quote_id IS 'ID do quote do parceiro que criou este checklist (substitui o uso incorreto de inspection_id)';
COMMENT ON COLUMN mechanics_checklist.inspection_id IS 'DEPRECATED: Usado apenas para dados legados. Novos registros devem usar quote_id';

-- =====================================================
-- 2. ADICIONAR COLUNA quote_id EM mechanics_checklist_items
-- =====================================================

ALTER TABLE mechanics_checklist_items
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Tornar inspection_id opcional
ALTER TABLE mechanics_checklist_items
  ALTER COLUMN inspection_id DROP NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_items_quote_id 
  ON mechanics_checklist_items(quote_id);

-- Comentário explicativo
COMMENT ON COLUMN mechanics_checklist_items.quote_id IS 'ID do quote do parceiro que criou este item';
COMMENT ON COLUMN mechanics_checklist_items.inspection_id IS 'DEPRECATED: Usado apenas para dados legados. Novos registros devem usar quote_id';

-- =====================================================
-- 3. ADICIONAR COLUNA quote_id EM mechanics_checklist_evidences
-- =====================================================

ALTER TABLE mechanics_checklist_evidences
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Tornar inspection_id opcional
ALTER TABLE mechanics_checklist_evidences
  ALTER COLUMN inspection_id DROP NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_evidences_quote_id 
  ON mechanics_checklist_evidences(quote_id);

-- Comentário explicativo
COMMENT ON COLUMN mechanics_checklist_evidences.quote_id IS 'ID do quote do parceiro que criou esta evidência';
COMMENT ON COLUMN mechanics_checklist_evidences.inspection_id IS 'DEPRECATED: Usado apenas para dados legados. Novos registros devem usar quote_id';

-- =====================================================
-- 4. ADICIONAR COLUNA quote_id EM vehicle_anomalies
-- =====================================================

ALTER TABLE vehicle_anomalies
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Tornar inspection_id opcional
ALTER TABLE vehicle_anomalies
  ALTER COLUMN inspection_id DROP NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_vehicle_anomalies_quote_id 
  ON vehicle_anomalies(quote_id);

-- Comentário explicativo
COMMENT ON COLUMN vehicle_anomalies.quote_id IS 'ID do quote do parceiro que registrou esta anomalia';
COMMENT ON COLUMN vehicle_anomalies.inspection_id IS 'DEPRECATED: Usado apenas para dados legados (de especialistas). Parceiros devem usar quote_id';

-- =====================================================
-- 6. VERIFICAÇÃO E VALIDAÇÃO
-- =====================================================

-- Criar view para monitorar migração
CREATE OR REPLACE VIEW v_checklist_migration_status AS
SELECT 
  'mechanics_checklist' AS table_name,
  COUNT(*) AS total_records,
  COUNT(quote_id) AS with_quote_id,
  COUNT(inspection_id) AS with_inspection_id,
  COUNT(*) - COUNT(quote_id) AS missing_quote_id
FROM mechanics_checklist
UNION ALL
SELECT 
  'mechanics_checklist_items',
  COUNT(*),
  COUNT(quote_id),
  COUNT(inspection_id),
  COUNT(*) - COUNT(quote_id)
FROM mechanics_checklist_items
UNION ALL
SELECT 
  'mechanics_checklist_evidences',
  COUNT(*),
  COUNT(quote_id),
  COUNT(inspection_id),
  COUNT(*) - COUNT(quote_id)
FROM mechanics_checklist_evidences
UNION ALL
SELECT 
  'vehicle_anomalies',
  COUNT(*),
  COUNT(quote_id),
  COUNT(inspection_id),
  COUNT(*) - COUNT(quote_id)
FROM vehicle_anomalies;

-- Comentário na view
COMMENT ON VIEW v_checklist_migration_status IS 'Monitora o status da migração de inspection_id para quote_id';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. Esta migration é IDEMPOTENTE (pode ser executada múltiplas vezes)
-- 2. Mantém backward compatibility com inspection_id para dados legados
-- 3. Novos registros devem usar quote_id obrigatoriamente
-- 4. A coluna inspection_id será mantida mas marcada como DEPRECATED
-- 5. Em uma futura migration, podemos remover inspection_id completamente
-- 6. Use a view v_checklist_migration_status para verificar o progresso
-- 7. Para dados existentes, faça reset do banco ou migre manualmente

-- Verificar resultado da migração
-- SELECT * FROM v_checklist_migration_status;
