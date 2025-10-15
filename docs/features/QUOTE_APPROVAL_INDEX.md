# 📚 Índice - Redesign do Fluxo de Aprovação de Orçamentos

**Data**: 15/10/2025  
**Status**: 🟡 Proposta em Análise

---

## 🎯 Visão Geral

Este conjunto de documentos descreve o redesign completo do fluxo de aprovação de orçamentos, separando as aprovações em **3 trilhas independentes** que convergem para o status `approved` apenas quando todas estiverem concluídas.

### Problema Atual
- Fluxo acoplado e confuso
- Especialista só pode revisar após admin aprovar
- Status `approved` usado prematuramente

### Solução Proposta
- **3 trilhas paralelas e independentes**: Admin, Especialista, Cliente
- Convergência automática via trigger
- Status `approved` só quando TODAS as 3 aprovações completas

---

## 📖 Documentos

### 1. 📋 Planejamento e Arquitetura
**Arquivo**: [`QUOTE_APPROVAL_FLOW_REDESIGN.md`](./QUOTE_APPROVAL_FLOW_REDESIGN.md)

**Conteúdo**:
- Problema atual detalhado
- Solução proposta com conceitos
- Novos status do orçamento
- Fluxo detalhado das 3 trilhas
- Estrutura de dados completa (tabelas, triggers, funções)
- APIs necessárias para cada ator
- Plano de implementação em 7 fases
- Exemplos de estados

**Quando usar**: Para entender a arquitetura completa e decisões de design

---

### 2. 📊 Diagramas Visuais
**Arquivo**: [`QUOTE_APPROVAL_FLOW_DIAGRAMS.md`](./QUOTE_APPROVAL_FLOW_DIAGRAMS.md)

**Conteúdo**:
- 6 diagramas detalhados:
  1. Visão geral do sistema
  2. Fluxo detalhado por trilha
  3. Convergência para `approved`
  4. Cenários de exemplo
  5. Estrutura de dados
  6. Dashboards dos atores
- Legenda de símbolos

**Quando usar**: Para visualizar o fluxo e explicar para stakeholders

---

### 3. ✅ Checklist de Implementação
**Arquivo**: [`QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md`](./QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md)

**Conteúdo**:
- 8 fases de implementação detalhadas
- 24 tarefas com checkboxes
- Estimativas de tempo por tarefa
- Status de progresso
- Timeline estimada
- Próximos passos imediatos

**Quando usar**: Durante a implementação, para tracking de progresso

---

## 🗂️ Estrutura de Pastas

```
docs/features/
├── QUOTE_APPROVAL_FLOW_REDESIGN.md          ← Planejamento e Arquitetura
├── QUOTE_APPROVAL_FLOW_DIAGRAMS.md          ← Diagramas Visuais
├── QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md ← Checklist de Implementação
├── QUOTE_APPROVAL_INDEX.md                  ← Este arquivo (índice)
│
├── [OBSOLETOS - Manter para referência]
├── PARTNER_TIME_REVISION_FLOW.md            ← Documentação antiga (65% completo)
├── TIME_REVISION_FLOW_CONTROL.md            ← Loop de revisões (implementado)
└── TIME_REVISION_FLOW_SUMMARY.md            ← Resumo antigo
```

---

## 🔄 Fluxo de Leitura Recomendado

### Para Desenvolvedores

1. **Início**: Ler [`QUOTE_APPROVAL_FLOW_REDESIGN.md`](./QUOTE_APPROVAL_FLOW_REDESIGN.md) completo
2. **Visualizar**: Consultar [`QUOTE_APPROVAL_FLOW_DIAGRAMS.md`](./QUOTE_APPROVAL_FLOW_DIAGRAMS.md) para entender fluxos
3. **Implementar**: Seguir [`QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md`](./QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md) tarefa por tarefa

### Para Product Owners / Stakeholders

1. **Início**: Ler seção "Visão Geral" do [`QUOTE_APPROVAL_FLOW_REDESIGN.md`](./QUOTE_APPROVAL_FLOW_REDESIGN.md)
2. **Visualizar**: Ver diagramas no [`QUOTE_APPROVAL_FLOW_DIAGRAMS.md`](./QUOTE_APPROVAL_FLOW_DIAGRAMS.md)
3. **Timeline**: Consultar resumo de progresso no [`QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md`](./QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md)

### Para QA / Testers

1. **Entender Fluxos**: Ler seção "Fluxo Detalhado" do [`QUOTE_APPROVAL_FLOW_REDESIGN.md`](./QUOTE_APPROVAL_FLOW_REDESIGN.md)
2. **Cenários de Teste**: Ver "Cenários de Exemplo" no [`QUOTE_APPROVAL_FLOW_DIAGRAMS.md`](./QUOTE_APPROVAL_FLOW_DIAGRAMS.md)
3. **Testes E2E**: Consultar Fase 6 do [`QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md`](./QUOTE_APPROVAL_IMPLEMENTATION_CHECKLIST.md)

---

## 📊 Comparação: Antigo vs Novo

### Fluxo Antigo (Atual)

```
Parceiro → Admin → Especialista → Cliente → approved
         (linear e acoplado)
```

**Problemas**:
- Especialista bloqueado até admin aprovar
- Status `approved` usado prematuramente
- Difícil rastrear qual ator está pendente

### Fluxo Novo (Proposto)

```
Parceiro envia →  ┌─ Admin ─┐
                  ├─ Especialista ─┤  → approved
                  └─ Cliente ─┘
         (paralelo e independente)
```

**Benefícios**:
- ✅ 3 trilhas paralelas
- ✅ Status `approved` só quando TUDO OK
- ✅ Rastreabilidade clara
- ✅ Flexível para adicionar novos atores

---

## 🎯 Principais Mudanças

### Database

| Item | Antigo | Novo |
|------|--------|------|
| Status Principal | `quotes.status` (TEXT) | `quotes.status` + `quotes.approval_status` (JSONB) |
| Controle Admin | ❌ Não existia | ✅ `quote_admin_approvals` |
| Controle Cliente | ❌ Não existia | ✅ `quote_client_approvals` |
| Trigger Automático | ❌ Não existia | ✅ `update_quote_status_on_approval()` |

### APIs

| Ator | APIs Antigas | APIs Novas |
|------|--------------|------------|
| Admin | ❌ Não tinha API específica | ✅ `GET /pending-approval`, `POST /approve` |
| Especialista | ✅ Existia mas filtrava por `status` | ✅ Atualizada para filtrar por `approval_status` |
| Cliente | ❌ Não tinha API de aprovação | ✅ `GET /pending-approval`, `POST /approve` |
| Parceiro | ✅ Existia | ✅ Ajustada para iniciar 3 trilhas |

### Frontend

| Componente | Antigo | Novo |
|------------|--------|------|
| Admin Dashboard | ❌ Sem lista específica | ✅ Lista de orçamentos pendentes de aprovação |
| Especialista Dashboard | ✅ Existia | ✅ Ajustado para mostrar status de outras trilhas |
| Cliente Dashboard | ❌ Sem aprovação | ✅ Novo componente de aprovação |
| Parceiro Dashboard | ✅ Existia | ✅ Badges mostrando status das 3 trilhas |

---

## ⏱️ Timeline de Implementação

```
Semana 1 (16-20 Out)
├─ Seg: Migrations (Fase 1) + Backend Admin (Fase 2)
├─ Ter: Backend Especialista (Fase 3) + Backend Cliente (Fase 4)
├─ Qua: Backend Parceiro (Fase 5) + Testes E2E (Fase 6)
├─ Qui: Migração de Dados (Fase 7) + Ajustes
└─ Sex: Documentação (Fase 8) + Code Review

Semana 2 (23-27 Out)
├─ Seg-Ter: Deploy em Staging + Testes Intensivos
├─ Qua: Correções de bugs encontrados
├─ Qui: Deploy em Produção (horário de baixo tráfego)
└─ Sex: Monitoramento e ajustes pós-deploy
```

**Estimativa Total**: 23.5 horas (~3 dias úteis de desenvolvimento)

---

## 🚀 Status Atual

| Fase | Status | Progresso |
|------|--------|-----------|
| 1. Migrations | ⏳ Não Iniciado | 0% |
| 2. Backend - Admin | ⏳ Não Iniciado | 0% |
| 3. Backend - Especialista | ⏳ Não Iniciado | 0% |
| 4. Backend - Cliente | ⏳ Não Iniciado | 0% |
| 5. Backend - Parceiro | ⏳ Não Iniciado | 0% |
| 6. Testes E2E | ⏳ Não Iniciado | 0% |
| 7. Migração de Dados | ⏳ Não Iniciado | 0% |
| 8. Documentação | ✅ Completa | 100% |

**Progresso Geral**: 12.5% (apenas documentação completa)

---

## 📞 Próximas Ações

### Imediato (Hoje - 15/10)
1. ✅ Finalizar documentação (COMPLETO)
2. ⏳ **Apresentar proposta** para tech lead e product owner
3. ⏳ **Aprovar arquitetura** e plano de implementação
4. ⏳ **Criar branch**: `feature/quote-approval-redesign`

### Amanhã (16/10)
1. ⏳ Iniciar **Fase 1**: Migrations
2. ⏳ Testar migrations em ambiente local
3. ⏳ Code review das migrations

### Resto da Semana
1. ⏳ Implementar fases 2-7 seguindo checklist
2. ⏳ Executar testes E2E
3. ⏳ Preparar para deploy em staging

---

## 📝 Notas Importantes

### ⚠️ Atenção

- **Não deletar documentação antiga** (`PARTNER_TIME_REVISION_FLOW.md` etc)
  - Manter para referência histórica
  - Marcar como obsoleta
  - Adicionar links para nova documentação

- **Migration de dados existentes é crítica**
  - Fazer backup completo antes
  - Testar em staging primeiro
  - Ter plano de rollback preparado

- **Feature flag recomendada**
  - Implementar flag `ENABLE_NEW_APPROVAL_FLOW`
  - Permitir rollback rápido se necessário
  - Gradual rollout (10% → 50% → 100%)

### 💡 Dicas

- Revisar cada documento antes de iniciar implementação
- Seguir checklist rigorosamente
- Fazer commits pequenos e frequentes
- Escrever testes antes de implementar (TDD)
- Documentar decisões técnicas importantes

---

## 📚 Referências Externas

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## ✅ Aprovações

- [ ] **Tech Lead**: _______________________
- [ ] **Product Owner**: _______________________
- [ ] **Backend Lead**: _______________________
- [ ] **Frontend Lead**: _______________________

**Data de Aprovação**: _______________________

---

**Criado por**: GitHub Copilot + Rafael  
**Data de Criação**: 15/10/2025  
**Última Atualização**: 15/10/2025  
**Versão**: 1.0
