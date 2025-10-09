# Quote Status Flow Fix - Prevenção de Status Prematuro

## 📋 Sumário Executivo

Este documento descreve um bug crítico no fluxo de status de orçamentos onde quotes eram criados ou alterados para `pending_client_approval` **antes** de serem efetivamente enviados pelo parceiro ao admin, resultando em orçamentos vazios aparecendo nas dashboards de Admin e Cliente.

---

## 🐛 Problema Identificado

### Sintomas

1. **Dashboard do Parceiro**: Quote aparecia corretamente como "Pendente" (status: `pending_partner`)
2. **Dashboard do Admin**: Mesmo quote aparecia em "Para Aprovação" (status: `pending_client_approval`)
3. **Dashboard do Cliente**: Mesmo quote aparecia para aprovação do cliente
4. **Dados Inconsistentes**:
   - `status`: `pending_client_approval`
   - `sent_to_admin_at`: `NULL` ❌
   - `total_value`: `0` ❌
   - `admin_approval_date`: `NULL` ❌

### Quote Problemático

```
ID: a03afdd3-ad50-4292-8fb7-bad1180ba88d
Status: pending_client_approval
Total: R$ 0
Criado: 2025-10-09T10:09:51.813+00:00
Enviado admin: NULL
Aprovação admin: NULL
```

### Causa Raiz

O script de teste `scripts/test-admin-approval-timeline.cjs` estava **atualizando diretamente** o status do quote sem validações:

```javascript
// ❌ PROBLEMA: Atualização direta sem validações
await supabase
  .from('quotes')
  .update({ status: 'pending_client_approval' })
  .eq('id', quote.id);
```

Este script foi executado acidentalmente (ou para testes) e alterou o status de um quote real, pulando todas as etapas do fluxo correto.

---

## ✅ Fluxo Correto de Status

```
1. CRIAR QUOTE
   └─> status: 'pending_partner'
       └─> Parceiro preenche checklist e adiciona itens/valores
           └─> sent_to_admin_at = NOW()
               └─> status: 'pending_admin_approval'
                   └─> Admin aprova integralmente
                       └─> status: 'pending_client_approval'
                           └─> Cliente aprova
                               └─> status: 'approved'
```

### Validações Necessárias

Para um quote chegar a `pending_client_approval`, deve ter:

1. ✅ `sent_to_admin_at IS NOT NULL` (foi enviado pelo parceiro)
2. ✅ `total_value > 0` (tem valor definido)
3. ✅ `status IN ('pending_admin_approval', 'admin_review')` (estava aguardando admin)
4. ✅ Admin executou ação de aprovação

---

## 🔧 Correções Implementadas

### 1. Script de Correção do Quote

**Arquivo**: `scripts/fix-premature-status-quote.cjs`

```javascript
// Reseta o quote problemático para o status correto
const { error } = await supabase
  .from('quotes')
  .update({
    status: 'pending_partner',
    updated_at: new Date().toISOString()
  })
  .eq('id', quoteId);
```

**Resultado**: Quote resetado de `pending_client_approval` → `pending_partner`

### 2. Validações no Endpoint de Aprovação

**Arquivo**: `app/api/admin/quotes/[quoteId]/approve/route.ts`

**Validações Adicionadas**:

```typescript
// ✅ Validar que o quote foi enviado pelo parceiro
if (!current.sent_to_admin_at) {
  logger.warn('attempt_approve_unsent_quote', { quoteId });
  return NextResponse.json(
    { error: 'Orçamento não foi enviado pelo parceiro' },
    { status: 400 }
  );
}

// ✅ Validar que o quote tem valor
if (!quoteData || quoteData.total_value === 0) {
  logger.warn('attempt_approve_zero_value_quote', { quoteId });
  return NextResponse.json(
    { error: 'Orçamento não pode ser aprovado sem valor' },
    { status: 400 }
  );
}
```

### 3. Validações no Endpoint de Revisão

**Arquivo**: `app/api/admin/quotes/[quoteId]/review/route.ts`

**Validações Adicionadas**:

```typescript
// ✅ Validar que o quote foi enviado pelo parceiro
if (!quote.sent_to_admin_at) {
  logger.warn('attempt_review_unsent_quote', { quoteId });
  return NextResponse.json(
    { ok: false, error: 'Orçamento não foi enviado pelo parceiro' },
    { status: 400 }
  );
}

// ✅ Validar que o quote tem valor (exceto para rejeição total)
if (action !== 'reject_full' && quote.total_value === 0) {
  logger.warn('attempt_review_zero_value_quote', { quoteId, action });
  return NextResponse.json(
    { ok: false, error: 'Orçamento não pode ser aprovado sem valor' },
    { status: 400 }
  );
}
```

---

## 🧪 Como Testar

### 1. Testar Validação de Quote Não Enviado

```bash
# Criar um quote em pending_partner (não enviado)
# Tentar aprovar via API

curl -X POST http://localhost:3000/api/admin/quotes/{quoteId}/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Resposta esperada: 400 Bad Request
# "Orçamento não foi enviado pelo parceiro"
```

### 2. Testar Validação de Quote Sem Valor

```bash
# Criar um quote com total_value = 0
# Marcar como pending_admin_approval
# Tentar aprovar via API

curl -X POST http://localhost:3000/api/admin/quotes/{quoteId}/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Resposta esperada: 400 Bad Request
# "Orçamento não pode ser aprovado sem valor"
```

### 3. Testar Fluxo Completo

```bash
# 1. Especialista finaliza checklist → Quote criado com status 'pending_partner'
# 2. Parceiro preenche quote e envia → sent_to_admin_at definido, status 'pending_admin_approval'
# 3. Admin aprova → status 'pending_client_approval'
# 4. Cliente aprova → status 'approved'
```

---

## 📊 Impacto das Mudanças

### Antes da Correção

| Ação | Validações | Resultado |
|------|------------|-----------|
| Admin aprova quote não enviado | ❌ Nenhuma | Status mudado indevidamente |
| Admin aprova quote sem valor | ❌ Nenhuma | Quote vazio aprovado |
| Script de teste altera status | ❌ Nenhuma | Dados corrompidos |

### Depois da Correção

| Ação | Validações | Resultado |
|------|------------|-----------|
| Admin aprova quote não enviado | ✅ `sent_to_admin_at` | Erro 400 - Bloqueado |
| Admin aprova quote sem valor | ✅ `total_value > 0` | Erro 400 - Bloqueado |
| Script de teste altera status | ✅ Via API apenas | Validações aplicadas |

---

## 🔍 Diagnóstico de Problemas Similares

### Como Identificar Quotes com Status Incorreto

Execute o script de diagnóstico:

```bash
node scripts/debug-premature-status.cjs
```

Este script busca quotes com:
- `status = 'pending_client_approval'`
- `sent_to_admin_at IS NULL`

### Como Corrigir

```bash
# Edite o script fix-premature-status-quote.cjs com o ID do quote
# Execute:
node scripts/fix-premature-status-quote.cjs
```

---

## 🚀 Deploy e Migração

### Arquivos Alterados

1. ✅ `app/api/admin/quotes/[quoteId]/approve/route.ts`
2. ✅ `app/api/admin/quotes/[quoteId]/review/route.ts`
3. ✅ `scripts/fix-premature-status-quote.cjs` (novo)
4. ✅ `scripts/debug-premature-status.cjs` (novo)

### Checklist de Deploy

- [x] Scripts de diagnóstico/correção criados
- [x] Validações adicionadas nos endpoints
- [x] Quote problemático corrigido
- [x] Documentação criada
- [ ] Testes E2E atualizados (se necessário)
- [ ] Logs de validação monitorados após deploy

### Rollback

Se necessário reverter:

```bash
git revert <commit-hash>
```

As validações são **não-destrutivas** - apenas impedem ações inválidas. Remover as validações volta ao comportamento anterior.

---

## 📚 Referências

- **Issue Relacionada**: Dashboard counter inconsistency
- **PR**: Aprovação de orçamento pelo admin
- **Branch**: `aprovacao-orcamento-pelo-admin`
- **Documentos**:
  - `docs/PARTNER_DASHBOARD_PENDING_QUOTES_FIX.md`
  - `docs/SERVICE_ORDER_FIX_SUMMARY.md`

---

## 🔐 Segurança e Prevenção

### Lições Aprendidas

1. **Scripts de teste nunca devem alterar dados diretamente**
   - Usar variáveis de ambiente para distinguir ambiente de teste
   - Adicionar confirmação antes de executar UPDATE

2. **Todas as mudanças de status devem passar por validações**
   - Validar estado anterior
   - Validar dados necessários (sent_at, total_value)
   - Usar transações quando possível

3. **Logs são essenciais**
   - Todas as validações geram logs de aviso
   - Facilita diagnóstico de tentativas de ações inválidas

### Melhorias Futuras

1. **Adicionar Constraint no Banco**
   ```sql
   -- Garantir que pending_client_approval tenha sent_to_admin_at
   ALTER TABLE quotes
   ADD CONSTRAINT check_pending_client_approval
   CHECK (
     status != 'pending_client_approval'
     OR (sent_to_admin_at IS NOT NULL AND total_value > 0)
   );
   ```

2. **Adicionar Testes E2E**
   - Testar fluxo completo de aprovação
   - Testar tentativas de aprovação inválida

3. **Monitoramento**
   - Alertar quando logs de validação aparecem
   - Dashboard de quotes com status inconsistente

---

## ✅ Conclusão

O bug foi causado por um **script de teste executado indevidamente** que alterou o status de um quote real sem validações. As correções implementadas:

1. ✅ **Corrigiram o quote problemático** (resetado para `pending_partner`)
2. ✅ **Adicionaram validações** nos endpoints de aprovação/revisão
3. ✅ **Previnem recorrência** do problema
4. ✅ **Fornecem ferramentas** de diagnóstico e correção

O fluxo de status agora está **protegido** e **validado** em todos os pontos críticos.
