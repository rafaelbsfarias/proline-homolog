# 🔧 Guia: Corrigir Permissões RLS - Signup e Admin

## 📋 Problemas Identificados

### ❌ **PROBLEMA 1: Erro no Cadastro Público**
- **Erro**: `"permission denied for schema public"` no signup
- **Status**: ✅ **RESOLVIDO**

### ❌ **PROBLEMA 2: Admin Sem Acesso Total** 
- **Erro**: `permission denied for table specialists` (e outras tabelas)
- **Causa**: Políticas RLS bloqueando administradores
- **Status**: 🔧 **SOLUÇÕES CRIADAS**

## 🚀 Soluções por Problema

### **SOLUÇÃO 1: Corrigir Cadastro Público**
```sql
-- Executar: db/quick-fix-rls.sql
-- Status: ✅ JÁ APLICADO
```

### **SOLUÇÃO 2: Dar Acesso Total ao Admin**

#### **Opção A: Políticas Robustas (RECOMENDADO)**
```sql
-- Executar: db/fix-admin-permissions.sql
-- Cria políticas que detectam admin por múltiplas formas
```

#### **Opção B: Bypass Simples (SE OPÇÃO A NÃO FUNCIONAR)**
```sql
-- Executar: db/admin-bypass-rls.sql  
-- Abordagem mais direta
```

#### **Opção C: Desativar RLS Temporariamente (EMERGÊNCIA)**
```sql
-- APENAS PARA DEBUG
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialists DISABLE ROW LEVEL SECURITY;
-- etc...
```

## 🚀 Passos para Resolver

### **PASSO 1: Corrigir Acesso do Admin (PRIORITÁRIO)**

1. **Abra o Supabase Studio**: 
   - Local: http://127.0.0.1:54323
   - Produção: Seu dashboard Supabase

2. **Vá para SQL Editor**

3. **Execute a correção de admin**:
   ```sql
   -- PRIMEIRO: Tente a solução robusta
   -- Copie e cole: db/fix-admin-permissions.sql
   ```

4. **Teste se funcionou**:
   ```sql
   -- Execute: db/test-admin-access.sql
   -- Deve mostrar acessos sem erro
   ```

5. **Se não funcionou, tente o bypass**:
   ```sql
   -- Copie e cole: db/admin-bypass-rls.sql
   ```

### **PASSO 2: Verificar Cadastro Público**

1. **Acesse**: http://localhost:3000/cadastro
2. **Teste** o formulário de cadastro
3. **Se ainda der erro**: Execute `db/quick-fix-rls.sql`

### **PASSO 3: Verificar User Metadata do Admin**

```sql
-- Verificar se admin tem role correto
SELECT 
    email,
    raw_user_meta_data ->> 'role' as role
FROM auth.users 
WHERE raw_user_meta_data ->> 'role' = 'admin';
```

Se não aparecer nenhum usuário admin, você precisa:
1. **Criar usuário admin** no Supabase Auth
2. **Definir role = 'admin'** no user metadata

## 🛠️ Arquivos Criados

| Arquivo | Descrição | Prioridade |
|---------|-----------|------------|
| `db/fix-admin-permissions.sql` | **Correção admin** - Execute PRIMEIRO | 🔴 ALTA |
| `db/admin-bypass-rls.sql` | **Bypass admin** - Se primeira não funcionar | 🟡 MÉDIA |
| `db/test-admin-access.sql` | **Teste admin** - Validar correções | 🟢 BAIXA |
| `db/quick-fix-rls.sql` | **Correção cadastro** - Para signup público | 🟡 MÉDIA |
| `db/test-rls-policies.sql` | **Validação geral** - Verificar políticas | 🟢 BAIXA |

## 🔍 Debugging

### Se ainda der erro:

#### **Opção 1: Desativar RLS temporariamente**
```sql
-- APENAS PARA TESTE - NÃO USAR EM PRODUÇÃO
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- Teste o cadastro
-- Depois reative:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
```

#### **Opção 2: Verificar Service Role Key**
```bash
# Verifique se a variável está correta:
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### **Opção 3: Logs do Supabase**
- Verifique os logs no Dashboard para ver exatamente qual política está bloqueando

## ✅ Resultado Esperado

Após aplicar as correções:

```json
{
  "message": "Cadastro realizado com sucesso! Seu cadastro será analisado e aprovado pela equipe ProLine."
}
```

## 🔒 Segurança

As políticas criadas mantêm a segurança:

- ✅ **Service Role** pode criar usuários (necessário para signup)
- ✅ **Usuários autenticados** só veem seus próprios dados  
- ✅ **Usuários não autenticados** não podem acessar dados existentes
- ✅ **Admins** têm acesso completo (via políticas separadas)

## 📞 Suporte

Se o problema persistir:

1. **Execute** `db/test-rls-policies.sql` 
2. **Compartilhe** o resultado
3. **Verifique** logs do Supabase Dashboard
4. **Teste** com RLS desabilitado (temporariamente)

---

**💡 Dica**: Mantenha backup das políticas antigas antes de aplicar as novas!
