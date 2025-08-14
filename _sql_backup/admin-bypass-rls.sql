-- ============================================================================
-- SOLUÇÃO ALTERNATIVA: BYPASS RLS PARA ADMINS
-- ============================================================================
-- Se as políticas complexas não funcionarem, esta é uma abordagem mais direta
-- ============================================================================

-- OPÇÃO 1: Políticas ultra-permissivas para admins
-- (Execute se a primeira solução não funcionou)

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to clients" ON public.clients;
DROP POLICY IF EXISTS "Admins have full access to specialists" ON public.specialists;
DROP POLICY IF EXISTS "Admins have full access to partners" ON public.partners;
DROP POLICY IF EXISTS "Admins have full access to admins" ON public.admins;

-- Criar políticas super-simples para admins
CREATE POLICY "Admin bypass profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data ->> 'role' = 'admin'
                 OR auth.users.raw_user_meta_data ->> 'role' = 'admin')
        )
    );

CREATE POLICY "Admin bypass clients" ON public.clients
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

CREATE POLICY "Admin bypass specialists" ON public.specialists
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

CREATE POLICY "Admin bypass partners" ON public.partners
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

CREATE POLICY "Admin bypass admins" ON public.admins
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- ============================================================================
-- OPÇÃO 2: DESATIVAR RLS TEMPORARIAMENTE (APENAS PARA DEBUG)
-- ============================================================================

-- ⚠️ CUIDADO: Use apenas em ambiente de desenvolvimento
-- Descomente as linhas abaixo se precisar desativar RLS temporariamente

-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.specialists DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Para reativar depois:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPÇÃO 3: VERIFICAR E CORRIGIR USER_METADATA DO ADMIN
-- ============================================================================

-- Verificar se o usuário admin tem o metadata correto
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data ->> 'role' as role_metadata
FROM auth.users 
WHERE email LIKE '%admin%' OR raw_user_meta_data ->> 'role' = 'admin';

-- Se o admin não tiver role no metadata, corrigir:
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb),
--     '{role}',
--     '"admin"'
-- )
-- WHERE email = 'seu-admin@email.com';

-- ============================================================================
-- OPÇÃO 4: CRIAR USUÁRIO ADMIN SE NÃO EXISTIR
-- ============================================================================

-- Script para criar usuário admin local (ambiente de desenvolvimento)
-- Descomente e ajuste o email se necessário:

-- INSERT INTO auth.users (
--     instance_id,
--     id,
--     aud,
--     role,
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     raw_user_meta_data,
--     created_at,
--     updated_at,
--     confirmation_token,
--     email_change,
--     email_change_token_new,
--     recovery_token
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     gen_random_uuid(),
--     'authenticated',
--     'authenticated',
--     'admin@local.com',
--     crypt('admin123', gen_salt('bf')),
--     NOW(),
--     '{"role": "admin"}',
--     NOW(),
--     NOW(),
--     '',
--     '',
--     '',
--     ''
-- ) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- TESTE FINAL
-- ============================================================================

-- Após aplicar uma das opções acima, teste:
SELECT 
    'TESTE FINAL' as status,
    count(*) as total_profiles
FROM public.profiles;

SELECT 
    'TESTE ESPECIALISTAS' as status,
    count(*) as total_specialists
FROM public.specialists;

-- Se ainda der erro, o problema pode ser:
-- 1. Usuário não tem role admin no metadata
-- 2. Função get_my_claim() não está funcionando
-- 3. RLS precisa ser temporariamente desabilitado

-- ============================================================================
