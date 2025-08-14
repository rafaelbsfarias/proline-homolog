-- ============================================================================
-- SCRIPT DE TESTE E VALIDAÇÃO DAS POLÍTICAS RLS
-- ============================================================================
-- Execute este script após aplicar as correções de RLS
-- ============================================================================

-- TESTE 1: Verificar se as tabelas têm RLS ativado
SELECT 
    schemaname,
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ATIVADO ✅' 
        ELSE 'RLS DESATIVADO ❌' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'clients', 'vehicles', 'addresses')
ORDER BY tablename;

-- TESTE 2: Listar políticas ativas
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN roles = '{public}' THEN 'PÚBLICO'
        WHEN roles = '{authenticated}' THEN 'AUTENTICADO'
        WHEN roles = '{service_role}' THEN 'SERVICE_ROLE'
        ELSE array_to_string(roles, ', ')
    END as roles_permitidas,
    qual as condicao_using,
    with_check as condicao_with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'clients')
ORDER BY tablename, policyname;

-- TESTE 3: Verificar ENUMs definidos
SELECT 
    t.typname as enum_name,
    e.enumlabel as valores_permitidos
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- TESTE 4: Verificar permissões da service_role
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE grantee = 'service_role' 
AND table_schema = 'public'
AND table_name IN ('profiles', 'clients')
ORDER BY table_name, privilege_type;

-- TESTE 5: Simular inserção (apenas para verificar estrutura)
-- CUIDADO: Este teste não vai inserir dados reais, apenas validar a estrutura

-- Mostrar colunas esperadas na tabela profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Mostrar colunas esperadas na tabela clients  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- ============================================================================
-- COMANDOS ÚTEIS PARA DEBUGGING
-- ============================================================================

-- Para ver todas as políticas de uma tabela:
-- \d+ public.profiles

-- Para ver detalhes de uma política específica:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Para temporariamente desativar RLS (APENAS EM DESENVOLVIMENTO):
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- Para reativar RLS:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

-- Após executar as correções, você deve ver:
-- ✅ RLS ativado nas tabelas principais
-- ✅ Políticas que permitem service_role inserir dados
-- ✅ Políticas que permitem usuários ver apenas seus próprios dados
-- ✅ Enum 'client' (singular) disponível para user_role
-- ✅ Permissões adequadas para service_role

-- ============================================================================
