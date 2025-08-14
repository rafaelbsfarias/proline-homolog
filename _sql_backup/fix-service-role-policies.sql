-- Verificação e correção de políticas RLS para admin
-- Este script permite que o service role (usado pelas APIs admin) 
-- tenha acesso total às operações necessárias

-- 1. Verificar estado atual das políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('pending_registrations', 'profiles', 'clients')
ORDER BY tablename, policyname;

-- 2. Garantir que service role tenha bypass das políticas RLS
-- Isso é necessário para que as APIs admin funcionem corretamente

-- Para pending_registrations
DROP POLICY IF EXISTS "Service role full access" ON pending_registrations;
CREATE POLICY "Service role full access" ON pending_registrations
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Para profiles
DROP POLICY IF EXISTS "Service role full access" ON profiles;
CREATE POLICY "Service role full access" ON profiles
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Para clients (se existir)
DROP POLICY IF EXISTS "Service role full access" ON clients;
CREATE POLICY "Service role full access" ON clients
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Verificar se as políticas foram criadas
SELECT 
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE policyname = 'Service role full access'
ORDER BY tablename;

-- 4. Testar inserção como service role
SET LOCAL role service_role;

-- Teste de inserção na pending_registrations
INSERT INTO pending_registrations (
    full_name,
    email,
    cnpj,
    company_name,
    address,
    phone,
    role,
    status
) VALUES (
    'Teste Service Role',
    'teste.servicerole@teste.com',
    '98.765.432/0001-01',
    'Empresa Service Role',
    'Endereço Teste',
    '(11) 88888-8888',
    'partner',
    'pending'
) ON CONFLICT (email) DO NOTHING;

-- Verificar se inseriu
SELECT COUNT(*) as registros_inseridos 
FROM pending_registrations 
WHERE email = 'teste.servicerole@teste.com';

-- Limpar teste
DELETE FROM pending_registrations 
WHERE email = 'teste.servicerole@teste.com';

-- Voltar ao role padrão
RESET role;
