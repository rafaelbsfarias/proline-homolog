# 📊 Diagramas Visuais - Fluxo de Aprovação Redesenhado

**Referência**: [QUOTE_APPROVAL_FLOW_REDESIGN.md](./QUOTE_APPROVAL_FLOW_REDESIGN.md)

---

## 🎯 Diagrama 1: Visão Geral do Sistema

```
                        ┌─────────────────────────────┐
                        │   PARCEIRO CRIA ORÇAMENTO   │
                        │     (pending_partner)       │
                        └─────────────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────────┐
                        │  PARCEIRO ENVIA ORÇAMENTO   │
                        │       (submitted)           │
                        │                             │
                        │  Cria 3 registros:          │
                        │  ✓ Admin Approval           │
                        │  ✓ Time Approval            │
                        │  ✓ Client Approval          │
                        └─────────────────────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
      ┏━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━┓
      ┃   TRILHA 1:    ┃  ┃   TRILHA 2:    ┃  ┃   TRILHA 3:    ┃
      ┃     ADMIN      ┃  ┃  ESPECIALISTA  ┃  ┃    CLIENTE     ┃
      ┃   (Valores)    ┃  ┃    (Prazos)    ┃  ┃   (Final)      ┃
      ┗━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━┛
                 │                   │                   │
                 │   INDEPENDENTES   │  MAS CONVERGENTES │
                 │                   │                   │
                 └───────────────────┼───────────────────┘
                                     ▼
                        ┌─────────────────────────────┐
                        │     VERIFICAÇÃO FINAL       │
                        │                             │
                        │  Admin: ✅                  │
                        │  Especialista: ✅           │
                        │  Cliente: ✅                │
                        └─────────────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────────┐
                        │       STATUS FINAL:         │
                        │        APPROVED             │
                        └─────────────────────────────┘
```

---

## 🔄 Diagrama 2: Fluxo Detalhado por Trilha

### Trilha 1: Admin (Aprovação de Valores e Itens)

```
┌────────────────────────────────────────────────────────────────┐
│                    TRILHA DO ADMIN                             │
└────────────────────────────────────────────────────────────────┘

    submitted
        │
        ▼
    ┌─────────────────────────┐
    │ Admin Dashboard         │
    │ - Lista de orçamentos   │
    │ - Filtro: admin=pending │
    └─────────────────────────┘
        │
        ▼
    ┌─────────────────────────┐
    │ Admin Analisa:          │
    │ ✓ Valores corretos?     │
    │ ✓ Itens adequados?      │
    │ ✓ Margens OK?           │
    └─────────────────────────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
 APROVA   REJEITA
    │       │
    │       └──────────────────┐
    ▼                          ▼
approval_status.admin   approval_status.admin
    = "approved"            = "revision_requested"
    │                          │
    │                          ▼
    │                     status = "admin_review"
    │                          │
    │                          ▼
    │                     Volta para PARCEIRO
    │                          │
    │                          ▼
    │                     Parceiro Ajusta
    │                          │
    │                          ▼
    │                     Reenvia → admin=pending
    │                          │
    └──────────────────────────┘
                │
                ▼
        Aguarda outras 2 trilhas
```

### Trilha 2: Especialista (Aprovação de Prazos)

```
┌────────────────────────────────────────────────────────────────┐
│                TRILHA DO ESPECIALISTA                          │
└────────────────────────────────────────────────────────────────┘

    submitted
        │
        ▼
    ┌──────────────────────────────┐
    │ Especialista Dashboard       │
    │ - Lista de orçamentos        │
    │ - Filtro: specialist=pending │
    └──────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────┐
    │ Especialista Analisa:        │
    │ ✓ Prazos realistas?          │
    │ ✓ Complexidade considerada?  │
    │ ✓ Margem de segurança OK?    │
    └──────────────────────────────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
 APROVA   PEDE REVISÃO
    │       │
    │       └──────────────────┐
    ▼                          ▼
approval_status             approval_status
.specialist_time            .specialist_time
= "approved"                = "revision_requested"
    │                          │
    │                          ▼
    │    status = "specialist_time_revision_requested"
    │                          │
    │                          ▼
    │                     Volta para PARCEIRO
    │                          │
    │                          ▼
    │                     Parceiro Ajusta Prazos
    │                          │
    │                          ▼
    │                     Reenvia → specialist=pending
    │                          │
    └──────────────────────────┘
                │
                ▼
        Aguarda outras 2 trilhas
```

### Trilha 3: Cliente (Aprovação Final)

```
┌────────────────────────────────────────────────────────────────┐
│                    TRILHA DO CLIENTE                           │
└────────────────────────────────────────────────────────────────┘

    submitted
        │
        ▼
    ┌──────────────────────────────┐
    │ Cliente Dashboard            │
    │ - Lista de orçamentos        │
    │ - Filtro: client=pending     │
    └──────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────┐
    │ Cliente Analisa:             │
    │ ✓ Preço aceitável?           │
    │ ✓ Prazo aceitável?           │
    │ ✓ Escopo correto?            │
    └──────────────────────────────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
 APROVA   REJEITA
    │       │
    │       └──────────────────┐
    ▼                          ▼
approval_status.client    approval_status.client
    = "approved"              = "rejected"
    │                          │
    │                          ▼
    │                     status = "rejected"
    │                          │
    │                          ▼
    │                     FLUXO ENCERRA
    │
    ▼
Aguarda outras 2 trilhas
```

---

## 🎯 Diagrama 3: Convergência para `approved`

```
┌─────────────────────────────────────────────────────────────────┐
│            LÓGICA DE CONVERGÊNCIA AUTOMÁTICA                    │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │   TRIGGER ATIVO     │
    │  (em quote_approvals│
    └─────────────────────┘
            │
            ▼
    ┌─────────────────────────────────────┐
    │  Qualquer aprovação muda?           │
    │  (admin, specialist_time ou client) │
    └─────────────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────────────┐
    │  Verificar approval_status:         │
    │                                     │
    │  admin = "approved" ?               │
    │  specialist_time = "approved" ?     │
    │  client = "approved" ?              │
    └─────────────────────────────────────┘
            │
        ┌───┴───┐
        │       │
    TODAS      FALTA
    APROVADAS  ALGUMA
        │       │
        ▼       ▼
    ┌─────┐  ┌──────┐
    │ SIM │  │ NÃO  │
    └─────┘  └──────┘
        │       │
        ▼       ▼
UPDATE status  Mantém status
= "approved"   = "submitted"
        │
        ▼
    ┌─────────────────────────────────────┐
    │  ORÇAMENTO APROVADO!                │
    │  Pode iniciar execução              │
    └─────────────────────────────────────┘
```

---

## 📊 Diagrama 4: Cenários de Exemplo

### Cenário A: Aprovação Linear (Todos Aprovam)

```
Tempo ────────────────────────────────────────────────►

T0: submitted
    approval_status = {
        admin: "pending",
        specialist_time: "pending",
        client: "pending"
    }
    
T1: Admin aprova
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "pending",
        client: "pending"
    }
    status = "submitted" (ainda aguardando)
    
T2: Especialista aprova
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "approved" ✅,
        client: "pending"
    }
    status = "submitted" (ainda aguardando)
    
T3: Cliente aprova
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "approved" ✅,
        client: "approved" ✅
    }
    status = "approved" ✅✅✅ (TRIGGER AUTOMÁTICO)
```

### Cenário B: Revisão do Especialista

```
Tempo ────────────────────────────────────────────────►

T0: submitted
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "pending",
        client: "approved" ✅
    }
    
T1: Especialista pede revisão
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "revision_requested" ⚠️,
        client: "approved" ✅
    }
    status = "specialist_time_revision_requested"
    
T2: Parceiro ajusta prazos e reenvia
    approval_status = {
        admin: "approved" ✅ (mantém),
        specialist_time: "pending",
        client: "approved" ✅ (mantém)
    }
    status = "submitted"
    
T3: Especialista aprova (3 dias depois)
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "approved" ✅,
        client: "approved" ✅
    }
    status = "approved" ✅✅✅ (TRIGGER AUTOMÁTICO)
```

### Cenário C: Cliente Rejeita

```
Tempo ────────────────────────────────────────────────►

T0: submitted
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "approved" ✅,
        client: "pending"
    }
    
T1: Cliente rejeita
    approval_status = {
        admin: "approved" ✅,
        specialist_time: "approved" ✅,
        client: "rejected" ❌
    }
    status = "rejected" ❌
    
    → FLUXO ENCERRA
```

---

## 🔍 Diagrama 5: Estrutura de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    TABELA: quotes                           │
├─────────────────────────────────────────────────────────────┤
│ id                 UUID                                     │
│ status             TEXT  ← Status GERAL do orçamento       │
│ approval_status    JSONB ← Status de cada trilha           │
│                                                             │
│ approval_status = {                                         │
│     "admin": "pending" | "approved" | "revision_requested",│
│     "specialist_time": "pending" | "approved" | "...",     │
│     "client": "pending" | "approved" | "rejected"          │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N (Histórico)
                              │
      ┌───────────────────────┼───────────────────────┐
      │                       │                       │
      ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│   TABELA:    │    │     TABELA:      │    │   TABELA:    │
│quote_admin_  │    │quote_time_       │    │quote_client_ │
│approvals     │    │reviews           │    │approvals     │
├──────────────┤    ├──────────────────┤    ├──────────────┤
│id            │    │id                │    │id            │
│quote_id (FK) │    │quote_id (FK)     │    │quote_id (FK) │
│admin_id      │    │specialist_id     │    │client_id     │
│status        │    │action/status     │    │status        │
│comments      │    │comments          │    │comments      │
│approved_at   │    │revision_requests │    │approved_at   │
│created_at    │    │created_at        │    │created_at    │
└──────────────┘    └──────────────────┘    └──────────────┘

   HISTÓRICO          HISTÓRICO              HISTÓRICO
   de aprovações      de revisões            de decisões
   do ADMIN           de PRAZOS              do CLIENTE
```

---

## 🎨 Diagrama 6: Dashboards dos Atores

### Admin Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard do Admin                              [Sair]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Orçamentos Pendentes de Aprovação (5)                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Filtro: approval_status->>'admin' = 'pending'         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ #12345 | Cliente ABC | R$ 15.000,00                   │ │
│  │ Status Geral: submitted                                │ │
│  │ ✅ Especialista: Aprovado  ⏳ Cliente: Pendente       │ │
│  │ [Revisar] [Aprovar]                                    │ │
│  │                                                         │ │
│  │ #12346 | Cliente XYZ | R$ 8.500,00                    │ │
│  │ Status Geral: submitted                                │ │
│  │ ⏳ Especialista: Pendente  ⏳ Cliente: Pendente       │ │
│  │ [Revisar] [Aprovar]                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Especialista Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  ⏱️ Dashboard do Especialista                      [Sair]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Aprovação de Prazos Pendentes (3)                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Filtro: approval_status->>'specialist_time' = 'pend'  │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ #12345 | Toyota Corolla - ABC1234                     │ │
│  │ Status Geral: submitted                                │ │
│  │ ✅ Admin: Aprovado  ⏳ Cliente: Pendente              │ │
│  │ Itens: 5 serviços | Total: 25 dias                    │ │
│  │ [Revisar Prazos] [Aprovar]                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ♻️ Revisões Reenviadas (1)                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ #12347 | Honda Civic - XYZ5678                        │ │
│  │ Parceiro ajustou prazos conforme sugerido             │ │
│  │ [Ver Alterações] [Aprovar]                             │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Cliente Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  🚗 Meus Veículos                                   [Sair]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Orçamentos Aguardando Aprovação (2)                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Filtro: approval_status->>'client' = 'pending'        │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ Toyota Corolla - ABC1234                               │ │
│  │ Orçamento #12345 | R$ 15.000,00                       │ │
│  │ ✅ Admin Aprovou  ✅ Especialista Aprovou             │ │
│  │ Prazo: 15 dias úteis                                   │ │
│  │ [Ver Detalhes] [Aprovar] [Rejeitar]                   │ │
│  │                                                         │ │
│  │ Honda Civic - XYZ5678                                  │ │
│  │ Orçamento #12347 | R$ 8.500,00                        │ │
│  │ ✅ Admin Aprovou  ⏳ Especialista Analisando          │ │
│  │ Prazo: aguardando                                      │ │
│  │ [Ver Detalhes] [Aguardar]                              │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Legenda de Símbolos

- ✅ Aprovado / Completo
- ⏳ Aguardando / Pendente
- ⚠️ Revisão Solicitada
- ❌ Rejeitado
- ♻️ Reenviado após ajuste
- 🔄 Em processamento

---

**Data de Criação**: 15/10/2025  
**Versão**: 1.0  
**Status**: Proposta para Aprovação
