-- Migration para criação da tabela email_confirmation_tokens
-- Data: 2025-08-01
-- Descrição: Tabela para armazenar tokens de confirmação de email

CREATE TABLE IF NOT EXISTS email_confirmation_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Índices para performance
    INDEX idx_email_confirmation_tokens_user_id ON email_confirmation_tokens(user_id),
    INDEX idx_email_confirmation_tokens_token ON email_confirmation_tokens(token),
    INDEX idx_email_confirmation_tokens_expires_at ON email_confirmation_tokens(expires_at)
);

-- Comentários para documentação
COMMENT ON TABLE email_confirmation_tokens IS 'Armazena tokens para confirmação de email após aprovação de cadastro';
COMMENT ON COLUMN email_confirmation_tokens.user_id IS 'ID do usuário no sistema de autenticação';
COMMENT ON COLUMN email_confirmation_tokens.token IS 'Token único para confirmação de email';
COMMENT ON COLUMN email_confirmation_tokens.created_at IS 'Data/hora de criação do token';
COMMENT ON COLUMN email_confirmation_tokens.expires_at IS 'Data/hora de expiração do token';
COMMENT ON COLUMN email_confirmation_tokens.used_at IS 'Data/hora quando o token foi utilizado (NULL = não usado)';

-- Habilitar Row Level Security (RLS)
ALTER TABLE email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios tokens
CREATE POLICY "Users can view their own confirmation tokens" ON email_confirmation_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir inserção de tokens pelos administradores
CREATE POLICY "Admins can insert confirmation tokens" ON email_confirmation_tokens
    FOR INSERT WITH CHECK (true);

-- Política para permitir atualização de tokens (marcar como usado)
CREATE POLICY "Users can update their own confirmation tokens" ON email_confirmation_tokens
    FOR UPDATE USING (auth.uid() = user_id);
