-- Migration: Add pending_partner status to quote_status enum
-- Description: Adiciona o status 'pending_partner' ao enum quote_status para representar
--              quotes que estão aguardando preenchimento pelo parceiro.
-- Idempotency: Usa DO $$ BEGIN ... EXCEPTION para evitar erro se já existir

DO $$
BEGIN
    -- Adiciona o novo valor ao enum quote_status se ainda não existir
    ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'pending_partner';
EXCEPTION
    WHEN duplicate_object THEN
        -- Status já existe, não faz nada
        NULL;
END $$;

-- Comentário para documentar o novo status
COMMENT ON TYPE quote_status IS 'Status do orçamento: pending_partner (aguardando parceiro), pending_admin_approval (aguardando admin), pending_client_approval (aguardando cliente), approved (aprovado), rejected (rejeitado), admin_review (em revisão admin)';
