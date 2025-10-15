-- Adicionar coluna status na tabela vehicle_anomalies
-- Esta coluna irá rastrear o estado das anomalias (submitted, pending, etc.)

ALTER TABLE vehicle_anomalies
ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted';

-- Atualizar todas as anomalias existentes para ter status 'submitted'
-- já que foram criadas através do processo de checklist
UPDATE vehicle_anomalies
SET status = 'submitted'
WHERE status IS NULL OR status = '';

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN vehicle_anomalies.status IS 'Status da anomalia: submitted (submetida), pending (pendente), etc.';