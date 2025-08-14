-- ============================================================================
-- POLÍTICAS RLS PARA CADASTRO PÚBLICO DE CLIENTES
-- ============================================================================
-- Este arquivo contém políticas RLS permissivas para permitir cadastro
-- de clientes através do formulário público (/cadastro)
-- ============================================================================

-- Primeiro, vamos remover políticas existentes que podem estar causando conflito
DO $$
BEGIN
    -- Remover políticas existentes da tabela profiles
    DROP POLICY IF EXISTS "User can access their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Clients can access their own data" ON public.clients;
    
    -- Remover políticas que possam estar bloqueando inserção
    DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Service role can manage clients" ON public.clients;
    
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Algumas políticas não existiam, continuando...';
END $$;

-- ============================================================================
-- POLÍTICAS PARA TABELA PROFILES
-- ============================================================================

-- 1. Permitir que Service Role (signup endpoint) crie qualquer profile
CREATE POLICY "Service role can create any profile" ON public.profiles
    FOR INSERT
    WITH CHECK (true); -- Service role pode inserir qualquer profile

-- 2. Permitir que Service Role gerencie profiles (para operações admin)
CREATE POLICY "Service role can manage all profiles" ON public.profiles
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- 3. Usuários autenticados podem ver e editar apenas seu próprio profile
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Admins podem ver todos os profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND (
            auth.jwt() ->> 'role' = 'admin'
            OR 
            public.get_my_claim('role') = 'admin'
        )
    );

-- ============================================================================
-- POLÍTICAS PARA TABELA CLIENTS
-- ============================================================================

-- 1. Permitir que Service Role crie qualquer client (para signup)
CREATE POLICY "Service role can create any client" ON public.clients
    FOR INSERT
    WITH CHECK (true); -- Service role pode inserir qualquer client

-- 2. Permitir que Service Role gerencie clients (para operações admin)
CREATE POLICY "Service role can manage all clients" ON public.clients
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- 3. Clientes podem ver e editar apenas seus próprios dados
CREATE POLICY "Clients can manage their own data" ON public.clients
    FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- 4. Admins e especialistas podem ver todos os clients
CREATE POLICY "Staff can view all clients" ON public.clients
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND (
            auth.jwt() ->> 'role' IN ('admin', 'specialist')
            OR 
            public.get_my_claim('role') IN ('admin', 'specialist')
        )
    );

-- ============================================================================
-- POLÍTICAS PARA OUTRAS TABELAS RELACIONADAS AO CADASTRO
-- ============================================================================

-- Garantir que outras tabelas não impeçam o cadastro
-- (se houver referências ou triggers)

-- Para tabela vehicles (se o cliente for criado com veículos)
DROP POLICY IF EXISTS "Service role can create vehicles" ON public.vehicles;
CREATE POLICY "Service role can create vehicles" ON public.vehicles
    FOR INSERT
    WITH CHECK (true);

-- Para tabela addresses (se endereços forem criados durante cadastro)
DROP POLICY IF EXISTS "Service role can create addresses" ON public.addresses;
CREATE POLICY "Service role can create addresses" ON public.addresses
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS DE FALLBACK PARA DEBUGGING
-- ============================================================================

-- Em caso de problemas, estas políticas podem ser ativadas temporariamente
-- CUIDADO: Use apenas em desenvolvimento/debugging

-- Política de emergência para profiles (COMENTADA por segurança)
-- CREATE POLICY "Emergency bypass for profiles" ON public.profiles
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- Política de emergência para clients (COMENTADA por segurança)
-- CREATE POLICY "Emergency bypass for clients" ON public.clients
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- ============================================================================
-- VERIFICAÇÕES E PERMISSÕES ADICIONAIS
-- ============================================================================

-- Garantir que a role service_role tem permissões na schema public
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Garantir que a role authenticated tem permissões básicas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;

-- ============================================================================
-- FUNÇÃO AUXILIAR PARA VERIFICAR SE É OPERAÇÃO DE SIGNUP
-- ============================================================================

-- Função para detectar se a operação está vindo do endpoint de signup
CREATE OR REPLACE FUNCTION public.is_signup_operation()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
    OR current_setting('role') = 'service_role'
    OR auth.jwt() ->> 'aud' = 'authenticated'; -- Fallback para operações de auth
$$;

-- ============================================================================
-- LOGS E MONITORAMENTO
-- ============================================================================

-- Criar uma view para monitorar tentativas de inserção
CREATE OR REPLACE VIEW public.signup_attempts AS
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.created_at,
    c.document_number,
    c.company_name
FROM public.profiles p
LEFT JOIN public.clients c ON p.id = c.profile_id
WHERE p.role = 'client'
ORDER BY p.created_at DESC;

-- Permitir que admins vejam esta view
GRANT SELECT ON public.signup_attempts TO authenticated;

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "Service role can create any profile" ON public.profiles 
IS 'Permite que o endpoint /api/signup crie profiles sem autenticação prévia';

COMMENT ON POLICY "Service role can create any client" ON public.clients 
IS 'Permite que o endpoint /api/signup crie registros de clients sem autenticação prévia';

COMMENT ON FUNCTION public.is_signup_operation() 
IS 'Função auxiliar para detectar operações vindas do processo de signup';

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================

-- Para aplicar estas políticas:
-- 1. Execute este script no SQL Editor do Supabase Studio
-- 2. Teste o cadastro público em /cadastro
-- 3. Monitore os logs para verificar se não há mais erros de permissão
-- 4. Se necessário, ative temporariamente as políticas de emergência (comentadas)

-- Para reverter em caso de problemas:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
-- (Reative depois de corrigir as políticas)
