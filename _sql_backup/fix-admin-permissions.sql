-- ============================================================================
-- CORREÇÃO URGENTE: POLÍTICAS RLS PARA ADMINISTRADORES
-- ============================================================================
-- Resolver: permission denied for table specialists (e outras tabelas)
-- Garantir que ADMIN tenha acesso TOTAL ao banco
-- ============================================================================

-- PASSO 1: Remover todas as políticas restritivas existentes
DO $$
BEGIN
    -- Remover políticas das tabelas principais
    DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Staff can view all clients" ON public.clients;
    DROP POLICY IF EXISTS "Clients can manage their own data" ON public.clients;
    DROP POLICY IF EXISTS "Specialists can access their own data" ON public.specialists;
    DROP POLICY IF EXISTS "Partners can access their own data" ON public.partners;
    DROP POLICY IF EXISTS "Admins can access their own data" ON public.admins;
    
    -- Remover políticas que podem estar bloqueando admins
    DROP POLICY IF EXISTS "Staff can manage all clients" ON public.clients;
    DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
    DROP POLICY IF EXISTS "Admins can manage all partners" ON public.partners;
    DROP POLICY IF EXISTS "Admins can manage all specialists" ON public.specialists;
    DROP POLICY IF EXISTS "Admins can manage all admins" ON public.admins;
    
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Algumas políticas não existiam, continuando...';
END $$;

-- ============================================================================
-- POLÍTICAS PARA ADMINISTRADORES (ACESSO TOTAL)
-- ============================================================================

-- ADMINS têm acesso TOTAL a PROFILES
CREATE POLICY "Admins have full access to profiles" ON public.profiles
    FOR ALL
    USING (
        -- Verificar se é admin através de múltiplas formas
        (auth.jwt() ->> 'role' = 'admin') 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
        OR
        (public.get_my_claim('role') = 'admin')
        OR
        -- Fallback: verificar se o usuário atual tem role admin na tabela profiles
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    );

-- ADMINS têm acesso TOTAL a CLIENTS
CREATE POLICY "Admins have full access to clients" ON public.clients
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'admin') 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
        OR
        (public.get_my_claim('role') = 'admin')
        OR
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    );

-- ADMINS têm acesso TOTAL a SPECIALISTS
CREATE POLICY "Admins have full access to specialists" ON public.specialists
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'admin') 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
        OR
        (public.get_my_claim('role') = 'admin')
        OR
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    );

-- ADMINS têm acesso TOTAL a PARTNERS
CREATE POLICY "Admins have full access to partners" ON public.partners
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'admin') 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
        OR
        (public.get_my_claim('role') = 'admin')
        OR
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    );

-- ADMINS têm acesso TOTAL a ADMINS
CREATE POLICY "Admins have full access to admins" ON public.admins
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'admin') 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
        OR
        (public.get_my_claim('role') = 'admin')
        OR
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    );

-- ============================================================================
-- POLÍTICAS PARA SERVICE ROLE (OPERAÇÕES DE SISTEMA)
-- ============================================================================

-- SERVICE ROLE tem acesso total a todas as tabelas
CREATE POLICY "Service role has full access to profiles" ON public.profiles
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role has full access to clients" ON public.clients
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role has full access to specialists" ON public.specialists
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role has full access to partners" ON public.partners
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role has full access to admins" ON public.admins
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- ============================================================================
-- POLÍTICAS PARA USUÁRIOS NORMAIS (ACESSO LIMITADO)
-- ============================================================================

-- Usuários podem ver apenas seu próprio profile
CREATE POLICY "Users can access own profile" ON public.profiles
    FOR ALL
    USING (auth.uid() = id AND auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() = id AND auth.uid() IS NOT NULL);

-- Clientes podem ver apenas seus próprios dados
CREATE POLICY "Clients can access own data" ON public.clients
    FOR ALL
    USING (auth.uid() = profile_id AND auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() = profile_id AND auth.uid() IS NOT NULL);

-- Especialistas podem ver apenas seus próprios dados
CREATE POLICY "Specialists can access own data" ON public.specialists
    FOR ALL
    USING (auth.uid() = profile_id AND auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() = profile_id AND auth.uid() IS NOT NULL);

-- Parceiros podem ver apenas seus próprios dados
CREATE POLICY "Partners can access own data" ON public.partners
    FOR ALL
    USING (auth.uid() = profile_id AND auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() = profile_id AND auth.uid() IS NOT NULL);

-- ============================================================================
-- POLÍTICAS PARA OPERAÇÕES DE CADASTRO PÚBLICO
-- ============================================================================

-- Permitir inserção de profiles durante cadastro (sem autenticação)
CREATE POLICY "Allow public signup to create profiles" ON public.profiles
    FOR INSERT
    WITH CHECK (role = 'client'); -- Apenas clientes podem ser criados via signup público

-- Permitir inserção de clients durante cadastro (sem autenticação)
CREATE POLICY "Allow public signup to create clients" ON public.clients
    FOR INSERT
    WITH CHECK (true); -- Signup público pode criar clients

-- ============================================================================
-- GARANTIR PERMISSÕES DE SCHEMA
-- ============================================================================

-- Permissões para service_role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Permissões para authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Permissões para anon (cadastro público)
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.profiles TO anon;
GRANT INSERT ON public.clients TO anon;

-- ============================================================================
-- FUNÇÃO MELHORADA PARA DETECTAR ROLE DE ADMIN
-- ============================================================================

-- Função mais robusta para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT 
        -- Verificar multiple formas de detectar admin
        (auth.jwt() ->> 'role' = 'admin') 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
        OR
        (auth.jwt() -> 'raw_user_meta_data' ->> 'role' = 'admin')
        OR
        (public.get_my_claim('role') = 'admin')
        OR
        -- Verificar na tabela profiles
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ));
$$;

-- ============================================================================
-- TESTE RÁPIDO
-- ============================================================================

-- Verificar se admin pode acessar tudo
-- (Execute como usuário admin após aplicar as políticas)

-- SELECT 'Testando acesso admin...' as teste;
-- SELECT count(*) as total_profiles FROM public.profiles;
-- SELECT count(*) as total_clients FROM public.clients;
-- SELECT count(*) as total_specialists FROM public.specialists;
-- SELECT count(*) as total_partners FROM public.partners;
-- SELECT count(*) as total_admins FROM public.admins;

-- ============================================================================
-- LOGS E COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "Admins have full access to profiles" ON public.profiles 
IS 'Administradores têm acesso total à tabela profiles - múltiplas verificações de role';

COMMENT ON POLICY "Service role has full access to profiles" ON public.profiles 
IS 'Service role (operações de sistema) tem acesso total';

COMMENT ON FUNCTION public.is_admin() 
IS 'Função robusta para verificar se usuário atual é administrador';

-- ============================================================================
