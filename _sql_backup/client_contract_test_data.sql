-- Script para popular dados de teste para contratos de clientes
-- Execute este script para testar a funcionalidade de termos do contrato

-- Inserir ou atualizar dados de exemplo para clientes
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  parqueamento, 
  quilometragem, 
  percentual_fipe, 
  taxa_operacao
) VALUES 
  (
    gen_random_uuid(),
    'cliente1@teste.com',
    'João Silva',
    'client',
    20.00,
    80000,
    5.00,
    600.00
  ),
  (
    gen_random_uuid(),
    'cliente2@teste.com',
    'Maria Santos',
    'client',
    25.50,
    65000,
    7.25,
    750.00
  ),
  (
    gen_random_uuid(),
    'cliente3@teste.com',
    'Pedro Oliveira',
    'client',
    18.75,
    120000,
    4.50,
    525.00
  )
ON CONFLICT (email) DO UPDATE SET
  parqueamento = EXCLUDED.parqueamento,
  quilometragem = EXCLUDED.quilometragem,
  percentual_fipe = EXCLUDED.percentual_fipe,
  taxa_operacao = EXCLUDED.taxa_operacao;

-- Verificar dados inseridos
SELECT 
  email,
  full_name,
  role,
  parqueamento,
  quilometragem,
  percentual_fipe,
  taxa_operacao
FROM profiles 
WHERE role = 'client'
ORDER BY full_name;
