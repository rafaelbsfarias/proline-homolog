-- Migration: Add is_active column to partner_services
-- Description: Permite admin ativar/desativar serviços de parceiros
-- Date: 2025-10-13

-- Adicionar coluna is_active (padrão: true para não quebrar serviços existentes)
ALTER TABLE public.partner_services
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para melhorar performance de queries filtradas por is_active
CREATE INDEX IF NOT EXISTS idx_partner_services_is_active 
ON public.partner_services(is_active);

-- Criar índice composto para queries comuns (partner_id + is_active)
CREATE INDEX IF NOT EXISTS idx_partner_services_partner_active 
ON public.partner_services(partner_id, is_active);

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.partner_services.is_active IS 
'Indica se o serviço está ativo e disponível para uso. Admin pode desativar temporariamente.';
