-- Migration: add_client_approval_fields
-- Purpose: Adicionar campos para rastrear aprovação/rejeição do cliente
-- Data: 2025-10-07

-- Idempotente: adicionar colunas apenas se não existirem
DO $$
BEGIN
  -- Adicionar coluna client_approved_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'client_approved_at'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN client_approved_at timestamptz;
    
    COMMENT ON COLUMN public.quotes.client_approved_at IS
    'Timestamp de quando o cliente aprovou o orçamento';
  END IF;

  -- Adicionar coluna client_approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'client_approved_by'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN client_approved_by uuid;
    
    COMMENT ON COLUMN public.quotes.client_approved_by IS
    'ID do cliente que aprovou o orçamento';
  END IF;

  -- Adicionar coluna client_rejected_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'client_rejected_at'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN client_rejected_at timestamptz;
    
    COMMENT ON COLUMN public.quotes.client_rejected_at IS
    'Timestamp de quando o cliente rejeitou o orçamento';
  END IF;

  -- Adicionar coluna client_rejected_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'client_rejected_by'
  ) THEN
    ALTER TABLE public.quotes
    ADD COLUMN client_rejected_by uuid;
    
    COMMENT ON COLUMN public.quotes.client_rejected_by IS
    'ID do cliente que rejeitou o orçamento';
  END IF;
END $$;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_quotes_client_approved_by 
ON public.quotes (client_approved_by);

CREATE INDEX IF NOT EXISTS idx_quotes_client_rejected_by 
ON public.quotes (client_rejected_by);
