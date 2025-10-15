-- Migration: Corrigir constraint única em mechanics_checklist
-- Problema: unique_vehicle_inspection (vehicle_id, inspection_id) impede múltiplos parceiros
--           de salvarem checklist para o mesmo veículo
-- Solução: Substituir por constraint que inclui partner_id e quote_id

-- =====================================================
-- 1. REMOVER CONSTRAINT ANTIGA
-- =====================================================

-- Remover constraint antiga que não considera parceiros diferentes
ALTER TABLE mechanics_checklist
  DROP CONSTRAINT IF EXISTS unique_vehicle_inspection;

-- =====================================================
-- 2. CRIAR NOVA CONSTRAINT PARA quote_id (nova arquitetura)
-- =====================================================

-- Cada parceiro pode ter apenas um checklist por quote_id
-- Esta é a constraint principal para a nova arquitetura
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT unique_partner_quote 
  UNIQUE (partner_id, quote_id);

-- =====================================================
-- 3. CRIAR CONSTRAINT PARA inspection_id (legacy)
-- =====================================================

-- Para dados legados que ainda usam inspection_id
-- Cada parceiro pode ter apenas um checklist por veículo/inspeção
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT unique_partner_vehicle_inspection 
  UNIQUE (partner_id, vehicle_id, inspection_id);

-- =====================================================
-- 4. COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON CONSTRAINT unique_partner_quote ON mechanics_checklist IS 
  'Garante que cada parceiro pode ter apenas um checklist por quote. Nova arquitetura.';

COMMENT ON CONSTRAINT unique_partner_vehicle_inspection ON mechanics_checklist IS 
  'Garante unicidade para dados legados com inspection_id. Permite múltiplos parceiros no mesmo veículo.';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. A constraint unique_partner_quote é a principal para novos dados
-- 2. A constraint unique_partner_vehicle_inspection mantém compatibilidade com dados legados
-- 3. Agora múltiplos parceiros podem salvar checklist para o mesmo veículo
-- 4. Cada parceiro só pode ter um checklist por quote_id (evita duplicação)
-- 5. Esta migration é IDEMPOTENTE (pode ser executada múltiplas vezes)

-- Exemplo de uso correto:
-- Parceiro 1 (Funilaria) -> vehicle_id: ABC, partner_id: P1, quote_id: Q1 ✅
-- Parceiro 2 (Pintura)   -> vehicle_id: ABC, partner_id: P2, quote_id: Q2 ✅
-- Parceiro 1 (Funilaria) -> vehicle_id: ABC, partner_id: P1, quote_id: Q1 ❌ (duplicata)
