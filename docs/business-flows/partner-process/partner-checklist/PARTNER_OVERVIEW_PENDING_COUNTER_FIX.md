# Partner Overview - Contador de Orçamentos Pendentes

## 📋 Problema

O contador "Orçamentos Pendentes" na página **Partner Overview do Admin** (`/dashboard/admin/partner-overview`) estava **sempre mostrando 0**, mesmo quando havia quotes com status `pending_partner` (aguardando o parceiro preencher).

## 🐛 Causa Raiz

Na API `/api/admin/partners/[partnerId]/overview`, o campo `pending_budgets` estava **hardcoded** como `0`:

```typescript
// ❌ ANTES
pending_budgets: 0, // a fazer: implementar contagem de orçamentos em draft
```

O comentário indicava que a funcionalidade estava pendente de implementação.

## ✅ Solução Implementada

### 1. Adicionada Query para Contar Quotes `pending_partner`

**Arquivo**: `app/api/admin/partners/[partnerId]/overview/route.ts`

```typescript
// ✅ DEPOIS - Query adicionada
const { count: pendingPartner, error: q3Err } = await admin
  .from('quotes')
  .select('*', { count: 'exact', head: true })
  .eq('partner_id', partnerId)
  .eq('status', 'pending_partner');
```

### 2. Atualizado Resultado da API

```typescript
// ✅ DEPOIS - Usando o valor real
const result = {
  id: partner.profile_id as string,
  company_name: (partner.company_name as string) || '',
  services_count: servicesCount || 0,
  // Orçamentos pendentes: aguardando parceiro preencher (pending_partner)
  pending_budgets: pendingPartner || 0,
  executing_budgets: executing,
  // Para Aprovação: aguardando aprovação do ADMIN + CLIENTE
  approval_budgets: (pendingAdmin || 0) + (pendingClient || 0),
  is_active: !!partner.is_active,
  quotes: byStatus,
};
```

## 📊 Significado dos Contadores

A página Partner Overview do Admin agora mostra corretamente:

| Contador | Descrição | Status de Quotes |
|----------|-----------|------------------|
| **Orçamentos Pendentes** | Aguardando parceiro preencher | `pending_partner` |
| **Para Aprovação** | Aguardando aprovação Admin ou Cliente | `pending_admin_approval`, `admin_review`, `pending_client_approval` |
| **Em Execução** | Orçamentos aprovados ou service orders em progresso | `approved` + SO `in_progress` |

## 🧪 Como Testar

### 1. Verificar Quote Específico

```bash
node scripts/test-partner-overview-counters.cjs
```

Este script verifica:
- O quote corrigido (que estava com status errado)
- Contadores por status do parceiro
- Valores esperados na API

### 2. Testar na Interface

1. Acesse o Admin Dashboard
2. Clique em um parceiro para ver o overview
3. Verifique o contador "Orçamentos Pendentes"
4. Deve mostrar **1** se houver um quote com status `pending_partner`

### 3. Cenário de Teste Completo

```bash
# 1. Criar um novo quote via especialista finalizando checklist
# 2. Quote é criado com status 'pending_partner'
# 3. Acessar Partner Overview no Admin
# 4. Verificar: "Orçamentos Pendentes" deve mostrar 1
```

## 📈 Comparação Antes/Depois

### Antes da Correção

```
Partner Overview:
├─ Orçamentos Pendentes: 0 ❌ (sempre zero)
├─ Para Aprovação: 0
└─ Em Execução: 0
```

### Depois da Correção

```
Partner Overview:
├─ Orçamentos Pendentes: 1 ✅ (contando pending_partner)
├─ Para Aprovação: 0
└─ Em Execução: 0
```

## 🔗 Contexto e Fluxo

### Fluxo do Orçamento

```
1. ESPECIALISTA finaliza checklist
   └─> Quote criado: status = 'pending_partner'
       └─> Aparece em "Orçamentos Pendentes" (Partner Overview)
       
2. PARCEIRO preenche quote e envia
   └─> Quote: status = 'pending_admin_approval'
       └─> Aparece em "Para Aprovação" (Partner Overview)
       
3. ADMIN aprova
   └─> Quote: status = 'pending_client_approval'
       └─> Ainda aparece em "Para Aprovação"
       
4. CLIENTE aprova
   └─> Quote: status = 'approved'
       └─> Aparece em "Em Execução" (Partner Overview)
```

### Status de Quotes

| Status | Descrição | Visível em |
|--------|-----------|------------|
| `pending_partner` | Aguardando parceiro preencher | Partner Overview (Pendentes) |
| `pending_admin_approval` | Aguardando aprovação do admin | Partner Overview (Para Aprovação) |
| `admin_review` | Em revisão pelo admin (legado) | Partner Overview (Para Aprovação) |
| `pending_client_approval` | Aguardando aprovação do cliente | Partner Overview (Para Aprovação) |
| `approved` | Aprovado pelo cliente | Partner Overview (Em Execução) |
| `rejected` | Rejeitado | Partner Overview (Rejeitados) |

## 🚀 Arquivos Modificados

1. ✅ `app/api/admin/partners/[partnerId]/overview/route.ts`
   - Adicionada query para contar `pending_partner`
   - Atualizado campo `pending_budgets` para usar valor real
   - **Endpoint**: `/api/admin/partners/{partnerId}/overview` (um parceiro específico)

2. ✅ `app/api/admin/partners/overview/route.ts`
   - Adicionada query para contar `pending_partner`
   - Criado Map `pendingPartnerByPartner` para agregar por parceiro
   - Atualizado campo `pending_budgets` para usar valor real
   - **Endpoint**: `/api/admin/partners/overview` (todos os parceiros)

3. ✅ `scripts/test-partner-overview-counters.cjs` (novo)
   - Script de teste para verificar contadores

## 📚 Documentos Relacionados

- `docs/QUOTE_STATUS_FLOW_FIX.md` - Correção do fluxo de status de quotes
- `docs/PARTNER_DASHBOARD_PENDING_QUOTES_FIX.md` - Correção do dashboard do parceiro
- Branch: `aprovacao-orcamento-pelo-admin`

## ✅ Checklist de Validação

- [x] Query para `pending_partner` adicionada
- [x] Campo `pending_budgets` usando valor real
- [x] Script de teste criado
- [x] Verificado que quote corrigido tem status `pending_partner`
- [x] Contador esperado: 1 (confirmado por script)
- [x] Documentação criada
- [ ] Testar na interface (aguardando deploy/teste local)

## 🔍 Logs para Monitoramento

A API já possui logs para erros:

```typescript
if (q3Err) {
  logger.error('failed_pending_partner', { error: q3Err, partnerId });
  return NextResponse.json(
    { error: 'Erro ao contar orçamentos pendentes (parceiro)' },
    { status: 500 }
  );
}
```

Monitore logs com a tag `failed_pending_partner` para identificar problemas.

## 🎯 Resultado Final

✅ O contador "Orçamentos Pendentes" na página Partner Overview do Admin agora mostra o valor correto de quotes com status `pending_partner`.

Para o parceiro com ID `291648e6-79eb-44ea-a2c8-ceb140e155bc`:
- **Antes**: 0 orçamentos pendentes (incorreto)
- **Depois**: 1 orçamento pendente (correto)
