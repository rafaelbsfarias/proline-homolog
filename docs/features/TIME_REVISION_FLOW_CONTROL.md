# Controle de Fluxo da Revisão de Prazos

> **📖 Documentação Relacionada:**
> - [Resumo Executivo](./TIME_REVISION_FLOW_SUMMARY.md) - Visão rápida e checklist
> - [Diagramas Visuais](./TIME_REVISION_FLOW_DIAGRAM.md) - Fluxogramas e exemplos
> - [Planejamento Original](./PARTNER_TIME_REVISION_FLOW.md) - Especificação inicial

---

## Visão Geral

O sistema controla se o especialista solicitou uma revisão de prazos e se o parceiro já respondeu através de uma combinação de:
1. **Status do orçamento** (campo `quotes.status`)
2. **Registros de ações** (tabela `quote_time_reviews`)

### 🔄 Loop de Revisões

**IMPORTANTE:** O fluxo de revisão pode se repetir múltiplas vezes:

```
Especialista solicita → Parceiro ajusta → Especialista revisa ajustes
                                              ↓              ↓
                                           Aprova ✅    Rejeita ♻️
                                                          ↓
                                          ←──────────────┘
                                          (volta ao início)
```

⚠️ **PROBLEMA ATUAL:** Não há notificação automática ao especialista após o parceiro atualizar os prazos. Veja seção "Pontos de Atenção" para detalhes.

---

## Estados do Orçamento

### Status Possíveis (campo `quotes.status`)

| Status | Descrição | Próxima Ação |
|--------|-----------|--------------|
| `pending_partner` | Aguardando criação do orçamento pelo parceiro | Parceiro cria orçamento |
| `pending_admin_approval` | Orçamento enviado, aguardando primeira análise do admin | Admin aprova ou rejeita |
| `approved` | Admin aprovou, aguardando análise de prazos do especialista | Especialista revisa prazos |
| `specialist_time_revision_requested` | Especialista solicitou revisão de prazos | Parceiro ajusta prazos |
| `specialist_time_approved` | Especialista aprovou os prazos | Sistema pode prosseguir |
| `admin_review` | Orçamento em nova análise do admin (após atualização do parceiro) | Admin analisa novamente |

---

## Tabela quote_time_reviews

### Estrutura

```sql
CREATE TABLE quote_time_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  specialist_id UUID REFERENCES specialists(profile_id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'revision_requested', 'partner_updated')),
  comments TEXT,
  reviewed_item_ids UUID[],
  revision_requests JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id)
);
```

### Actions Disponíveis

| Action | Quem Cria | Quando | Descrição |
|--------|-----------|--------|-----------|
| `approved` | Especialista | Prazos OK | Especialista aprova todos os prazos do orçamento |
| `revision_requested` | Especialista | Prazos precisam ajuste | Especialista solicita alteração nos prazos de alguns itens |
| `partner_updated` | Parceiro | Após revisar | Parceiro atualizou os prazos conforme solicitado |

---

## Fluxo de Revisão de Prazos

### 1. Especialista Solicita Revisão

**API:** `POST /api/specialist/quotes/[quoteId]/review-times`

**Validações:**
- Quote deve existir e ter status `approved`
- Especialista deve estar vinculado ao cliente do orçamento

**Ações:**
```typescript
// 1. Cria registro na quote_time_reviews
{
  quote_id: quoteId,
  specialist_id: specialistId,
  action: 'revision_requested',
  comments: "Prazos muito curtos para alguns serviços",
  revision_requests: {
    "item-uuid-1": {
      suggested_days: 5,
      reason: "Serviço complexo, requer mais tempo"
    },
    "item-uuid-2": {
      suggested_days: 3,
      reason: "Necessário aguardar peças"
    }
  },
  created_by: specialistId
}

// 2. Atualiza status do orçamento
UPDATE quotes 
SET status = 'specialist_time_revision_requested'
WHERE id = quoteId;
```

**Resultado:**
- ✅ Orçamento aparece no card "Revisão de Prazos Solicitada" do parceiro
- ✅ Status muda para `specialist_time_revision_requested`
- ✅ Registro de revisão criado com suggestions para cada item

---

### 2. Parceiro Visualiza Solicitação

**API:** `GET /api/partner/quotes/pending-time-revisions`

**Consulta:**
```sql
SELECT q.*
FROM quotes q
WHERE q.partner_id = :partnerId
  AND q.status = 'specialist_time_revision_requested'
ORDER BY q.created_at ASC;
```

**API de Detalhes:** `GET /api/partner/quotes/[quoteId]/revision-details`

**Validações:**
- Quote deve pertencer ao parceiro
- Status deve ser `specialist_time_revision_requested`
- Deve existir registro com action `revision_requested`

**Retorna:**
```typescript
{
  quote: {
    id: "...",
    quote_number: "94621DBC",
    client_name: "Cliente XYZ",
    vehicle_plate: "ABC-1234",
    vehicle_model: "Modelo Veículo"
  },
  revision: {
    specialist_name: "Dr. Especialista",
    requested_at: "2025-10-15T10:00:00Z",
    comments: "Prazos muito curtos...",
    revision_requests: {
      "item-uuid-1": {
        suggested_days: 5,
        reason: "Serviço complexo..."
      }
    }
  },
  items: [
    {
      id: "item-uuid-1",
      description: "Troca de óleo",
      estimated_days: 2,          // Prazo atual
      has_suggestion: true,
      suggested_days: 5,           // Sugestão do especialista
      suggestion_reason: "..."
    }
  ]
}
```

---

### 3. Parceiro Atualiza os Prazos

**API:** `PUT /api/partner/quotes/[quoteId]/update-times`

**Body:**
```json
{
  "items": [
    {
      "item_id": "item-uuid-1",
      "estimated_days": 5
    },
    {
      "item_id": "item-uuid-2",
      "estimated_days": 3
    }
  ],
  "comments": "Prazos ajustados conforme solicitação"
}
```

**Validações:**
- Quote deve pertencer ao parceiro
- Status deve ser `specialist_time_revision_requested`
- Todos os prazos devem ser números positivos

**Ações:**
```typescript
// 1. Atualiza os prazos dos itens
UPDATE quote_items 
SET estimated_days = :newDays
WHERE id = :itemId AND quote_id = :quoteId;

// 2. Cria registro de atualização do parceiro
INSERT INTO quote_time_reviews (
  quote_id,
  specialist_id,  -- NULL (não é o especialista)
  action,         -- 'partner_updated'
  comments,
  created_by      -- partner_id
) VALUES (
  :quoteId,
  NULL,
  'partner_updated',
  'Prazos ajustados conforme solicitação',
  :partnerId
);

// 3. Atualiza status do orçamento
UPDATE quotes 
SET status = 'admin_review'
WHERE id = :quoteId;
```

**Resultado:**
- ✅ Prazos dos itens atualizados
- ✅ Registro de `partner_updated` criado
- ✅ Status muda para `admin_review`
- ✅ Orçamento sai do card "Revisão de Prazos Solicitada"
- ✅ Orçamento aparece no card "Orçamentos em Análise"
- ✅ **Especialista deve ser notificado** para revisar os novos prazos

---

### 4. Especialista Revisa Novamente (Loop de Revisões)

Após o parceiro atualizar os prazos, o **especialista precisa revisar novamente** para confirmar se os ajustes foram adequados.

**Status do Orçamento:** `admin_review` ou deveria ter status específico `pending_specialist_review`

**Ações do Especialista:**

#### Opção A: Aprovar os Novos Prazos
**API:** `POST /api/specialist/quotes/[quoteId]/review-times`
```json
{
  "action": "approved",
  "comments": "Prazos ajustados estão adequados"
}
```

**Resultado:**
- Cria registro: `action = 'approved'`
- Status muda: `admin_review` → `specialist_time_approved`
- ✅ Fluxo de revisão finalizado com sucesso

#### Opção B: Solicitar Nova Revisão (Loop)
**API:** `POST /api/specialist/quotes/[quoteId]/review-times`
```json
{
  "action": "revision_requested",
  "comments": "Ainda precisam ajustes",
  "revision_requests": {
    "item-uuid-1": {
      "suggested_days": 7,
      "reason": "Ainda muito apertado, sugerimos 7 dias"
    }
  }
}
```

**Resultado:**
- Cria **novo** registro: `action = 'revision_requested'`
- Status muda: `admin_review` → `specialist_time_revision_requested`
- ♻️ **VOLTA AO INÍCIO**: Parceiro vê novamente no card laranja
- 🔄 **Inicia novo ciclo de revisão**

---

### 🔄 Ciclo Completo de Múltiplas Revisões

```
1ª Rodada:
  Especialista solicita revisão → specialist_time_revision_requested
  Parceiro ajusta prazos → admin_review
  
2ª Rodada:
  Especialista revisa ajustes → Solicita nova revisão
  Status volta → specialist_time_revision_requested
  Parceiro ajusta novamente → admin_review
  
3ª Rodada:
  Especialista revisa ajustes → Aprova!
  Status final → specialist_time_approved
  
✅ Processo finalizado
```

**Histórico de Revisões no Banco:**
```sql
quote_time_reviews:
  1. action='revision_requested'  (1ª solicitação do especialista)
  2. action='partner_updated'      (1ª resposta do parceiro)
  3. action='revision_requested'  (2ª solicitação do especialista)
  4. action='partner_updated'      (2ª resposta do parceiro)
  5. action='approved'             (Aprovação final do especialista)
```

---

## Verificações do Sistema

### Como saber se revisão foi solicitada?

**Método 1: Pelo Status**
```sql
SELECT * FROM quotes 
WHERE status = 'specialist_time_revision_requested';
```
- ✅ Simples e direto
- ✅ Usado nas listagens de cards

**Método 2: Pela Tabela de Reviews**
```sql
SELECT qtr.* 
FROM quote_time_reviews qtr
WHERE qtr.quote_id = :quoteId
  AND qtr.action = 'revision_requested'
ORDER BY qtr.created_at DESC
LIMIT 1;
```
- ✅ Fornece detalhes da solicitação
- ✅ Usado para exibir modal de revisão

---

### Como saber se parceiro já respondeu?

**Método 1: Pelo Status**
```sql
SELECT * FROM quotes 
WHERE id = :quoteId
  AND status = 'admin_review';
```
- Se estava em `specialist_time_revision_requested` e mudou para `admin_review`, o parceiro respondeu

**Método 2: Pela Tabela de Reviews**
```sql
SELECT qtr.* 
FROM quote_time_reviews qtr
WHERE qtr.quote_id = :quoteId
  AND qtr.action = 'partner_updated'
ORDER BY qtr.created_at DESC
LIMIT 1;
```
- ✅ Confirma que parceiro atualizou
- ✅ Fornece timestamp e comentários

---

## Histórico Completo de Revisões

Para ver todo o histórico de ações de um orçamento:

```sql
SELECT 
  qtr.created_at,
  qtr.action,
  qtr.comments,
  p.full_name as created_by_name,
  CASE 
    WHEN qtr.action = 'revision_requested' THEN 'Especialista solicitou revisão'
    WHEN qtr.action = 'approved' THEN 'Especialista aprovou prazos'
    WHEN qtr.action = 'partner_updated' THEN 'Parceiro atualizou prazos'
  END as action_description
FROM quote_time_reviews qtr
JOIN profiles p ON qtr.created_by = p.id
WHERE qtr.quote_id = :quoteId
ORDER BY qtr.created_at DESC;
```

---

## Diferença entre Orçamentos no Card "Em Análise"

### Orçamento COM Revisão de Prazos
```typescript
{
  quote_id: "...",
  status: "specialist_time_revision_requested", // ou admin_review após partner_updated
  has_time_revision: true,
  revision_comments: "Prazos muito curtos..."
}
```
**Ação do Parceiro:**
- Botão: "Revisar Prazos"
- Abre: `TimeRevisionModal` com sugestões do especialista
- Permite: Editar prazos dos itens

### Orçamento SEM Revisão de Prazos
```typescript
{
  quote_id: "...",
  status: "pending_admin_approval",
  has_time_revision: false,
  revision_comments: null
}
```
**Ação do Parceiro:**
- Botão: "Ver Detalhes"
- Redireciona: `/dashboard/partner/orcamento?quoteId=XXX`
- Somente visualização: Parceiro já fez sua parte, aguarda admin

---

## ⚠️ Pontos de Atenção - Implementação Atual

### 1. Falta Notificação ao Especialista

**Problema:**
Quando o parceiro atualiza os prazos, o status muda para `admin_review`, mas:
- ❌ **Especialista NÃO recebe notificação** automática
- ❌ **Não existe dashboard para especialista** ver orçamentos pendentes de nova revisão
- ❌ Especialista precisa **manualmente** verificar orçamentos em `admin_review`

**Status Atual:**
```typescript
// app/api/partner/quotes/[quoteId]/update-times/route.ts
await supabase
  .from('quotes')
  .update({ status: 'admin_review' })  // ⚠️ Não notifica especialista
  .eq('id', quoteId);
```

**Melhorias Necessárias:**

#### Opção A: Novo Status Específico
```typescript
// Criar status: 'pending_specialist_review'
await supabase
  .from('quotes')
  .update({ status: 'pending_specialist_review' })
  .eq('id', quoteId);

// + Enviar notificação ao especialista
await sendNotification({
  to: specialistId,
  type: 'time_revision_updated',
  quoteId: quoteId
});
```

#### Opção B: Dashboard para Especialista
```typescript
// API: GET /api/specialist/quotes/pending-review
// Busca orçamentos que o parceiro já atualizou

SELECT q.*
FROM quotes q
JOIN service_orders so ON q.service_order_id = so.id
JOIN vehicles v ON so.vehicle_id = v.id
JOIN client_specialists cs ON v.client_id = cs.client_id
WHERE q.status = 'admin_review'
  AND cs.specialist_id = :specialistId
  AND EXISTS(
    SELECT 1 
    FROM quote_time_reviews qtr
    WHERE qtr.quote_id = q.id
      AND qtr.action = 'partner_updated'
      AND qtr.created_at > (
        SELECT MAX(created_at) 
        FROM quote_time_reviews
        WHERE quote_id = q.id
          AND action = 'approved'
      )
  );
```

#### Opção C: Notificação por Email
```typescript
// Ao criar registro partner_updated
await emailService.send({
  to: specialist.email,
  subject: 'Prazos atualizados - Orçamento #ABC123',
  template: 'time-revision-updated',
  data: {
    quoteNumber: quote.number,
    clientName: client.name,
    vehiclePlate: vehicle.plate,
    partnerComments: body.comments
  }
});
```

### 2. Loop Infinito Não Está Controlado

**Problema:**
- Não há limite de quantas vezes um orçamento pode entrar em loop de revisão
- Pode gerar frustração para parceiro e especialista

**Sugestão:**
```typescript
// Adicionar contador de revisões
ALTER TABLE quotes ADD COLUMN revision_count INTEGER DEFAULT 0;

// Ao criar nova revisão, incrementar contador
const { data: quote } = await supabase
  .from('quotes')
  .select('revision_count')
  .eq('id', quoteId)
  .single();

if (quote.revision_count >= 3) {
  // Alertar admin ou forçar aprovação/rejeição
  return NextResponse.json({
    success: false,
    error: 'Limite de revisões atingido. Contate o admin.'
  }, { status: 400 });
}

await supabase
  .from('quotes')
  .update({ 
    status: 'specialist_time_revision_requested',
    revision_count: quote.revision_count + 1
  })
  .eq('id', quoteId);
```

---

## Proteções do Sistema

### 1. API revision-details
```typescript
// Só funciona para orçamentos com revisão solicitada
if (quote.status !== 'specialist_time_revision_requested') {
  return 400; // Bad Request
}
```

### 2. API update-times
```typescript
// Só permite atualizar se status correto
const quote = await supabase
  .from('quotes')
  .select('*')
  .eq('id', quoteId)
  .eq('partner_id', partnerId)
  .eq('status', 'specialist_time_revision_requested')
  .single();

if (!quote) {
  return 404; // Not Found
}
```

### 3. RLS (Row Level Security)
```sql
-- Parceiros só veem seus próprios orçamentos
CREATE POLICY "Partners can view own quotes" ON quotes
FOR SELECT USING (partner_id = auth.uid());

-- Especialistas só criam reviews para seus clientes
CREATE POLICY "Specialists can create time reviews" ON quote_time_reviews
FOR INSERT WITH CHECK (
  specialist_id = auth.uid() 
  AND get_my_claim('role') = 'specialist'
);
```

---

## Resumo dos Indicadores

| Situação | Status Quote | Registro Reviews | Card Exibido | Quem Age |
|----------|-------------|------------------|--------------|----------|
| Aguardando revisão do especialista | `approved` | - | Nenhum (aguardando) | Especialista |
| Revisão solicitada pelo especialista | `specialist_time_revision_requested` | `revision_requested` | "Revisão de Prazos Solicitada" (laranja) | **Parceiro** |
| Parceiro atualizou prazos | `admin_review` | `partner_updated` | "Orçamentos em Análise" (branco) | **Especialista** deve revisar novamente |
| Especialista aprovou prazos | `specialist_time_approved` | `approved` | Nenhum (aprovado) | Fluxo continua |
| Aguardando aprovação inicial | `pending_admin_approval` | - | "Orçamentos em Análise" (branco) | Admin |

### ♻️ Loop de Revisões

O fluxo **pode se repetir múltiplas vezes**:

```
specialist_time_revision_requested → (parceiro ajusta) → admin_review
                   ↑                                          ↓
                   └──────────────────────────────────────────┘
                   (especialista solicita nova revisão)
```

**Quando para?**
- ✅ Especialista aprova → Status muda para `specialist_time_approved`
- ❌ Admin/Cliente rejeita o orçamento em qualquer momento

---

## Queries Úteis para Debug

### Ver todas as revisões de um orçamento
```sql
SELECT 
  created_at,
  action,
  comments,
  created_by
FROM quote_time_reviews
WHERE quote_id = :quoteId
ORDER BY created_at ASC;
```

### Ver orçamentos com revisão pendente
```sql
SELECT 
  q.id,
  q.status,
  COUNT(qtr.id) FILTER (WHERE qtr.action = 'revision_requested') as revision_count,
  COUNT(qtr.id) FILTER (WHERE qtr.action = 'partner_updated') as update_count
FROM quotes q
LEFT JOIN quote_time_reviews qtr ON q.id = qtr.quote_id
WHERE q.status = 'specialist_time_revision_requested'
GROUP BY q.id, q.status;
```

### Ver histórico completo de um orçamento
```sql
SELECT 
  'quote' as source,
  created_at,
  status as detail,
  NULL as action
FROM quotes
WHERE id = :quoteId

UNION ALL

SELECT 
  'review' as source,
  created_at,
  comments as detail,
  action
FROM quote_time_reviews
WHERE quote_id = :quoteId

ORDER BY created_at ASC;
```

### Contar ciclos de revisão
```sql
SELECT 
  q.id,
  q.status,
  (SELECT COUNT(*) FROM quote_time_reviews 
   WHERE quote_id = q.id AND action = 'revision_requested') as revision_requests,
  (SELECT COUNT(*) FROM quote_time_reviews 
   WHERE quote_id = q.id AND action = 'partner_updated') as partner_updates,
  (SELECT COUNT(*) FROM quote_time_reviews 
   WHERE quote_id = q.id AND action = 'approved') as approvals
FROM quotes q
WHERE q.id = :quoteId;
```

---

## APIs Pendentes de Implementação

### 1. GET /api/specialist/quotes/pending-review

**Descrição:** Lista orçamentos que o parceiro atualizou e aguardam nova revisão do especialista

**Status:** ❌ NÃO IMPLEMENTADO

**Necessário para:** Especialista visualizar orçamentos que precisa revisar novamente após atualização do parceiro

```typescript
// Sugestão de implementação
export async function GET(req: AuthenticatedRequest) {
  const supabase = SupabaseService.getInstance().getAdminClient();
  const specialistId = req.user.id;
  
  // Buscar orçamentos em admin_review dos clientes do especialista
  // que têm partner_updated mais recente que última aprovação/revisão
  const { data: quotes } = await supabase
    .from('quotes')
    .select(`
      id,
      service_order_id,
      status,
      service_orders(
        vehicle_id,
        vehicles(
          plate,
          model,
          client_id,
          profiles(full_name)
        )
      )
    `)
    .eq('status', 'admin_review')
    .in('service_orders.vehicles.client_id', /* clientes do especialista */);
    
  // Filtrar apenas os que têm partner_updated recente
  // e retornar lista formatada
}
```

### 2. POST /api/specialist/quotes/[quoteId]/review-times (Melhorias)

**Status:** ✅ IMPLEMENTADO (mas precisa melhorias)

**Melhorias necessárias:**
1. Validar se quote está em `admin_review` (não apenas `approved`)
2. Enviar notificação ao parceiro quando solicitar nova revisão
3. Registrar contador de revisões

### 3. WebSocket ou Polling para Notificações

**Status:** ❌ NÃO IMPLEMENTADO

**Necessário para:** Notificações em tempo real quando:
- Especialista solicita revisão → Notificar parceiro
- Parceiro atualiza prazos → Notificar especialista
- Admin aprova/rejeita → Notificar parceiro e especialista
