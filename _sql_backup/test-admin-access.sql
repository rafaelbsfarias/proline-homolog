-- ============================================================================
-- TESTE DE PERMISSÕES DE ADMINISTRADOR
-- ============================================================================
-- Execute este script como usuário ADMIN para verificar se tem acesso total
-- ============================================================================

-- Informações do usuário atual
SELECT 
    'INFORMAÇÕES DO USUÁRIO ATUAL' as secao,
    auth.uid() as user_id,
    auth.role() as auth_role,
    auth.jwt() ->> 'email' as email,
    auth.jwt() ->> 'role' as jwt_role,
    auth.jwt() -> 'user_metadata' ->> 'role' as user_metadata_role,
    public.get_my_claim('role') as claim_role,
    public.is_admin() as is_admin_function;

-- Verificar role na tabela profiles
SELECT 
    'ROLE NA TABELA PROFILES' as secao,
    id,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE id = auth.uid();

-- TESTE 1: Contar registros em todas as tabelas (deve funcionar para admin)
SELECT 'CONTAGEM DE REGISTROS' as secao;

SELECT 
    'profiles' as tabela,
    count(*) as total
FROM public.profiles
UNION ALL
SELECT 
    'clients' as tabela,
    count(*) as total
FROM public.clients
UNION ALL
SELECT 
    'specialists' as tabela,
    count(*) as total
FROM public.specialists
UNION ALL
SELECT 
    'partners' as tabela,
    count(*) as total
FROM public.partners
UNION ALL
SELECT 
    'admins' as tabela,
    count(*) as total
FROM public.admins;

-- TESTE 2: Query complexa que estava falhando
SELECT 'TESTE DA QUERY ORIGINAL' as secao;

SELECT 
    id, 
    full_name, 
    role, 
    created_at, 
    updated_at
FROM profiles 
LIMIT 5;

-- TESTE 3: Verificar se consegue fazer JOIN com todas as tabelas
SELECT 'TESTE DE JOINS' as secao;

SELECT 
    p.id,
    p.full_name,
    p.role,
    CASE 
        WHEN c.profile_id IS NOT NULL THEN 'HAS_CLIENT_DATA'
        ELSE 'NO_CLIENT_DATA'
    END as client_status,
    CASE 
        WHEN s.profile_id IS NOT NULL THEN 'HAS_SPECIALIST_DATA'
        ELSE 'NO_SPECIALIST_DATA'
    END as specialist_status,
    CASE 
        WHEN pt.profile_id IS NOT NULL THEN 'HAS_PARTNER_DATA'
        ELSE 'NO_PARTNER_DATA'
    END as partner_status,
    CASE 
        WHEN a.profile_id IS NOT NULL THEN 'HAS_ADMIN_DATA'
        ELSE 'NO_ADMIN_DATA'
    END as admin_status
FROM public.profiles p
LEFT JOIN public.clients c ON p.id = c.profile_id
LEFT JOIN public.specialists s ON p.id = s.profile_id
LEFT JOIN public.partners pt ON p.id = pt.profile_id
LEFT JOIN public.admins a ON p.id = a.profile_id
LIMIT 10;

-- TESTE 4: Verificar políticas ativas
SELECT 'POLÍTICAS ATIVAS' as secao;

SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE '%admin%' THEN '🔴 POLÍTICA DE ADMIN'
        WHEN policyname LIKE '%service%' THEN '🟡 POLÍTICA DE SERVICE'
        ELSE '🟢 POLÍTICA NORMAL'
    END as tipo
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'clients', 'specialists', 'partners', 'admins')
ORDER BY tablename, policyname;

-- TESTE 5: Verificar se consegue inserir/atualizar (cuidado - não execute em produção)
-- SELECT 'TESTE DE INSERÇÃO (SIMULADO)' as secao;
-- 
-- -- Simular inserção (só mostra o que seria inserido, não executa)
-- SELECT 
--     'Seria possível inserir em profiles?' as pergunta,
--     CASE 
--         WHEN (SELECT count(*) FROM information_schema.table_privileges 
--               WHERE table_name = 'profiles' AND privilege_type = 'INSERT' 
--               AND grantee IN ('authenticated', 'service_role')) > 0 
--         THEN 'SIM' 
--         ELSE 'NÃO' 
--     END as resposta;

-- ============================================================================
-- RESULTADO ESPERADO PARA ADMIN
-- ============================================================================

-- Se você é ADMIN, deve ver:
-- ✅ is_admin_function = true
-- ✅ Contagens de todas as tabelas (sem erro de permissão)
-- ✅ Query original funcionando
-- ✅ JOINs funcionando
-- ✅ Políticas de admin listadas

-- Se algum teste falhar, execute o script fix-admin-permissions.sql

-- ============================================================================
