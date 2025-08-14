-- Teste de criação de parceiro como service_role (admin)

-- 1. Verificar se a tabela existe e estrutura
\d pending_registrations;

-- 2. Tentar inserir um parceiro de teste
INSERT INTO pending_registrations (
  full_name,
  email,
  cnpj,
  company_name,
  address,
  phone,
  role,
  status,
  created_at
) VALUES (
  'Teste Admin Parceiro',
  'teste.admin@parceiro.com',
  '12.345.678/0001-90',
  'Empresa Teste Admin',
  'Rua de Teste, 123',
  '(11) 99999-9999',
  'partner',
  'pending',
  NOW()
);

-- 3. Verificar se foi inserido
SELECT * FROM pending_registrations 
WHERE email = 'teste.admin@parceiro.com';

-- 4. Verificar políticas RLS ativas na tabela
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pending_registrations';

-- 5. Verificar se RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'pending_registrations';

-- 6. Limpar teste
DELETE FROM pending_registrations 
WHERE email = 'teste.admin@parceiro.com';
