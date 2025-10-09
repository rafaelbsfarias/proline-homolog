# Correção das Políticas RLS da Tabela quote_items

## 🐛 Problema Identificado

A página de evidências de execução (`/dashboard/partner/execution-evidence`) estava carregando corretamente, mas não exibia a lista de serviços, resultando na mensagem "Nenhum serviço encontrado neste orçamento".

## 🔍 Análise da Causa Raiz

### Histórico das Migrations

1. **Migration `20250925171227_create_quote_items_table.sql`**
   - Criou a tabela `quote_items` com o campo `budget_id`
   - Criou políticas RLS usando `budget_id`:
   ```sql
   CREATE POLICY "Partners can manage quote_items for their quotes"
   ON public.quote_items
   USING (auth.uid() = (SELECT partner_id FROM quotes WHERE id = quote_items.budget_id))
   ```

2. **Migration `20250925171228_standardize_quote_items_to_quote_id_and_description.sql`**
   - Renomeou `budget_id` para `quote_id`
   - Migrou todos os dados
   - Removeu a coluna `budget_id`
   - **⚠️ MAS NÃO ATUALIZOU AS POLÍTICAS RLS!**

### Resultado

As políticas RLS continuavam referenciando `quote_items.budget_id`, que não existia mais, causando falha silenciosa nas queries. O banco retornava array vazio mesmo com dados válidos.

## ✅ Solução Implementada

**Migration: `20251009150915_fix_quote_items_rls_policies.sql`**

### Mudanças Realizadas

1. **Removeu políticas antigas**
   ```sql
   DROP POLICY IF EXISTS "Staff can manage all quote_items" ON public.quote_items;
   DROP POLICY IF EXISTS "Partners can manage quote_items for their quotes" ON public.quote_items;
   ```

2. **Recriou políticas com `quote_id`**
   ```sql
   CREATE POLICY "Partners can manage quote_items for their quotes"
   ON public.quote_items
   USING (auth.uid() = (SELECT partner_id FROM quotes WHERE id = quote_items.quote_id))
   WITH CHECK (auth.uid() = (SELECT partner_id FROM quotes WHERE id = quote_items.quote_id));
   ```

3. **Adicionou política para clientes**
   ```sql
   CREATE POLICY "Clients can view quote_items from their quotes"
   ON public.quote_items
   FOR SELECT
   USING (
     auth.uid() IN (
       SELECT so.client_id 
       FROM quotes q
       JOIN service_orders so ON q.service_order_id = so.id
       WHERE q.id = quote_items.quote_id
     )
   );
   ```

### Políticas RLS Finais

| Política | Usuários | Operações | Condição |
|----------|----------|-----------|----------|
| Staff can manage all quote_items | admin, specialist | ALL | Baseado em role |
| Partners can manage quote_items for their quotes | partner | ALL | Baseado em partner_id do quote |
| Clients can view quote_items from their quotes | client | SELECT | Baseado em client_id do service_order |

## 📊 Validação

### Antes da Correção
```typescript
// Query retornava array vazio devido a RLS incorreto
const { data: items } = await supabase
  .from('quote_items')
  .select('*')
  .eq('quote_id', quoteId);

console.log(items); // []
```

### Após a Correção
```bash
$ node scripts/debug-quote-items.cjs

📊 Quotes aprovados encontrados: 2

Quote ID: 9c95b7de-d3a1-42d2-aaca-783b04319870
📋 Itens encontrados: 3
  1. Remoção de riscos
  2. Polimento e cristalização
  3. Pintura parcial

Quote ID: a03afdd3-ad50-4292-8fb7-bad1180ba88d
📋 Itens encontrados: 5
  1. Instalação de acessórios elétricos
  2. Reparo de alternador
  3. Reparo de bateria
  4. Manutenção de diferencial
  5. Troca de fluido de transmissão
```

## 🔧 Como Aplicar

```bash
# Aplicar a migration
npx supabase migration up

# Verificar políticas aplicadas
npx supabase db inspect
```

## 🎯 Impacto

### Funcionalidades Corrigidas

✅ **Página de Evidências de Execução**
- Agora carrega corretamente a lista de serviços
- Partners podem visualizar todos os serviços do orçamento
- Upload de evidências funcionando

✅ **Dashboard do Partner**
- Lista de orçamentos com itens visíveis
- Botão de evidências acessível

✅ **Dashboard do Cliente**
- Clientes podem visualizar os itens de seus orçamentos (apenas leitura)

## 📝 Lições Aprendidas

1. **Sempre atualizar políticas RLS junto com mudanças de schema**
   - Renomear colunas requer atualização das políticas
   - Testar acesso após migrations estruturais

2. **RLS pode falhar silenciosamente**
   - Queries retornam array vazio em vez de erro
   - Implementar logs e debug para detectar

3. **Validação pós-migration**
   - Criar scripts de teste para validar dados
   - Verificar políticas RLS com diferentes roles

4. **Documentação de dependências**
   - Documentar relacionamentos entre tabelas
   - Mapear políticas RLS e suas dependências

## 🔗 Arquivos Relacionados

- Migration: `supabase/migrations/20251009150915_fix_quote_items_rls_policies.sql`
- Script de Debug: `scripts/debug-quote-items.cjs`
- Página Afetada: `app/dashboard/partner/execution-evidence/page.tsx`
- Documentação: `docs/EXECUTION_EVIDENCE_FEATURE.md`

## ✨ Status

- [x] Problema identificado
- [x] Migration criada
- [x] Migration aplicada
- [x] Testes validados
- [x] Documentação atualizada
- [ ] Deploy em produção pendente

---

**Data da Correção:** 09/01/2025  
**Migration:** `20251009150915_fix_quote_items_rls_policies.sql`  
**Impacto:** Alto (bloqueava funcionalidade completa de evidências)
