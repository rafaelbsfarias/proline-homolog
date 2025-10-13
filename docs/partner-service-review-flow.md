# Fluxo de Revisão de Serviços do Parceiro

## 📋 Visão Geral

Sistema que permite ao administrador solicitar revisões em serviços cadastrados pelos parceiros, com feedback específico sobre o que deve ser ajustado.

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN - Partner Overview                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Visualiza Serviço│
                    │   na Tabela      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Clica "Revisão"  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Modal se Abre   │
                    │  - Nome serviço  │
                    │  - Descrição     │
                    │  - Preço atual   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Admin Digita     │
                    │   Feedback:      │
                    │ "O preço está    │
                    │  acima do        │
                    │  mercado..."     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Clica "Solicitar │
                    │    Revisão"      │
                    └──────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │ API: PATCH /admin/partners/.../services   │
        │ action: 'request_review'                  │
        │ review_feedback: "..."                    │
        └───────────────────────────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │ Database UPDATE partner_services:         │
        │ - review_status = 'pending_review'        │
        │ - review_feedback = "..."                 │
        │ - review_requested_at = NOW()             │
        │ - review_requested_by = admin_id          │
        └───────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Badge Amarelo    │
                    │ "Aguardando      │
                    │  Revisão"        │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PARCEIRO - Dashboard (Futuro)                       │
│ - Vê lista de serviços com badge "Aguardando Revisão"          │
│ - Clica para ver feedback do admin                             │
│ - Opções:                                                       │
│   1. Ajustar serviço (editar nome/descrição/preço)            │
│   2. Remover serviço do portfólio                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Estados de Revisão

### 1. **Aprovado** (approved) - Badge Azul
- **Quando:** Estado padrão de todos os serviços
- **Significado:** Serviço está OK, sem necessidade de ajustes
- **Visual:** Badge azul claro (#dbeafe)
- **Ações disponíveis:** Admin pode solicitar revisão

### 2. **Aguardando Revisão** (pending_review) - Badge Amarelo
- **Quando:** Admin solicitou revisão
- **Significado:** Parceiro precisa ajustar o serviço conforme feedback
- **Visual:** Badge amarelo (#fef3c7)
- **Feedback visível:** Tooltip mostra texto do admin ao passar mouse
- **Ações disponíveis:** 
  - Admin pode atualizar feedback
  - Parceiro deve revisar (futuro)

### 3. **Em Revisão** (in_revision) - Badge Roxo
- **Quando:** Parceiro começou a ajustar (futuro)
- **Significado:** Parceiro está trabalhando nos ajustes
- **Visual:** Badge roxo (#e0e7ff)
- **Ações disponíveis:** 
  - Parceiro pode salvar alterações
  - Admin aguarda conclusão

## 📊 Estrutura de Dados

### Tabela: `partner_services`

```sql
CREATE TABLE partner_services (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(profile_id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  
  -- Campos de Revisão
  review_status TEXT DEFAULT 'approved' 
    CHECK (review_status IN ('approved', 'pending_review', 'in_revision')),
  review_feedback TEXT,
  review_requested_at TIMESTAMPTZ,
  review_requested_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices para Performance

```sql
CREATE INDEX idx_partner_services_review_status 
ON partner_services(review_status);

CREATE INDEX idx_partner_services_partner_review 
ON partner_services(partner_id, review_status);
```

## 🔌 API Endpoints

### PATCH `/api/admin/partners/[partnerId]/services/[serviceId]`

#### Request - Solicitar Revisão
```json
{
  "action": "request_review",
  "review_feedback": "O preço está R$ 150,00 acima da média. Sugestão: ajustar para R$ 200,00"
}
```

#### Response - Sucesso
```json
{
  "success": true,
  "action": "review_requested"
}
```

#### Response - Erro (Feedback vazio)
```json
{
  "error": "Feedback de revisão é obrigatório"
}
```

#### Request - Toggle Ativo (Legacy, ainda suportado)
```json
{
  "is_active": false
}
```

### GET `/api/admin/partners/[partnerId]/services`

#### Response
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Troca de óleo",
      "description": "Troca completa de óleo do motor",
      "price": 350.00,
      "is_active": true,
      "review_status": "pending_review",
      "review_feedback": "O preço está acima do mercado...",
      "review_requested_at": "2025-10-13T06:30:00Z",
      "created_at": "2025-10-10T10:00:00Z"
    }
  ]
}
```

## 🎯 Casos de Uso

### Caso 1: Admin Solicita Revisão de Preço

**Cenário:**
- Parceiro cadastrou serviço "Troca de óleo" por R$ 350,00
- Admin identifica que preço está R$ 100,00 acima do mercado

**Passos:**
1. Admin acessa `/dashboard/admin/partner-overview?partnerId={uuid}`
2. Localiza serviço "Troca de óleo" na tabela
3. Clica botão "Revisão"
4. Modal abre mostrando:
   - Nome: "Troca de óleo"
   - Preço atual: R$ 350,00
5. Admin digita feedback:
   ```
   O preço está R$ 100,00 acima da média do mercado.
   Sugestão: ajustar para aproximadamente R$ 250,00
   ```
6. Clica "Solicitar Revisão"
7. Badge muda para amarelo "Aguardando Revisão"
8. Parceiro será notificado (futuro)

### Caso 2: Admin Solicita Revisão de Descrição

**Cenário:**
- Serviço tem descrição genérica/incompleta

**Feedback exemplo:**
```
A descrição está muito genérica. Por favor, detalhe:
- Tipo de óleo utilizado (mineral, sintético, etc)
- Se inclui filtro de óleo
- Tempo estimado do serviço
- Garantia oferecida
```

### Caso 3: Admin Solicita Revisão de Nome

**Cenário:**
- Nome do serviço não segue padrão ou está confuso

**Feedback exemplo:**
```
O nome "Serviço 1" não é descritivo.
Sugestão: renomear para "Revisão Completa 10.000km" ou similar
```

## 🚀 Features Implementadas

✅ **Migration Database**
- Campos de revisão na tabela `partner_services`
- Índices para queries eficientes
- Constraints de validação

✅ **API Endpoint**
- Action `request_review` com validação
- Rastreamento de quem/quando solicitou
- Logging de eventos

✅ **Frontend - ServicesTable**
- Botão "Revisão" para cada serviço
- Modal dedicado para feedback
- Validação de campo obrigatório
- Loading states
- Error handling

✅ **Visual Feedback**
- Badge colorido por status
- Tooltip com feedback no hover
- Modal responsivo
- Estados disabled durante submissão

✅ **UX/UI**
- Informações do serviço no modal
- Campo textarea para feedback detalhado
- Botões de ação claros
- Mensagens de erro específicas

## 📋 Backlog / Próximos Passos

### 1. Dashboard do Parceiro (Alta Prioridade)
```typescript
// Página: /dashboard/partner/services
// Features:
- Lista de serviços com badges de status
- Filtro: "Aguardando Revisão"
- Card expandido mostrando feedback do admin
- Botão "Ajustar Serviço"
- Botão "Remover do Portfólio"
```

### 2. Edição de Serviço pelo Parceiro
```typescript
// Modal de edição com:
- Campos preenchidos com valores atuais
- Feedback do admin sempre visível
- Validações em tempo real
- Preview de mudanças
- Confirmar ajustes
```

### 3. Notificações
```typescript
// Sistema de notificações:
- Email quando revisão solicitada
- Badge de contagem no menu
- Lista de notificações não lidas
- Deep link para serviço específico
```

### 4. Histórico de Revisões
```typescript
// Timeline de mudanças:
- Quando revisão foi solicitada
- Feedback original do admin
- Mudanças feitas pelo parceiro
- Data de resolução
- Auditoria completa
```

### 5. Aprovação Automática
```typescript
// Após parceiro ajustar:
- Admin vê diff das mudanças
- Botão "Aprovar Ajustes"
- review_status volta para 'approved'
- Notifica parceiro da aprovação
```

### 6. Bulk Review
```typescript
// Revisão em massa:
- Select múltiplos serviços
- Feedback único para todos
- Ou feedback individualizado
- Preview antes de enviar
```

### 7. Templates de Feedback
```typescript
// Admin tem templates pré-definidos:
- "Preço acima do mercado"
- "Descrição incompleta"
- "Nome não descritivo"
- Pode customizar após selecionar
```

### 8. Estatísticas
```typescript
// Métricas de revisão:
- Total de revisões pendentes
- Tempo médio de resolução
- Taxa de ajuste vs remoção
- Parceiros com mais revisões
```

## 🔒 Segurança

### Validações Backend
```typescript
// API valida:
✅ Usuário é admin (withAdminAuth)
✅ Feedback não é vazio
✅ ServiceId existe
✅ ServiceId pertence ao partnerId
✅ Rastreia admin_id que solicitou
```

### RLS Policies (Futuro)
```sql
-- Parceiro só vê próprios serviços
CREATE POLICY partner_own_services ON partner_services
  FOR SELECT USING (partner_id = auth.uid());

-- Parceiro só edita próprios serviços em revisão
CREATE POLICY partner_edit_review ON partner_services
  FOR UPDATE USING (
    partner_id = auth.uid() 
    AND review_status = 'pending_review'
  );

-- Admin vê todos
CREATE POLICY admin_all_services ON partner_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid()
    )
  );
```

## 🧪 Testes Sugeridos

### Testes Unitários
```typescript
describe('handleRequestServiceReview', () => {
  it('deve enviar feedback válido', async () => {
    const feedback = "Ajustar preço para R$ 200";
    await handleRequestServiceReview(serviceId, feedback);
    expect(mockFetch).toHaveBeenCalledWith(...);
  });

  it('deve lançar erro com feedback vazio', async () => {
    await expect(
      handleRequestServiceReview(serviceId, "")
    ).rejects.toThrow();
  });
});
```

### Testes de Integração
```typescript
describe('Service Review Flow', () => {
  it('deve completar fluxo de revisão', async () => {
    // 1. Admin abre modal
    // 2. Digita feedback
    // 3. Submete
    // 4. Verifica badge amarelo
    // 5. Verifica tooltip com feedback
  });
});
```

### Testes E2E (Cypress)
```typescript
describe('Admin Service Review', () => {
  it('deve solicitar revisão de serviço', () => {
    cy.visit('/dashboard/admin/partner-overview?partnerId=...');
    cy.contains('Revisão').first().click();
    cy.get('textarea').type('Ajustar preço...');
    cy.contains('Solicitar Revisão').click();
    cy.contains('Aguardando Revisão').should('be.visible');
  });
});
```

## 📖 Referências

**Migrations:**
- `supabase/migrations/20251013062211_add_is_active_to_partner_services.sql`
- `supabase/migrations/20251013063141_add_review_fields_to_partner_services.sql`

**API:**
- `app/api/admin/partners/[partnerId]/services/route.ts`
- `app/api/admin/partners/[partnerId]/services/[serviceId]/route.ts`

**Components:**
- `modules/admin/partner-overview/components/ServicesTable.tsx`
- `modules/admin/partner-overview/components/ServicesTable.module.css`

**Types:**
- `modules/admin/partner-overview/types.ts`

**Hooks:**
- `modules/admin/partner-overview/hooks/usePartnerData.ts`

**Pages:**
- `app/dashboard/admin/partner-overview/page.tsx`

---

**Última atualização:** 13/10/2025  
**Status:** ✅ Implementado (Lado Admin)  
**Próximo:** Dashboard do Parceiro para visualizar e responder revisões
