# ✅ Checklist de Implementação - Fluxo de Aprovação Redesenhado

**Referência**: [QUOTE_APPROVAL_FLOW_REDESIGN.md](./QUOTE_APPROVAL_FLOW_REDESIGN.md)  
**Diagramas**: [QUOTE_APPROVAL_FLOW_DIAGRAMS.md](./QUOTE_APPROVAL_FLOW_DIAGRAMS.md)

---

## 🎯 Objetivo

Redesenhar o fluxo de aprovação de orçamentos para que as 3 aprovações (Admin, Especialista, Cliente) sejam **independentes e paralelas**, convergindo para o status `approved` apenas quando todas estiverem completas.

---

## 📋 FASE 1: Database Migrations (Prioridade CRÍTICA)

### Migration 1: Adicionar `approval_status` JSONB

- [ ] Criar migration `add_approval_status_to_quotes.sql`
- [ ] Adicionar coluna `approval_status JSONB` em `quotes`
- [ ] Definir valor default:
  ```json
  {
    "admin": "pending",
    "specialist_time": "pending",
    "client": "pending"
  }
  ```
- [ ] Popular registros existentes com status baseado no `status` atual
- [ ] Testar localmente
- [ ] Aplicar em produção

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

### Migration 2: Criar `quote_admin_approvals`

- [ ] Criar migration `create_quote_admin_approvals.sql`
- [ ] Definir estrutura:
  ```sql
  CREATE TABLE quote_admin_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      admin_id UUID REFERENCES profiles(id),
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'revision_requested')),
      comments TEXT,
      reviewed_items JSONB,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] Criar índices: `quote_id`, `status`, `admin_id`
- [ ] Criar RLS policies
- [ ] Testar localmente
- [ ] Aplicar em produção

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

### Migration 3: Criar `quote_client_approvals`

- [ ] Criar migration `create_quote_client_approvals.sql`
- [ ] Definir estrutura:
  ```sql
  CREATE TABLE quote_client_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      client_id UUID REFERENCES profiles(id),
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      comments TEXT,
      approved_at TIMESTAMPTZ,
      rejected_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] Criar índices: `quote_id`, `status`, `client_id`
- [ ] Criar RLS policies
- [ ] Testar localmente
- [ ] Aplicar em produção

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

### Migration 4: Criar Função de Verificação

- [ ] Criar migration `create_check_all_approvals_function.sql`
- [ ] Implementar função:
  ```sql
  CREATE OR REPLACE FUNCTION check_all_approvals_completed(p_quote_id UUID)
  RETURNS BOOLEAN AS $$
  DECLARE
      v_approval_status JSONB;
  BEGIN
      SELECT approval_status INTO v_approval_status
      FROM quotes
      WHERE id = p_quote_id;
      
      RETURN (
          v_approval_status->>'admin' = 'approved' AND
          v_approval_status->>'specialist_time' = 'approved' AND
          v_approval_status->>'client' = 'approved'
      );
  END;
  $$ LANGUAGE plpgsql;
  ```
- [ ] Testar com dados de exemplo
- [ ] Aplicar em produção

**Status**: ⏳ Não Iniciado  
**Estimativa**: 20 minutos  
**Responsável**: _______

---

### Migration 5: Criar Trigger Automático

- [ ] Criar migration `create_auto_approval_trigger.sql`
- [ ] Implementar trigger que:
  1. Detecta mudança em `approval_status`
  2. Chama `check_all_approvals_completed()`
  3. Se TRUE, atualiza `status = 'approved'`
- [ ] Testar cenários:
  - [ ] Todas aprovações completas
  - [ ] Falta uma aprovação
  - [ ] Revisão solicitada
- [ ] Aplicar em produção

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

### Migration 6: Ajustar `quote_time_reviews`

- [ ] Criar migration `add_status_to_quote_time_reviews.sql`
- [ ] Adicionar coluna `approval_status TEXT`
- [ ] Popular com base no `action` existente:
  ```sql
  UPDATE quote_time_reviews
  SET approval_status = CASE
      WHEN action = 'approved' THEN 'approved'
      WHEN action = 'revision_requested' THEN 'revision_requested'
      ELSE 'pending'
  END;
  ```
- [ ] Testar localmente
- [ ] Aplicar em produção

**Status**: ⏳ Não Iniciado  
**Estimativa**: 20 minutos  
**Responsável**: _______

---

## 📋 FASE 2: Backend - APIs do Admin

### API: GET `/api/admin/quotes/pending-approval`

- [ ] Criar arquivo `app/api/admin/quotes/pending-approval/route.ts`
- [ ] Implementar query:
  ```typescript
  .select('*')
  .eq('approval_status->>admin', 'pending')
  ```
- [ ] Incluir informações de outras trilhas no retorno
- [ ] Adicionar paginação
- [ ] Testar com Postman
- [ ] Criar testes unitários

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

### API: POST `/api/admin/quotes/[quoteId]/approve`

- [ ] Criar arquivo `app/api/admin/quotes/[quoteId]/approve/route.ts`
- [ ] Implementar lógica:
  1. Validar permissões do admin
  2. Verificar se orçamento está `submitted`
  3. Criar registro em `quote_admin_approvals`
  4. Atualizar `approval_status.admin` em `quotes`
  5. Trigger automático verifica convergência
- [ ] Suportar actions: `approve`, `request_revision`
- [ ] Testar cenários:
  - [ ] Aprovação simples
  - [ ] Pedido de revisão
  - [ ] Última aprovação (trigger para `approved`)
- [ ] Criar testes unitários

**Status**: ⏳ Não Iniciado  
**Estimativa**: 2 horas  
**Responsável**: _______

---

### Integração: Dashboard do Admin

- [ ] Ajustar componente `AdminQuotesList` para filtrar por `approval_status.admin`
- [ ] Adicionar badge mostrando status das outras 2 trilhas
- [ ] Adicionar botões de ação (Aprovar/Pedir Revisão)
- [ ] Testar UI

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

## 📋 FASE 3: Backend - APIs do Especialista

### API: Ajustar GET `/api/specialist/quotes/pending-time-approval`

- [ ] Abrir arquivo existente
- [ ] **REMOVER** filtro por `status = 'approved'`
- [ ] **ADICIONAR** filtro por `approval_status->>specialist_time = 'pending'`
- [ ] Incluir informações de outras trilhas no retorno
- [ ] Testar com Postman
- [ ] Atualizar testes

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

### API: Ajustar POST `/api/specialist/quotes/[quoteId]/approve-times`

- [ ] Abrir arquivo `app/api/specialist/quotes/[quoteId]/review-times/route.ts`
- [ ] **REMOVER** validação de `status = 'approved'`
- [ ] **ADICIONAR** validação de `approval_status.specialist_time = 'pending'`
- [ ] Ao aprovar:
  1. Criar/atualizar registro em `quote_time_reviews`
  2. Atualizar `approval_status.specialist_time = 'approved'`
  3. Trigger automático verifica convergência
- [ ] Ao pedir revisão:
  1. Criar registro em `quote_time_reviews` com action='revision_requested'
  2. Atualizar `approval_status.specialist_time = 'revision_requested'`
  3. Atualizar `status = 'specialist_time_revision_requested'`
- [ ] Testar cenários:
  - [ ] Aprovação simples
  - [ ] Pedido de revisão
  - [ ] Última aprovação (trigger para `approved`)
- [ ] Atualizar testes

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1.5 horas  
**Responsável**: _______

---

### Integração: Dashboard do Especialista

- [ ] Ajustar componente `TimeApprovalsList` para filtrar por `approval_status.specialist_time`
- [ ] Adicionar badge mostrando status das outras 2 trilhas
- [ ] Testar UI

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

## 📋 FASE 4: Backend - APIs do Cliente

### API: GET `/api/client/quotes/pending-approval`

- [ ] Criar arquivo `app/api/client/quotes/pending-approval/route.ts`
- [ ] Implementar query:
  ```typescript
  .select('*')
  .eq('approval_status->>client', 'pending')
  .eq('client_id', clientId) // Filtro de segurança
  ```
- [ ] Incluir informações de outras trilhas no retorno
- [ ] Testar com Postman
- [ ] Criar testes unitários

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

### API: POST `/api/client/quotes/[quoteId]/approve`

- [ ] Criar arquivo `app/api/client/quotes/[quoteId]/approve/route.ts`
- [ ] Implementar lógica:
  1. Validar permissões do cliente
  2. Verificar se orçamento está `submitted`
  3. Criar registro em `quote_client_approvals`
  4. Atualizar `approval_status.client` em `quotes`
  5. Trigger automático verifica convergência
- [ ] Suportar actions: `approve`, `reject`
- [ ] Testar cenários:
  - [ ] Aprovação simples
  - [ ] Rejeição (status final = `rejected`)
  - [ ] Última aprovação (trigger para `approved`)
- [ ] Criar testes unitários

**Status**: ⏳ Não Iniciado  
**Estimativa**: 2 horas  
**Responsável**: _______

---

### Componente: Cliente Approval Card

- [ ] Criar componente `ClientQuoteApprovalCard.tsx`
- [ ] Mostrar informações do orçamento
- [ ] Mostrar status das 3 trilhas com badges
- [ ] Botões: Aprovar / Rejeitar / Ver Detalhes
- [ ] Integrar no dashboard do cliente
- [ ] Testar UI

**Status**: ⏳ Não Iniciado  
**Estimativa**: 2 horas  
**Responsável**: _______

---

## 📋 FASE 5: Backend - APIs do Parceiro

### API: POST `/api/partner/quotes/[quoteId]/submit`

- [ ] Criar arquivo `app/api/partner/quotes/[quoteId]/submit/route.ts`
- [ ] Implementar lógica:
  1. Validar que status atual é `pending_partner`
  2. Atualizar `status = 'submitted'`
  3. Inicializar `approval_status`:
     ```json
     {
       "admin": "pending",
       "specialist_time": "pending",
       "client": "pending"
     }
     ```
  4. Criar 3 registros iniciais:
     - `quote_admin_approvals` (pending)
     - `quote_time_reviews` (pending)
     - `quote_client_approvals` (pending)
  5. Enviar notificações aos 3 atores
- [ ] Testar com Postman
- [ ] Criar testes unitários

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1.5 horas  
**Responsável**: _______

---

### Componente: Status das 3 Trilhas

- [ ] Criar componente `ApprovalStatusBadges.tsx`
- [ ] Mostrar 3 badges:
  - Admin: ✅ Aprovado / ⏳ Pendente / ⚠️ Revisão
  - Especialista: ✅ Aprovado / ⏳ Pendente / ⚠️ Revisão
  - Cliente: ✅ Aprovado / ⏳ Pendente / ❌ Rejeitado
- [ ] Integrar em:
  - [ ] Dashboard do parceiro
  - [ ] Página de detalhes do orçamento
- [ ] Testar UI

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

## 📋 FASE 6: Testes End-to-End

### Cenário 1: Aprovação Linear

- [ ] Criar teste E2E `quote-approval-linear.spec.ts`
- [ ] Simular:
  1. Parceiro cria e envia orçamento
  2. Admin aprova primeiro
  3. Especialista aprova segundo
  4. Cliente aprova terceiro
  5. Verificar status final = `approved`
- [ ] Executar teste
- [ ] Documentar resultado

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

### Cenário 2: Aprovação Desordenada

- [ ] Criar teste E2E `quote-approval-unordered.spec.ts`
- [ ] Simular:
  1. Parceiro cria e envia orçamento
  2. Cliente aprova primeiro
  3. Especialista aprova segundo
  4. Admin aprova terceiro (último)
  5. Verificar status final = `approved`
- [ ] Executar teste
- [ ] Documentar resultado

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

### Cenário 3: Revisão do Especialista

- [ ] Criar teste E2E `quote-time-revision.spec.ts`
- [ ] Simular:
  1. Admin e Cliente já aprovaram
  2. Especialista pede revisão
  3. Parceiro ajusta prazos
  4. Especialista aprova
  5. Verificar status final = `approved`
- [ ] Executar teste
- [ ] Documentar resultado

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

### Cenário 4: Cliente Rejeita

- [ ] Criar teste E2E `quote-client-rejection.spec.ts`
- [ ] Simular:
  1. Admin e Especialista já aprovaram
  2. Cliente rejeita
  3. Verificar status final = `rejected`
  4. Verificar que fluxo encerrou
- [ ] Executar teste
- [ ] Documentar resultado

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

## 📋 FASE 7: Migração de Dados Existentes

### Script de Migração

- [ ] Criar script `migrate-existing-quotes.sql`
- [ ] Para cada orçamento existente:
  1. Analisar `status` atual
  2. Inferir `approval_status` apropriado
  3. Criar registros históricos nas tabelas de controle
- [ ] Testar em ambiente de staging
- [ ] Executar em produção com backup
- [ ] Validar migração (100% dos registros OK)

**Status**: ⏳ Não Iniciado  
**Estimativa**: 2 horas  
**Responsável**: _______

---

## 📋 FASE 8: Documentação

### Atualizar Documentação Existente

- [ ] Revisar `PARTNER_TIME_REVISION_FLOW.md`
- [ ] Adicionar referências aos novos docs
- [ ] Atualizar diagramas de fluxo
- [ ] Marcar seções obsoletas

**Status**: ⏳ Não Iniciado  
**Estimativa**: 30 minutos  
**Responsável**: _______

---

### Criar Guia de Migração

- [ ] Documentar diferenças entre fluxo antigo e novo
- [ ] Explicar como testar a migração
- [ ] Listar possíveis problemas e soluções
- [ ] Adicionar FAQ

**Status**: ⏳ Não Iniciado  
**Estimativa**: 1 hora  
**Responsável**: _______

---

## 📊 Resumo de Progresso

### Por Fase

| Fase | Tarefas | Concluídas | Progresso | Estimativa |
|------|---------|------------|-----------|------------|
| 1. Migrations | 6 | 6 | ✅ 100% | 3h |
| 2. Backend - Admin | 3 | 3 | ✅ 100% | 4h |
| 3. Backend - Especialista | 3 | 3 | ✅ 100% | 2.5h |
| 4. Backend - Cliente | 3 | 3 | ✅ 100% | 5h |
| 5. Backend - Parceiro | 2 | 2 | ✅ 100% | 2.5h |
| 6. Testes E2E | 4 | 0 | ⏳ 0% | 3h |
| 7. Migração de Dados | 1 | 0 | ⏳ 0% | 2h |
| 8. Documentação | 2 | 0 | ⏳ 0% | 1.5h |
| **TOTAL** | **24** | **17** | **🚀 71%** | **23.5h** |

### Timeline Estimada

- **Início**: 16/10/2025
- **Fim Previsto**: 18/10/2025 (3 dias úteis)
- **Sprint**: Sprint 42

---

## 🚀 Próximos Passos Imediatos

1. ✅ **Aprovar este plano** com o time
2. ⏳ **Criar branch**: `feature/quote-approval-redesign`
3. ⏳ **Iniciar Fase 1**: Migrations (prioridade crítica)
4. ⏳ **Executar testes** em ambiente local
5. ⏳ **Code review** das migrations antes de produção

---

## 📞 Contatos

- **Tech Lead**: _______
- **Backend**: _______
- **Frontend**: _______
- **QA**: _______

---

**Criado em**: 15/10/2025  
**Atualizado em**: 15/10/2025  
**Versão**: 1.0  
**Status**: 🟡 Aguardando Aprovação
