# Fluxo de Aprovação de Orçamentos pelo Cliente

## 📋 Visão Geral

Este documento descreve o fluxo completo de aprovação de orçamentos pelo cliente, incluindo suporte para aprovações parciais feitas pelo administrador.

## 🔄 Fluxo Completo

```
Parceiro → Cria Orçamento → pending_admin_approval
                ↓
Admin → Revisa Orçamento → 3 Opções:
    1. Aprovar Integral → pending_client_approval
    2. Reprovar Integral → rejected
    3. Aprovar Parcial → pending_client_approval
                ↓
Cliente → Dashboard → Vê Card "Orçamentos Pendentes"
                ↓
Cliente → Abre Detalhes → Vê:
    - Valor Total (já ajustado)
    - Itens Aprovados (em verde)
    - Itens Rejeitados (riscados em vermelho)
    - Observação do Admin (se houver)
                ↓
Cliente → Decide:
    ├─ Aprovar → approved
    └─ Rejeitar → rejected
```

## 🎯 Componentes Implementados

### 1. PendingQuotesCard
**Localização:** `modules/client/components/PendingQuotes/PendingQuotesCard.tsx`

**Funcionalidades:**
- Exibe contador de orçamentos pendentes
- Lista orçamentos com status `pending_client_approval`
- Badge "Aprovação Parcial" quando aplicável
- Observações do administrador
- Modal detalhado com tabela de itens
- Botões de Aprovar/Rejeitar

**Props:**
- `onLoadingChange?: (loading: boolean) => void` - Callback para controle de loading

### 2. PendingQuotesCard.css
**Localização:** `modules/client/components/PendingQuotes/PendingQuotesCard.css`

**Destaques:**
- Design responsivo (desktop e mobile)
- Itens rejeitados com fundo vermelho (#fee2e2) e riscados
- Modal overlay com animações suaves
- Estados visuais claros (Aprovado/Rejeitado)

## 🔌 APIs Implementadas

### 1. GET /api/client/quotes/pending
**Arquivo:** `app/api/client/quotes/pending/route.ts`

**Função:** Busca todos os orçamentos pendentes de aprovação do cliente

**Retorna:**
```typescript
{
  quotes: [
    {
      id: string,
      status: 'pending_client_approval',
      total_value: number,
      service_order_id: string,
      created_at: string,
      is_partial_approval: boolean,
      rejected_items: string[],
      rejection_reason?: string,
      admin_reviewed_at?: string
    }
  ]
}
```

**Validações:**
- ✅ Autenticação via `withClientAuth`
- ✅ Verifica propriedade dos veículos
- ✅ Filtra apenas status `pending_client_approval`

### 2. GET /api/client/quotes/[quoteId]/details
**Arquivo:** `app/api/client/quotes/[quoteId]/details/route.ts`

**Função:** Busca detalhes completos de um orçamento específico

**Retorna:**
```typescript
{
  items: [
    {
      id: string,
      description: string,
      quantity: number,
      unit_price: number,
      total_price: number
    }
  ]
}
```

**Validações:**
- ✅ Autenticação via `withClientAuth`
- ✅ Valida propriedade do veículo através de `service_orders` → `vehicles`
- ✅ Retorna todos os itens (incluindo rejeitados)

### 3. POST /api/client/quotes/[quoteId]/approve
**Arquivo:** `app/api/client/quotes/[quoteId]/approve/route.ts`

**Função:** Aprova um orçamento pendente

**Body:** Não requer body

**Ação:**
```typescript
{
  status: 'approved',
  client_approved_at: timestamp,
  client_approved_by: client_id,
  updated_at: timestamp
}
```

**Validações:**
- ✅ Autenticação via `withClientAuth`
- ✅ Status deve ser `pending_client_approval`
- ✅ Valida propriedade do veículo

### 4. POST /api/client/quotes/[quoteId]/reject
**Arquivo:** `app/api/client/quotes/[quoteId]/reject/route.ts`

**Função:** Rejeita um orçamento pendente

**Body:** Não requer body

**Ação:**
```typescript
{
  status: 'rejected',
  client_rejected_at: timestamp,
  client_rejected_by: client_id,
  updated_at: timestamp
}
```

**Validações:**
- ✅ Autenticação via `withClientAuth`
- ✅ Status deve ser `pending_client_approval`
- ✅ Valida propriedade do veículo

## 🗄️ Estrutura do Banco de Dados

### Migration: 20251007050000_add_client_approval_fields.sql

**Campos Adicionados à Tabela `quotes`:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `client_approved_at` | timestamptz | Timestamp de aprovação pelo cliente |
| `client_approved_by` | uuid | ID do cliente que aprovou |
| `client_rejected_at` | timestamptz | Timestamp de rejeição pelo cliente |
| `client_rejected_by` | uuid | ID do cliente que rejeitou |

**Índices Criados:**
- `idx_quotes_client_approved_by` - Performance em queries de aprovação
- `idx_quotes_client_rejected_by` - Performance em queries de rejeição

### Campos de Aprovação Parcial (Migration anterior)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `rejected_items` | jsonb | Array de IDs dos itens rejeitados |
| `rejection_reason` | text | Motivo da rejeição parcial |
| `is_partial_approval` | boolean | Flag de aprovação parcial |
| `admin_reviewed_at` | timestamptz | Timestamp da revisão do admin |
| `admin_reviewed_by` | uuid | ID do admin que revisou |

## 📊 Estados do Orçamento

### Fluxo Completo de Estados

```
draft → pending_admin_approval → pending_client_approval → approved
                ↓                          ↓
            rejected                   rejected
```

### Descrição dos Estados

| Estado | Descrição | Quem Vê |
|--------|-----------|---------|
| `draft` | Orçamento em rascunho | Parceiro |
| `pending_admin_approval` | Aguardando revisão do admin | Admin |
| `admin_review` | Em revisão pelo admin | Admin |
| `pending_client_approval` | Aguardando aprovação do cliente | Cliente |
| `approved` | Aprovado pelo cliente | Todos |
| `rejected` | Rejeitado (admin ou cliente) | Todos |

## 🎨 Interface do Cliente

### Card de Orçamentos Pendentes

**Elementos:**
- Header com título e contador (badge azul)
- Lista de orçamentos:
  - OS number
  - Valor total (em verde)
  - Data de envio
  - Badge "Aprovação Parcial" (amarelo)
  - Observação do admin (banner vermelho)
  - Botão "Ver Detalhes"

### Modal de Detalhes

**Seções:**

1. **Informações do Orçamento**
   - ID do orçamento
   - Número da OS
   - Valor total ajustado
   - Banner de aprovação parcial (se aplicável)
   - Observação do administrador

2. **Tabela de Itens**
   - Descrição
   - Quantidade
   - Valor unitário
   - Total
   - Status (Aprovado/Rejeitado)

3. **Ações**
   - Botão "Rejeitar Orçamento" (vermelho)
   - Botão "Aprovar Orçamento" (verde)

### Indicadores Visuais

**Itens Aprovados:**
- Fundo normal
- Tag verde "Aprovado"

**Itens Rejeitados:**
- Fundo vermelho claro (#fee2e2)
- Texto riscado (line-through)
- Tag vermelha "Rejeitado"
- Opacidade 0.7

## 🔒 Segurança

### Validações Implementadas

1. **Autenticação:**
   - Todas as rotas usam `withClientAuth`
   - Token Bearer obrigatório
   - Sessão válida do Supabase

2. **Autorização:**
   - Verifica propriedade do veículo:
     ```
     quote → service_order → vehicle → client_id
     ```
   - Cliente só acessa seus próprios orçamentos

3. **Estado Válido:**
   - Apenas orçamentos com status `pending_client_approval`
   - Validação antes de aprovar/rejeitar

4. **Logging:**
   - Todas as operações são registradas
   - Erros e acessos não autorizados logados

## 📱 Responsividade

### Desktop (> 768px)
- Layout em 2 colunas
- Tabela completa com todas as colunas
- Botões lado a lado

### Mobile (≤ 768px)
- Layout empilhado
- Tabela com scroll horizontal
- Botões empilhados (largura total)
- Card de orçamento em coluna

## 🚀 Integração no Dashboard

### ClientDashboard.tsx

**Ordem dos Componentes:**
1. VehicleCounter (contagem de veículos)
2. **PendingQuotesCard** ← NOVO
3. VehicleCollectionSection (veículos em coleta)

**Loading State:**
```typescript
const [pendingQuotesLoading, setPendingQuotesLoading] = useState(true);

const isComponentLoading = 
  vehicleCounterLoading || 
  collectionSectionLoading || 
  pendingQuotesLoading;
```

## 🧪 Testes Sugeridos

### Cenário 1: Aprovação Integral
1. Admin aprova orçamento integralmente
2. Cliente vê orçamento no dashboard
3. Cliente abre detalhes
4. Todos os itens aparecem como "Aprovado"
5. Cliente clica em "Aprovar Orçamento"
6. Status muda para `approved`

### Cenário 2: Aprovação Parcial
1. Admin aprova parcialmente (rejeita alguns itens)
2. Cliente vê badge "Aprovação Parcial"
3. Cliente vê observação do admin
4. Itens rejeitados aparecem riscados
5. Valor total está ajustado (sem itens rejeitados)
6. Cliente pode aprovar ou rejeitar

### Cenário 3: Rejeição pelo Cliente
1. Cliente abre orçamento pendente
2. Cliente clica em "Rejeitar Orçamento"
3. Status muda para `rejected`
4. Orçamento desaparece da lista

### Cenário 4: Segurança
1. Cliente A tenta acessar orçamento do Cliente B
2. API retorna erro 403 (Acesso negado)
3. Logging registra tentativa não autorizada

## 📝 Logs

### Estrutura de Logging

```typescript
logger.info('quotes_fetched', { count: 5 });
logger.info('quote_details_fetched', { quoteId, itemsCount: 10 });
logger.info('quote_approved_by_client', { quoteId, clientId });
logger.info('quote_rejected_by_client', { quoteId, clientId });
logger.warn('unauthorized_access_attempt', { quoteId, clientId });
logger.error('failed_fetch_quotes', { error });
```

## 🔄 Próximos Passos

### Melhorias Futuras

1. **Notificações:**
   - Email/SMS quando orçamento aprovado pelo admin
   - Confirmação de aprovação/rejeição

2. **Histórico:**
   - Timeline de mudanças de status
   - Registro de quem aprovou/rejeitou e quando

3. **Comentários:**
   - Cliente pode adicionar observações ao rejeitar
   - Comunicação bidirecional admin-cliente

4. **Relatórios:**
   - Dashboard de orçamentos aprovados/rejeitados
   - Tempo médio de aprovação

5. **Refinamentos:**
   - Toast notifications em vez de alerts
   - Animações de loading
   - Paginação se muitos orçamentos

## ✅ Checklist de Implementação

- [x] Componente PendingQuotesCard criado
- [x] CSS responsivo implementado
- [x] API GET /api/client/quotes/pending
- [x] API GET /api/client/quotes/[quoteId]/details
- [x] API POST /api/client/quotes/[quoteId]/approve
- [x] API POST /api/client/quotes/[quoteId]/reject
- [x] Migration com campos de aprovação do cliente
- [x] Integração no ClientDashboard
- [x] Validações de segurança
- [x] Logging de operações
- [x] Correção de erro de hidratação
- [x] Suporte para aprovações parciais
- [x] Indicadores visuais para itens rejeitados
- [x] Responsividade mobile
- [x] Commit e documentação

## 📚 Referências

- [Documentação Next.js 15](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**Data de Criação:** 07/10/2025  
**Última Atualização:** 07/10/2025  
**Versão:** 1.0.0  
**Branch:** `aprovacao-orcamento-pelo-admin`
