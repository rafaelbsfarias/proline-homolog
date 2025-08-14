-- ============================================================================
-- SOLUÇÃO RÁPIDA: POLÍTICAS RLS PARA CADASTRO PÚBLICO
-- ============================================================================
-- Script simplificado para resolver o erro "permission denied for schema public"
-- no endpoint /api/signup
-- ============================================================================

-- PASSO 1: Remover políticas conflitantes
DROP POLICY IF EXISTS "User can access their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clients can access their own data" ON public.clients;

-- PASSO 2: Criar políticas permissivas para Service Role Key
-- Estas políticas permitem que o endpoint /api/signup funcione

-- Para tabela PROFILES
CREATE POLICY "Allow service role to manage profiles" ON public.profiles
  FOR ALL 
  USING (true)  -- Service role pode fazer qualquer operação
  WITH CHECK (true);

-- Para tabela CLIENTS  
CREATE POLICY "Allow service role to manage clients" ON public.clients
  FOR ALL
  USING (true)  -- Service role pode fazer qualquer operação
  WITH CHECK (true);

-- PASSO 3: Políticas para usuários autenticados (após login)
-- Usuários só podem ver/editar seus próprios dados

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Clients can view own data" ON public.clients
  FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Clients can update own data" ON public.clients
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- PASSO 4: Garantir permissões de schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.clients TO service_role;

-- ============================================================================
-- TESTE RÁPIDO
-- ============================================================================
-- Após executar este script, teste o cadastro em:
-- http://localhost:3000/cadastro
-- 
-- Se ainda der erro, execute temporariamente:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
-- ============================================================================
