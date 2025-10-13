# Fluxo de Aprovação de Serviços

## 📋 Visão Geral

Este documento descreve o fluxo completo de aprovação de serviços dos parceiros, implementado para garantir controle de qualidade antes dos serviços serem disponibilizados aos clientes.

## 🔄 Estados de Revisão (review_status)

| Status | Descrição | Ações Disponíveis |
|--------|-----------|-------------------|
| `approved` | Serviço aprovado e ativo | Parceiro: editar<br>Admin: solicitar revisão, rejeitar |
| `pending_review` | Admin solicitou correções | Parceiro: editar (após correção, vai para pending_approval)<br>Admin: aprovar, rejeitar |
| `pending_approval` | Aguardando aprovação do admin | Parceiro: visualizar<br>Admin: aprovar, rejeitar, solicitar nova revisão |
| `rejected` | Serviço rejeitado | Parceiro: visualizar motivo<br>Admin: solicitar revisão (dar nova chance) |
| `in_revision` | Em revisão interna | Parceiro: aguardar<br>Admin: aprovar, rejeitar, solicitar correções |

## 🎯 Fluxo Completo

### 1. Parceiro Cria Serviço
```
Estado Inicial: aprovado
- Parceiro cria novo serviço
- Sistema define automaticamente review_status = 'approved'
- Serviço fica disponível para cotações
```

### 2. Admin Solicita Revisão
```
approved → pending_review
- Admin identifica problema (preço alto, descrição inadequada, etc.)
- Clica em "Revisão" e informa o que deve ser ajustado
- Sistema:
  * review_status = 'pending_review'
  * review_feedback = "mensagem do admin"
  * review_requested_at = timestamp atual
  * review_requested_by = admin_user_id
```

### 3. Parceiro Corrige Serviço
```
pending_review → pending_approval
- Parceiro vê aviso amarelo "Pendente de Revisão"
- Clica em "Editar" e ajusta conforme solicitado
- Ao salvar, sistema:
  * review_status = 'pending_approval'
  * review_requested_at = timestamp atual
  * review_feedback mantém mensagem anterior (para referência)
```

### 4. Admin Aprova ou Rejeita

#### 4.1. Aprovação
```
pending_approval → approved
- Admin revisa as correções
- Clica em "Aprovar"
- Confirmação: "Confirma aprovação do serviço [nome]?"
- Sistema:
  * review_status = 'approved'
  * review_feedback = null
  * review_requested_at = null
- Serviço volta a ficar disponível normalmente
```

#### 4.2. Rejeição
```
pending_approval → rejected
- Admin identifica que serviço não pode ser aprovado
- Clica em "Rejeitar" e informa motivo
- Sistema:
  * review_status = 'rejected'
  * review_feedback = "motivo da rejeição"
  * review_requested_at = timestamp atual
- Parceiro não pode mais usar este serviço
```

## 🎨 Interface do Parceiro

### Sidebar de Serviços
```tsx
// Exibe aviso apenas para pending_review e rejected
{service.review_status === 'pending_review' && (
  <div className={styles.reviewWarning}>
    ⚠️ Pendente de Revisão
    <p>{service.review_feedback}</p>
  </div>
)}

{service.review_status === 'rejected' && (
  <div className={styles.rejectedWarning}>
    ❌ Serviço Rejeitado
    <p>{service.review_feedback}</p>
  </div>
)}

{service.review_status === 'pending_approval' && (
  <div className={styles.pendingWarning}>
    ⏳ Aguardando Aprovação
  </div>
)}
```

### Modal de Edição
- Quando parceiro edita qualquer campo (preço, nome, descrição, status)
- Sistema automaticamente muda para `pending_approval`
- Aviso desaparece e aparece "Aguardando Aprovação"

## 🎨 Interface do Admin

### Painel de Serviços (Partner Overview)

#### Badges de Status
```tsx
// Cores dos badges
approved          → Azul (Aprovado)
pending_review    → Amarelo (Aguardando Revisão)
pending_approval  → Amarelo (Aguardando Aprovação)
rejected          → Vermelho (Rejeitado)
in_revision       → Roxo (Em Revisão)
```

#### Botões de Ação
```tsx
// Sempre disponível
<button>Revisão</button> // Solicitar correções

// Apenas para pending_approval
<button>Aprovar</button>   // Aprovar serviço
<button>Rejeitar</button>  // Rejeitar definitivamente
```

## 📡 Endpoints API

### Admin - Aprovar Serviço
```http
PATCH /api/admin/partners/[partnerId]/services/[serviceId]
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "action": "approve"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "action": "approved",
  "data": [...]
}
```

### Admin - Rejeitar Serviço
```http
PATCH /api/admin/partners/[partnerId]/services/[serviceId]
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "action": "reject",
  "review_feedback": "Motivo da rejeição"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "action": "rejected",
  "data": [...]
}
```

### Admin - Solicitar Revisão
```http
PATCH /api/admin/partners/[partnerId]/services/[serviceId]
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "action": "request_review",
  "review_feedback": "O que deve ser revisado"
}
```

### Parceiro - Editar Serviço
```http
PUT /api/partner/services/v2/[serviceId]
Content-Type: application/json
Authorization: Bearer {partner_token}

{
  "name": "Nome atualizado",
  "price": 200,
  "description": "Nova descrição",
  "isActive": true
}
```

**Comportamento:**
- Se `review_status` era `pending_review`: muda para `pending_approval`
- Qualquer edição → `pending_approval` (aguarda nova aprovação do admin)

## 🗄️ Schema do Banco

### Tabela: partner_services
```sql
review_status         TEXT NOT NULL 
                      CHECK (review_status IN (
                        'approved', 
                        'pending_review', 
                        'pending_approval', 
                        'rejected', 
                        'in_revision'
                      ))
review_feedback       TEXT
review_requested_at   TIMESTAMPTZ
review_requested_by   UUID REFERENCES auth.users(id)
```

### Migration
```sql
-- Arquivo: 20251013094931_update_review_status_constraint.sql
ALTER TABLE partner_services 
DROP CONSTRAINT IF EXISTS partner_services_review_status_check;

ALTER TABLE partner_services 
ADD CONSTRAINT partner_services_review_status_check 
CHECK (review_status = ANY (ARRAY[
  'approved'::text, 
  'pending_review'::text, 
  'pending_approval'::text, 
  'rejected'::text, 
  'in_revision'::text
]));
```

## 🧪 Cenários de Teste

### 1. Fluxo Completo de Aprovação
```bash
# 1. Admin solicita revisão
PATCH /api/admin/partners/{id}/services/{serviceId}
{ "action": "request_review", "review_feedback": "Preço muito alto" }
# ✅ review_status → pending_review

# 2. Parceiro corrige
PUT /api/partner/services/v2/{serviceId}
{ "price": 200 }
# ✅ review_status → pending_approval

# 3. Admin aprova
PATCH /api/admin/partners/{id}/services/{serviceId}
{ "action": "approve" }
# ✅ review_status → approved
# ✅ review_feedback → null
```

### 2. Fluxo de Rejeição
```bash
# 1. Admin rejeita serviço
PATCH /api/admin/partners/{id}/services/{serviceId}
{ "action": "reject", "review_feedback": "Serviço não autorizado" }
# ✅ review_status → rejected
# ✅ Parceiro vê aviso vermelho com motivo
```

### 3. Múltiplas Revisões
```bash
# 1. approved → pending_review (1ª solicitação)
# 2. pending_review → pending_approval (parceiro corrige)
# 3. pending_approval → pending_review (admin pede nova correção)
# 4. pending_review → pending_approval (parceiro corrige novamente)
# 5. pending_approval → approved (admin aprova)
```

## 📝 Regras de Negócio

1. **Criação de Serviço**: Sempre inicia como `approved`
2. **Edição pelo Parceiro**: Sempre vai para `pending_approval` (exceto se já estiver approved sem solicitação pendente)
3. **Rejeição**: Serviço não pode mais ser usado até admin solicitar nova revisão
4. **Feedback Obrigatório**: Rejeição e Solicitação de Revisão exigem feedback
5. **Aprovação**: Limpa feedback e data de solicitação
6. **Logs**: Todas as ações são logadas com admin_id e timestamps

## 🎯 Benefícios Implementados

✅ Controle de qualidade dos serviços
✅ Rastreabilidade completa (quem solicitou, quando, por quê)
✅ Comunicação clara entre admin e parceiro
✅ Interface intuitiva com badges coloridos
✅ Histórico de revisões mantido no banco
✅ Validações em múltiplas camadas (API, Repository, Database)

## 🚀 Próximos Passos (Opcional)

- [ ] Notificações por email quando status muda
- [ ] Histórico de revisões em tabela separada
- [ ] Dashboard de métricas (% aprovação, tempo médio, etc.)
- [ ] Filtros avançados por review_status
- [ ] Comentários/chat entre admin e parceiro
- [ ] Aprovação em lote (múltiplos serviços)

---

**Última atualização:** 13/10/2025
**Versão:** 1.0.0
**Branch:** refactor/partner-overview-incremental
