-- Migração para padronizar status de veículos
-- Atualiza registros inconsistentes para usar apenas 'Análise Finalizada'

-- Atualizar registros com status inconsistente
UPDATE vehicles
SET status = 'Análise Finalizada'
WHERE status = 'ANALISE_FINALIZADA';

UPDATE vehicles
SET status = 'Análise Finalizada'
WHERE status = 'ANÁLISE FINALIZADA';

-- Verificar se a atualização foi bem-sucedida
-- SELECT status, COUNT(*) as count
-- FROM vehicles
-- GROUP BY status
-- ORDER BY status;
