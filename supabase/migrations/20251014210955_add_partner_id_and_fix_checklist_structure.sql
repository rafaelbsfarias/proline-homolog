-- =====================================================
-- MIGRATION: Adiciona partner_id e corrige estrutura de checklist
-- =====================================================
-- Data: 14 de Outubro de 2025
-- Autor: Code Review Analysis
-- Objetivo: Corrigir gaps críticos identificados no code review
--
-- PROBLEMAS CORRIGIDOS:
-- 1. mechanics_checklist_items sem partner_id (GAP 1 - CRÍTICO)
-- 2. mechanics_checklist_evidence não existia (GAP 2 - BLOQUEADOR)
-- 3. Falta de índices (PERFORMANCE)
-- 4. Falta de RLS policies (SEGURANÇA)
-- 5. Falta de constraints adequados (INTEGRIDADE)
-- =====================================================

-- =====================================================
-- PARTE 1: Corrigir mechanics_checklist_items
-- =====================================================

-- 1.1) Adicionar coluna partner_id
ALTER TABLE mechanics_checklist_items
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(profile_id) ON DELETE CASCADE;

-- 1.2) Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_mci_partner_id 
  ON mechanics_checklist_items(partner_id);

CREATE INDEX IF NOT EXISTS idx_mci_inspection_id 
  ON mechanics_checklist_items(inspection_id) 
  WHERE inspection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mci_quote_id 
  ON mechanics_checklist_items(quote_id) 
  WHERE quote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mci_vehicle_id 
  ON mechanics_checklist_items(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_mci_item_key 
  ON mechanics_checklist_items(item_key);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_mci_partner_quote 
  ON mechanics_checklist_items(partner_id, quote_id) 
  WHERE partner_id IS NOT NULL AND quote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mci_partner_inspection 
  ON mechanics_checklist_items(partner_id, inspection_id) 
  WHERE partner_id IS NOT NULL AND inspection_id IS NOT NULL;

-- Índice para part_request JSONB
CREATE INDEX IF NOT EXISTS idx_mci_part_request 
  ON mechanics_checklist_items USING GIN(part_request)
  WHERE part_request IS NOT NULL;

-- 1.3) Adicionar constraints de integridade
-- Garantir que pelo menos um ID de contexto existe
ALTER TABLE mechanics_checklist_items
  DROP CONSTRAINT IF EXISTS check_has_context_id;

ALTER TABLE mechanics_checklist_items
  ADD CONSTRAINT check_has_context_id 
  CHECK (inspection_id IS NOT NULL OR quote_id IS NOT NULL);

-- Garantir que partner_id está presente (será NOT NULL após migração de dados)
-- Por ora deixamos nullable para permitir migração gradual

-- 1.4) Adicionar unique constraint mais robusto
-- Remove constraint antigo se existir
ALTER TABLE mechanics_checklist_items
  DROP CONSTRAINT IF EXISTS unique_item_per_context;

-- Cria novo constraint que considera partner_id
-- Permite mesmo item_key para diferentes partners no mesmo quote/inspection
CREATE UNIQUE INDEX IF NOT EXISTS idx_mci_unique_partner_quote_item
  ON mechanics_checklist_items(partner_id, quote_id, item_key)
  WHERE partner_id IS NOT NULL AND quote_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mci_unique_partner_inspection_item
  ON mechanics_checklist_items(partner_id, inspection_id, item_key)
  WHERE partner_id IS NOT NULL AND inspection_id IS NOT NULL;

-- 1.5) Adicionar comentários de documentação
COMMENT ON COLUMN mechanics_checklist_items.partner_id IS 
  'ID do parceiro que preencheu este item. OBRIGATÓRIO para segmentação de dados.';

COMMENT ON COLUMN mechanics_checklist_items.quote_id IS 
  'ID do orçamento associado. Alternativa a inspection_id para novo fluxo.';

COMMENT ON COLUMN mechanics_checklist_items.part_request IS 
  'Dados da solicitação de compra de peças em formato JSONB. 
  Estrutura: {
    "part_name": string,
    "quantity": number,
    "estimated_price": number,
    "notes": string,
    "urgency": "low"|"medium"|"high"
  }';

-- =====================================================
-- PARTE 2: Criar tabela mechanics_checklist_evidence
-- =====================================================
-- NOTA: Esta tabela estava referenciada no código mas não existia no banco!

-- 2.1) Drop se existir (para idempotência)
DROP TABLE IF EXISTS mechanics_checklist_evidence CASCADE;

-- 2.2) Criar tabela com estrutura completa
CREATE TABLE mechanics_checklist_evidence (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(profile_id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Dados da evidência
  item_key TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_evidence_has_context_id 
    CHECK (inspection_id IS NOT NULL OR quote_id IS NOT NULL),
  
  CONSTRAINT check_media_type 
    CHECK (media_type IN ('image', 'video', 'document'))
);

-- 2.3) Criar índices
CREATE INDEX IF NOT EXISTS idx_mce_partner_id 
  ON mechanics_checklist_evidence(partner_id);

CREATE INDEX IF NOT EXISTS idx_mce_inspection_id 
  ON mechanics_checklist_evidence(inspection_id) 
  WHERE inspection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mce_quote_id 
  ON mechanics_checklist_evidence(quote_id) 
  WHERE quote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mce_vehicle_id 
  ON mechanics_checklist_evidence(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_mce_item_key 
  ON mechanics_checklist_evidence(item_key);

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_mce_partner_quote 
  ON mechanics_checklist_evidence(partner_id, quote_id) 
  WHERE partner_id IS NOT NULL AND quote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mce_partner_inspection 
  ON mechanics_checklist_evidence(partner_id, inspection_id) 
  WHERE partner_id IS NOT NULL AND inspection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mce_partner_item 
  ON mechanics_checklist_evidence(partner_id, item_key);

-- 2.4) Adicionar unique constraint
-- Evita duplicação de evidências para o mesmo contexto+partner+item
CREATE UNIQUE INDEX idx_mce_unique_partner_quote_item_media
  ON mechanics_checklist_evidence(partner_id, quote_id, item_key, media_url)
  WHERE partner_id IS NOT NULL AND quote_id IS NOT NULL;

CREATE UNIQUE INDEX idx_mce_unique_partner_inspection_item_media
  ON mechanics_checklist_evidence(partner_id, inspection_id, item_key, media_url)
  WHERE partner_id IS NOT NULL AND inspection_id IS NOT NULL;

-- 2.5) Trigger para updated_at
CREATE OR REPLACE FUNCTION update_mechanics_checklist_evidence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_mechanics_checklist_evidence_updated_at
  BEFORE UPDATE ON mechanics_checklist_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_mechanics_checklist_evidence_updated_at();

-- 2.6) Comentários de documentação
COMMENT ON TABLE mechanics_checklist_evidence IS 
  'Armazena evidências (fotos/vídeos) associadas aos itens do checklist de mecânica. 
  Cada evidência é vinculada a um partner específico para garantir isolamento de dados.';

COMMENT ON COLUMN mechanics_checklist_evidence.partner_id IS 
  'ID do parceiro que criou esta evidência. OBRIGATÓRIO para segmentação.';

COMMENT ON COLUMN mechanics_checklist_evidence.inspection_id IS 
  'ID da inspeção associada. Alternativa: use quote_id. Pelo menos um deve existir.';

COMMENT ON COLUMN mechanics_checklist_evidence.quote_id IS 
  'ID do orçamento associado. Alternativa: use inspection_id. Pelo menos um deve existir.';

COMMENT ON COLUMN mechanics_checklist_evidence.item_key IS 
  'Chave do item do checklist (ex: "motor.oil_level"). Relaciona com mechanics_checklist_items.item_key.';

COMMENT ON COLUMN mechanics_checklist_evidence.media_url IS 
  'URL do arquivo de mídia no Supabase Storage.';

COMMENT ON COLUMN mechanics_checklist_evidence.media_type IS 
  'Tipo de mídia: image, video, ou document.';

-- =====================================================
-- PARTE 3: RLS Policies (Segurança)
-- =====================================================

-- 3.1) Habilitar RLS nas tabelas
ALTER TABLE mechanics_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics_checklist_evidence ENABLE ROW LEVEL SECURITY;

-- 3.2) Policies para mechanics_checklist_items

-- Partners podem ver apenas seus próprios items
CREATE POLICY "Partners can view own checklist items"
  ON mechanics_checklist_items
  FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Partners podem inserir items apenas com seu partner_id
CREATE POLICY "Partners can insert own checklist items"
  ON mechanics_checklist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Partners podem atualizar apenas seus próprios items
CREATE POLICY "Partners can update own checklist items"
  ON mechanics_checklist_items
  FOR UPDATE
  TO authenticated
  USING (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Partners podem deletar apenas seus próprios items
CREATE POLICY "Partners can delete own checklist items"
  ON mechanics_checklist_items
  FOR DELETE
  TO authenticated
  USING (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Admins e clients podem ver items de quotes que possuem acesso
CREATE POLICY "Admins and clients can view checklist items"
  ON mechanics_checklist_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      JOIN service_orders so ON q.service_order_id = so.id
      WHERE q.id = mechanics_checklist_items.quote_id
      AND (
        -- Admin pode ver tudo
        EXISTS (SELECT 1 FROM admins WHERE profile_id = auth.uid())
        OR
        -- Client pode ver seus próprios quotes
        EXISTS (
          SELECT 1 FROM clients c
          WHERE c.profile_id = auth.uid()
          AND so.client_id = c.profile_id
        )
      )
    )
  );

-- 3.3) Policies para mechanics_checklist_evidence

-- Partners podem ver apenas suas próprias evidences
CREATE POLICY "Partners can view own evidences"
  ON mechanics_checklist_evidence
  FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Partners podem inserir evidences apenas com seu partner_id
CREATE POLICY "Partners can insert own evidences"
  ON mechanics_checklist_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Partners podem atualizar apenas suas próprias evidences
CREATE POLICY "Partners can update own evidences"
  ON mechanics_checklist_evidence
  FOR UPDATE
  TO authenticated
  USING (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Partners podem deletar apenas suas próprias evidences
CREATE POLICY "Partners can delete own evidences"
  ON mechanics_checklist_evidence
  FOR DELETE
  TO authenticated
  USING (
    partner_id IN (
      SELECT profile_id FROM partners 
      WHERE profile_id = auth.uid()
    )
  );

-- Admins e clients podem ver evidences de quotes que possuem acesso
CREATE POLICY "Admins and clients can view evidences"
  ON mechanics_checklist_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      JOIN service_orders so ON q.service_order_id = so.id
      WHERE q.id = mechanics_checklist_evidence.quote_id
      AND (
        -- Admin pode ver tudo
        EXISTS (SELECT 1 FROM admins WHERE profile_id = auth.uid())
        OR
        -- Client pode ver seus próprios quotes
        EXISTS (
          SELECT 1 FROM clients c
          WHERE c.profile_id = auth.uid()
          AND so.client_id = c.profile_id
        )
      )
    )
  );

-- =====================================================
-- PARTE 4: Migração de Dados Existentes (se houver)
-- =====================================================

-- 4.1) Análise de dados órfãos (sem partner_id)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM mechanics_checklist_items
  WHERE partner_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️  Encontrados % items sem partner_id', orphan_count;
    RAISE NOTICE '   Estes items precisam ser associados manualmente ou removidos';
    RAISE NOTICE '   Query para investigar: SELECT * FROM mechanics_checklist_items WHERE partner_id IS NULL;';
  ELSE
    RAISE NOTICE '✅ Nenhum item órfão encontrado';
  END IF;
END $$;

-- 4.2) Tentar inferir partner_id de mechanics_checklist_evidences antigo (se existia)
-- NOTA: Como mechanics_checklist_evidence não existia, esta seção é preventiva

-- Se houver lógica para inferir partner_id de outros relacionamentos, adicionar aqui
-- Exemplo: via inspection -> quote -> partner_services -> partner_id

-- =====================================================
-- PARTE 5: Validações Finais
-- =====================================================

-- 5.1) Verificar estrutura final
DO $$
DECLARE
  items_has_partner BOOLEAN;
  evidence_exists BOOLEAN;
BEGIN
  -- Verificar mechanics_checklist_items
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanics_checklist_items' 
    AND column_name = 'partner_id'
  ) INTO items_has_partner;
  
  -- Verificar mechanics_checklist_evidence
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'mechanics_checklist_evidence'
  ) INTO evidence_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'MIGRATION COMPLETED - VALIDATION RESULTS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ mechanics_checklist_items.partner_id: %', 
    CASE WHEN items_has_partner THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE '✅ mechanics_checklist_evidence table: %', 
    CASE WHEN evidence_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '   1. Update code to filter by partner_id in load operations';
  RAISE NOTICE '   2. Test data isolation between partners';
  RAISE NOTICE '   3. Verify RLS policies are working correctly';
  RAISE NOTICE '   4. Monitor performance with new indexes';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
