-- Migration: Add "Em Orçamentação" vehicle status
-- Data: 2025-10-08
-- Descrição: Adiciona o status "Em Orçamentação" para uso quando parceiros iniciam checklist

-- Este status é usado quando um parceiro de determinada categoria
-- inicia o processo de checklist/orçamento para um veículo

-- Nota: Esta é uma migration idempotente - pode ser executada múltiplas vezes sem efeitos colaterais

DO $$
BEGIN
    -- Não há constraint de CHECK em vehicle.status, então apenas documentamos
    -- O status "Em Orçamentação" está disponível para uso
    
    -- Exemplo de como seria utilizado:
    -- UPDATE vehicles SET status = 'Em Orçamentação' 
    -- WHERE id = '<vehicle_id>' AND status IN ('Análise Finalizada', 'Em Análise');
    
    RAISE NOTICE 'Status "Em Orçamentação" disponível para uso';
    RAISE NOTICE 'Este status será registrado na timeline (vehicle_history) quando parceiro iniciar checklist';
END $$;

-- Comentário sobre o uso do status
COMMENT ON COLUMN vehicles.status IS 'Status atual do veículo. Valores incluem: Aguardando Coleta, Em Análise, Análise Finalizada, Em Orçamentação, Análise Orçamentária Iniciada, entre outros';
