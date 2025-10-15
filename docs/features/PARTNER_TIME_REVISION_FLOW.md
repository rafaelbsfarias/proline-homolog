# Fluxo de Revisão de Prazos - Parceiro

## 📋 Visão Geral

Documento de planejamento para implementar a funcionalidade que permite ao **Parceiro** visualizar solicitações de revisão de prazos feitas pelo **Especialista** e atualizar os prazos do orçamento.

---

## 🔄 Fluxo Completo

```mermaid
sequenceDiagram
    participant P as Parceiro
    participant S as Sistema
    participant E as Especialista
    participant DB as Database
    
    Note over P,DB: 1. Especialista solicita revisão
    E->>S: POST /api/specialist/quotes/{id}/review-times
    S->>DB: INSERT quote_time_reviews (action='revision_requested')
    S->>DB: UPDATE quotes SET status='specialist_time_revision_requested'
    
    Note over P,DB: 2. Parceiro recebe notificação
    P->>S: GET /api/partner/quotes/pending-time-revisions
    S->>DB: SELECT quotes WHERE status='specialist_time_revision_requested'
    S-->>P: Lista de orçamentos com revisão solicitada
    
    Note over P,DB: 3. Parceiro visualiza detalhes
    P->>S: GET /api/partner/quotes/{id}/time-reviews
    S->>DB: SELECT quote_time_reviews WHERE quote_id={id}
    S-->>P: Comentários e sugestões do especialista
    
    Note over P,DB: 4. Parceiro atualiza prazos
    P->>S: PUT /api/partner/quotes/{id}/update-times
    S->>DB: UPDATE quote_items SET estimated_days
    S->>DB: UPDATE quotes SET status='admin_review'
    S->>DB: INSERT quote_time_reviews (action='partner_updated')
    
    Note over P,DB: 5. Volta para aprovação do Admin
    S-->>P: Sucesso - Orçamento reenviado para admin
```

---

## 📊 Estados do Orçamento

### Estados Relevantes para o Fluxo

| Status | Descrição | Quem Pode Agir |
|--------|-----------|----------------|
| `approved` | Aprovado pelo admin, aguardando aprovação de prazo do especialista | Especialista |
| `specialist_time_revision_requested` | Especialista solicitou revisão dos prazos | Parceiro |
| `admin_review` | Reenviado para revisão do admin após ajuste | Admin |
| `specialist_time_approved` | Prazos aprovados pelo especialista (fluxo completo) | - |

---

## 🎨 Interface do Parceiro

### 1. Dashboard - Contador de Revisões Pendentes

**Componente**: `PartnerTimeRevisionsCounter.tsx`

```tsx
// Localização: /modules/partner/components/PartnerTimeRevisionsCounter.tsx

interface Props {
  onClick: () => void;
}

// Features:
// - Badge com número de revisões pendentes
// - Cor de alerta (vermelho/amarelo)
// - Click navega para /dashboard/partner/time-revisions
// - Auto-refresh a cada 30 segundos
```

**Visual**:
```
┌─────────────────────────────────────┐
│  Dashboard do Parceiro              │
├─────────────────────────────────────┤
│                                     │
│  📋 Orçamentos Pendentes: 5         │
│  ⏱️  Revisões de Prazo: 2 🔴        │  ← NOVO
│  ✅ Aprovados: 12                   │
│                                     │
└─────────────────────────────────────┘
```

---

### 2. Página de Lista de Revisões

**Rota**: `/dashboard/partner/time-revisions`

**Componente**: `PartnerTimeRevisionsPage.tsx`

```tsx
// Localização: /app/dashboard/partner/time-revisions/page.tsx

// Features:
// - Lista de orçamentos com revisão solicitada
// - Filtros: Data, Cliente, Status
// - Ordenação: Mais antigo primeiro
// - Cards com informações principais
```

**Visual**:
```
┌────────────────────────────────────────────────────────┐
│  ← Voltar                                              │
│                                                        │
│  Revisões de Prazo Solicitadas                        │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🚗 ABC-1234 | Cliente Teste                  │    │
│  │ Orçamento #12345                              │    │
│  │                                                │    │
│  │ 📝 Solicitado por: Especialista João         │    │
│  │ 📅 Data: 15/10/2025 14:30                    │    │
│  │ ⏱️  Itens com revisão: 3                      │    │
│  │                                                │    │
│  │ [Ver Detalhes e Revisar Prazos]              │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🚗 XYZ-5678 | Cliente ABC Ltda               │    │
│  │ ...                                            │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 3. Página de Revisão de Prazos

**Rota**: `/dashboard/partner/time-revisions/[quoteId]`

**Componente**: `PartnerTimeRevisionDetailPage.tsx`

**Layout em 3 Seções**:

#### Seção 1: Informações do Orçamento
```
┌────────────────────────────────────────────────┐
│  Informações do Orçamento                      │
├────────────────────────────────────────────────┤
│  Cliente: Cliente Teste 12345                  │
│  Veículo: Toyota Corolla - ABC-1234            │
│  Orçamento: #12345                             │
│  Data de Envio: 10/10/2025                     │
└────────────────────────────────────────────────┘
```

#### Seção 2: Solicitação do Especialista
```
┌────────────────────────────────────────────────┐
│  Solicitação de Revisão                        │
├────────────────────────────────────────────────┤
│  👤 Especialista: João Silva                   │
│  📅 Data: 15/10/2025 às 14:30                 │
│                                                │
│  💬 Comentário Geral:                          │
│  "Os prazos estão muito curtos para a         │
│   complexidade dos serviços solicitados."     │
│                                                │
└────────────────────────────────────────────────┘
```

#### Seção 3: Itens do Orçamento (Editável)
```
┌────────────────────────────────────────────────────────────────┐
│  Itens do Orçamento - Edição de Prazos                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 1. Troca de óleo e filtros                           │    │
│  │                                                        │    │
│  │ Prazo Atual: [5] dias                                │    │
│  │                                                        │    │
│  │ 💡 Sugestão do Especialista: 7 dias                  │    │
│  │ 📝 Motivo: "Considerar tempo de espera de peças"     │    │
│  │                                                        │    │
│  │ Novo Prazo: [7] dias  [Aplicar Sugestão]            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 2. Reparo de suspensão                                │    │
│  │                                                        │    │
│  │ Prazo Atual: [10] dias                               │    │
│  │                                                        │    │
│  │ 💡 Sugestão do Especialista: 15 dias                 │    │
│  │ 📝 Motivo: "Serviço complexo, pode haver imprevistos"│    │
│  │                                                        │    │
│  │ Novo Prazo: [10] dias  [Aplicar Sugestão]           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  💬 Comentário da Revisão (opcional):                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Explique as alterações feitas...                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  [Cancelar]  [Salvar e Reenviar para Admin]                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔌 APIs Necessárias

### 1. ✅ APIs já Criadas

#### `GET /api/partner/quotes/[quoteId]/time-reviews`
**Status**: ✅ Criada
**Função**: Buscar histórico de revisões de prazo de um orçamento

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "quote_id": "uuid",
      "specialist_id": "uuid",
      "action": "revision_requested",
      "comments": "Os prazos estão muito curtos...",
      "revision_requests": {
        "item-uuid-1": {
          "suggested_days": 7,
          "reason": "Considerar tempo de espera de peças"
        },
        "item-uuid-2": {
          "suggested_days": 15,
          "reason": "Serviço complexo"
        }
      },
      "created_at": "2025-10-15T14:30:00Z",
      "specialist": {
        "full_name": "João Silva"
      }
    }
  ]
}
```

#### `PUT /api/partner/quotes/[quoteId]/update-times`
**Status**: ✅ Criada
**Função**: Atualizar prazos dos itens do orçamento

**Request**:
```json
{
  "items": [
    {
      "item_id": "uuid",
      "estimated_days": 7
    },
    {
      "item_id": "uuid",
      "estimated_days": 15
    }
  ],
  "comments": "Prazos ajustados conforme sugerido"
}
```

---

### 2. 🆕 APIs a Criar

#### `GET /api/partner/quotes/pending-time-revisions`
**Status**: 🆕 A criar
**Função**: Listar orçamentos com revisão de prazo solicitada

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "quote_id": "uuid",
      "client_name": "Cliente Teste",
      "vehicle_plate": "ABC-1234",
      "vehicle_model": "Toyota Corolla",
      "requested_at": "2025-10-15T14:30:00Z",
      "specialist_name": "João Silva",
      "items_count": 5,
      "revision_items_count": 3
    }
  ]
}
```

**Query SQL**:
```sql
SELECT 
  q.id as quote_id,
  p.full_name as client_name,
  v.plate as vehicle_plate,
  v.model as vehicle_model,
  qtr.created_at as requested_at,
  sp.full_name as specialist_name,
  COUNT(qi.id) as items_count,
  jsonb_object_keys(qtr.revision_requests) as revision_items_count
FROM quotes q
JOIN service_orders so ON q.service_order_id = so.id
JOIN vehicles v ON so.vehicle_id = v.id
JOIN clients c ON v.client_id = c.profile_id
JOIN profiles p ON c.profile_id = p.id
JOIN quote_time_reviews qtr ON qtr.quote_id = q.id
JOIN profiles sp ON qtr.specialist_id = sp.id
LEFT JOIN quote_items qi ON qi.quote_id = q.id
WHERE q.status = 'specialist_time_revision_requested'
  AND q.partner_id = $1
  AND qtr.action = 'revision_requested'
GROUP BY q.id, p.full_name, v.plate, v.model, qtr.created_at, sp.full_name
ORDER BY qtr.created_at ASC;
```

#### `GET /api/partner/quotes/pending-time-revisions/count`
**Status**: 🆕 A criar
**Função**: Contar orçamentos com revisão pendente (para o contador no dashboard)

**Response**:
```json
{
  "success": true,
  "count": 3
}
```

---

## 🗄️ Estrutura de Dados

### Tabela: `quote_time_reviews` (já criada)

```sql
CREATE TABLE quote_time_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'revision_requested', 'partner_updated')),
  comments TEXT,
  reviewed_item_ids UUID[],
  revision_requests JSONB, -- { "item_id": { "suggested_days": 7, "reason": "..." } }
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);
```

**Novo action**: `partner_updated`
- Será usado quando o parceiro atualizar os prazos após revisão

---

## 📝 Modelo de Dados: `revision_requests`

### Estrutura JSONB

```typescript
interface RevisionRequests {
  [itemId: string]: {
    suggested_days: number;
    reason: string;
  };
}

// Exemplo:
const revisionRequests: RevisionRequests = {
  "550e8400-e29b-41d4-a716-446655440000": {
    suggested_days: 7,
    reason: "Considerar tempo de espera de peças"
  },
  "6ba7b810-9dad-11d1-80b4-00c04fd430c8": {
    suggested_days: 15,
    reason: "Serviço complexo, pode haver imprevistos"
  }
};
```

---

## 🔔 Sistema de Notificações (Futuro)

### Estratégias de Notificação

1. **In-App (Prioridade Alta - Implementar Agora)**
   - Contador no dashboard
   - Badge vermelho quando há revisões pendentes
   - Lista de notificações (futuro)

2. **Email (Prioridade Média)**
   - Enviar email quando especialista solicita revisão
   - Template: "Revisão de Prazo Solicitada - Orçamento #12345"

3. **Push Notifications (Prioridade Baixa)**
   - Notificações no navegador
   - Requer service worker

### Implementação Inicial (MVP)

```typescript
// Apenas contador visual no dashboard
// Sem emails ou push notifications inicialmente
```

---

## 🧪 Casos de Teste

### Cenário 1: Fluxo Completo de Revisão
```gherkin
Dado que um orçamento está aprovado pelo admin
Quando o especialista solicita revisão de prazos
Então o status do orçamento muda para 'specialist_time_revision_requested'
E o parceiro vê o orçamento na lista de revisões pendentes
Quando o parceiro atualiza os prazos
Então o status volta para 'admin_review'
E um novo registro é criado em quote_time_reviews com action='partner_updated'
```

### Cenário 2: Parceiro Aplica Todas as Sugestões
```gherkin
Dado que há 3 itens com revisão solicitada
Quando o parceiro clica em "Aplicar Sugestão" em todos
Então todos os campos são preenchidos com os valores sugeridos
E o parceiro pode ajustar manualmente se necessário
```

### Cenário 3: Parceiro Ignora Sugestões
```gherkin
Dado que há sugestões do especialista
Quando o parceiro mantém os prazos originais
E salva sem alterações
Então o sistema deve alertar "Nenhuma alteração detectada"
E perguntar "Deseja realmente reenviar sem alterações?"
```

---

## 🎯 Checklist de Implementação

### Backend

- [ ] Criar API `GET /api/partner/quotes/pending-time-revisions`
- [ ] Criar API `GET /api/partner/quotes/pending-time-revisions/count`
- [ ] Atualizar API `PUT /api/partner/quotes/[quoteId]/update-times`
  - [ ] Adicionar validação de status
  - [ ] Criar registro com action='partner_updated'
  - [ ] Atualizar status do quote para 'admin_review'
- [ ] Adicionar testes unitários para novas APIs

### Frontend - Componentes

- [ ] Criar `PartnerTimeRevisionsCounter.tsx`
- [ ] Criar página `/app/dashboard/partner/time-revisions/page.tsx`
- [ ] Criar página `/app/dashboard/partner/time-revisions/[quoteId]/page.tsx`
- [ ] Criar componente `TimeRevisionCard.tsx` (card da lista)
- [ ] Criar componente `TimeRevisionItemEditor.tsx` (editor de item)
- [ ] Criar hook `usePartnerTimeRevisions.ts`

### Frontend - Integração

- [ ] Integrar contador no `PartnerDashboard`
- [ ] Adicionar rota no router
- [ ] Adicionar link no menu lateral (se existir)
- [ ] Adicionar validações de formulário
- [ ] Adicionar loading states
- [ ] Adicionar error handling

### Testes E2E

- [ ] Teste: Especialista solicita revisão → Parceiro vê notificação
- [ ] Teste: Parceiro atualiza prazos → Status muda corretamente
- [ ] Teste: Aplicar sugestões automaticamente
- [ ] Teste: Validação de campos obrigatórios

### Documentação

- [ ] Atualizar `SPECIALIST_TIME_APPROVAL.md` com fluxo completo
- [ ] Criar screenshots da interface
- [ ] Documentar casos de uso
- [ ] Atualizar diagramas de fluxo

---

## 🚀 Plano de Rollout

### Fase 1: MVP (1-2 dias)
- Backend: APIs básicas
- Frontend: Contador + Lista simples
- Edição inline de prazos

### Fase 2: Melhorias (1 dia)
- Melhorias de UX
- Validações robustas
- Feedback visual melhor

### Fase 3: Notificações (Futuro)
- Sistema de notificações por email
- Push notifications

---

## 🔐 Segurança

### Validações Necessárias

1. **Verificar Propriedade do Orçamento**
   ```typescript
   // O parceiro só pode editar seus próprios orçamentos
   const { data: quote } = await supabase
     .from('quotes')
     .select('partner_id')
     .eq('id', quoteId)
     .single();
   
   if (quote.partner_id !== req.user.id) {
     return 403; // Forbidden
   }
   ```

2. **Verificar Status Correto**
   ```typescript
   // Só pode editar se status for 'specialist_time_revision_requested'
   if (quote.status !== 'specialist_time_revision_requested') {
     return 400; // Bad Request
   }
   ```

3. **Validar Prazos**
   ```typescript
   // Prazos devem ser números positivos
   if (estimated_days <= 0) {
     return 400; // Bad Request
   }
   ```

---

## 📊 Métricas de Sucesso

- **Tempo médio de resposta do parceiro** < 24 horas
- **Taxa de aplicação de sugestões** > 70%
- **Redução de idas e vindas** (objetivo: máximo 1 revisão por orçamento)

---

## 🎨 Design System

### Cores

- **Revisão Pendente**: `#FFA500` (Laranja) - Atenção
- **Sugestão**: `#4A90E2` (Azul) - Informação
- **Sucesso**: `#28A745` (Verde) - Confirmação

### Ícones

- 📋 Lista de revisões
- ⏱️ Prazos/Tempos
- 💡 Sugestões
- 📝 Comentários
- ✏️ Editar
- 💾 Salvar

---

## 📚 Referências

- [Documento Principal: SPECIALIST_TIME_APPROVAL.md](./SPECIALIST_TIME_APPROVAL.md)
- [Revisão Técnica: SPECIALIST_TIME_APPROVAL_REVIEW.md](../refactoring/SPECIALIST_TIME_APPROVAL_REVIEW.md)
- [Sumário Executivo: SPECIALIST_TIME_APPROVAL_SUMMARY.md](../refactoring/SPECIALIST_TIME_APPROVAL_SUMMARY.md)

---

**Data de Criação**: 15/10/2025  
**Última Atualização**: 15/10/2025  
**Status**: 📝 Em Planejamento  
**Próxima Ação**: Revisão e aprovação do plano
