-- Migration: Tornar specialist_id nullable na tabela quote_time_reviews
-- Motivo: Quando o parceiro atualiza os prazos (action='partner_updated'), 
--         o registro não tem specialist_id associado

-- Remover a constraint NOT NULL da coluna specialist_id
ALTER TABLE public.quote_time_reviews 
ALTER COLUMN specialist_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.quote_time_reviews.specialist_id IS 
'ID do especialista. NULL quando a ação é partner_updated (parceiro atualizando prazos)';
