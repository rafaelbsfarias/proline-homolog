-- Migration: add_quote_partial_approval
-- Purpose: Adicionar suporte para aprovação parcial de orçamentos pelo admin
-- Adiciona campos para rastrear itens rejeitados e motivos

-- Idempotente: adicionar coluna apenas se não existir
DO $$
BEGIN
  -- Adicionar coluna rejected_items para armazenar IDs dos itens rejeitados
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'rejected_items'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN rejected_items jsonb DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.quotes.rejected_items IS
    'Array de IDs de quote_items que foram rejeitados na aprovação parcial';
  END IF;

  -- Adicionar coluna rejection_reason para motivos de rejeição
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN rejection_reason text;
    
    COMMENT ON COLUMN public.quotes.rejection_reason IS
    'Motivo da rejeição total ou parcial do orçamento';
  END IF;

  -- Adicionar coluna admin_reviewed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'admin_reviewed_at'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN admin_reviewed_at timestamptz;
    
    COMMENT ON COLUMN public.quotes.admin_reviewed_at IS
    'Timestamp de quando o admin revisou o orçamento';
  END IF;

  -- Adicionar coluna admin_reviewed_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'admin_reviewed_by'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN admin_reviewed_by uuid REFERENCES auth.users(id);
    
    COMMENT ON COLUMN public.quotes.admin_reviewed_by IS
    'ID do admin que revisou o orçamento';
  END IF;

  -- Adicionar coluna is_partial_approval
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'is_partial_approval'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN is_partial_approval boolean DEFAULT false;
    
    COMMENT ON COLUMN public.quotes.is_partial_approval IS
    'Indica se foi uma aprovação parcial (alguns itens rejeitados)';
  END IF;
END $$;

-- Adicionar índice para buscas por items rejeitados
CREATE INDEX IF NOT EXISTS idx_quotes_rejected_items 
ON public.quotes USING gin (rejected_items);

-- Adicionar índice para buscas por admin reviewer
CREATE INDEX IF NOT EXISTS idx_quotes_admin_reviewed_by 
ON public.quotes (admin_reviewed_by);
