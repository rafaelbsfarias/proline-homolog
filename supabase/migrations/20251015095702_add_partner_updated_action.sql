-- Migration: Adicionar 'partner_updated' ao constraint de actions na tabela quote_time_reviews
-- Data: 2025-10-15
-- Descrição: Permite registrar quando o parceiro atualiza os prazos após revisão do especialista

DO $$ 
BEGIN
  -- Verificar se o constraint existe antes de tentar removê-lo
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'quote_time_reviews_action_check'
  ) THEN
    -- Remover o constraint antigo
    ALTER TABLE quote_time_reviews 
    DROP CONSTRAINT quote_time_reviews_action_check;
  END IF;

  -- Adicionar o novo constraint com 'partner_updated'
  ALTER TABLE quote_time_reviews 
  ADD CONSTRAINT quote_time_reviews_action_check 
  CHECK (action IN ('approved', 'revision_requested', 'partner_updated'));
END $$;
