-- Migração para adicionar campos de contrato na tabela profiles
-- Arquivo: 20250801_add_contract_fields_to_profiles.sql

-- Adicionar colunas para dados de contrato do cliente
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS parqueamento DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS quilometragem INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentual_fipe DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS taxa_operacao DECIMAL(10,2) DEFAULT 0.00;

-- Comentários para documentar as colunas
COMMENT ON COLUMN profiles.parqueamento IS 'Valor do parqueamento em reais';
COMMENT ON COLUMN profiles.quilometragem IS 'Quilometragem do veículo em km';
COMMENT ON COLUMN profiles.percentual_fipe IS 'Percentual FIPE em porcentagem';
COMMENT ON COLUMN profiles.taxa_operacao IS 'Taxa de operação em reais';

-- Dados de exemplo para teste (opcional)
-- UPDATE profiles SET 
--   parqueamento = 20.00,
--   quilometragem = 80000,
--   percentual_fipe = 5.00,
--   taxa_operacao = 600.00
-- WHERE role = 'client';
