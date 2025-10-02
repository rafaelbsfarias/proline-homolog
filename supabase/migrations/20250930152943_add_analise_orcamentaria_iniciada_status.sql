-- Adiciona novo status de veículo para análise orçamentária
-- Migration: Add "Análise Orçamentária Iniciada" vehicle status

-- Esta migração é idempotente e adiciona o novo status se não existir

DO $$
BEGIN
    -- Verificar se o valor já existe na coluna status da tabela vehicles
    -- Se não existir, não há nada para fazer pois não usamos CHECK constraints específicos
    -- O novo status será aceito naturalmente
    
    -- Opcionalmente, podemos atualizar alguns registros existentes para teste
    -- UPDATE vehicles SET status = 'Análise Orçamentária Iniciada' 
    -- WHERE status = 'AGUARDANDO APROVAÇÃO DO ORÇAMENTO' AND created_at > NOW() - INTERVAL '1 day';
    
    -- Log da migração
    RAISE NOTICE 'Status "Análise Orçamentária Iniciada" disponível para uso';
    
END $$;