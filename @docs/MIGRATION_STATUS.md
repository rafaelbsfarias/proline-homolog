# Status de Migração: Estado Atual → Estado Alvo

**Data de início:** Setembro 2025  
**Última atualização:** 14 de Outubro de 2025  
**Status geral:** 🟡 EM PROGRESSO (60% completo)

---

## 📊 Visão Geral

Este documento rastreia o progresso da migração gradual do sistema de checklists da arquitetura
legada (focada em mecânica) para a arquitetura alvo (multi-categoria com isolamento por parceiro).

```
Estado Inicial (Set/2025)     Estado Atual (Out/2025)      Estado Alvo (@docs/)
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│ mechanics_only  │   60%    │ multi_partner   │   40%    │ partner_checklists │
│ single_evidence │  ════>   │ multi_evidence  │  ════>   │ normalized_context │
│ no_isolation    │          │ partner_isolated│          │ template_versioned │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

---

## ✅ Completado (60%)

### 1. Isolamento por Parceiro ✅ 100%

**Status:** CONCLUÍDO  
**Data:** 13 de Outubro de 2025

- [x] Adicionar `partner_id` a todas as tabelas
- [x] Criar RLS policies por parceiro
- [x] Validar acesso via middleware
- [x] Testar isolamento entre parceiros

**Migrations:**

- `20251013234326_add_partner_id_to_vehicle_anomalies.sql`

**Resultado:** Cada parceiro vê apenas seus próprios dados.

---

### 2. Suporte a Quote ID ✅ 100%

**Status:** CONCLUÍDO  
**Data:** 13 de Outubro de 2025

- [x] Adicionar coluna `quote_id` às tabelas
- [x] Criar índices de performance
- [x] Atualizar APIs para aceitar `quote_id`
- [x] Manter compatibilidade com `inspection_id`

**Migrations:**

- `20251013005933_add_quote_id_to_checklist_tables.sql`

**Resultado:** Parceiros usam `quote_id`, especialistas usam `inspection_id`.

---

### 3. Múltiplas Evidências por Item ✅ 100%

**Status:** CONCLUÍDO  
**Data:** 14 de Outubro de 2025

- [x] Remover constraint UNIQUE de evidências
- [x] Atualizar TypeScript types (array)
- [x] Implementar UI de grid com thumbnails
- [x] Testar upload de múltiplas fotos

**Migrations:**

- `20251014172305_allow_multiple_evidences_per_item.sql`

**Código:**

- `modules/partner/hooks/usePartnerChecklist.ts`
- `modules/partner/components/checklist/PartnerChecklistGroups.tsx`

**Resultado:** Parceiros podem adicionar múltiplas fotos por item.

---

### 4. Constraint Única Corrigida ✅ 100%

**Status:** CONCLUÍDO  
**Data:** 14 de Outubro de 2025

- [x] Remover `UNIQUE (vehicle_id, inspection_id)`
- [x] Adicionar `UNIQUE (partner_id, quote_id)`
- [x] Adicionar `UNIQUE (partner_id, vehicle_id, inspection_id)` (legacy)
- [x] Testar múltiplos parceiros no mesmo veículo

**Migrations:**

- `20251014180312_fix_mechanics_checklist_unique_constraint.sql`

**Resultado:** Múltiplos parceiros podem trabalhar no mesmo veículo.

---

### 5. Timeline Deduplicada ✅ 100%

**Status:** CONCLUÍDO  
**Data:** 14 de Outubro de 2025

- [x] Remover timeline de `/init` endpoint
- [x] Remover timeline de `/save-anomalies` endpoint
- [x] Manter apenas em `/submit` com verificação
- [x] Implementar deduplicação automática

**Código:**

- `app/api/partner/checklist/init/route.ts`
- `app/api/partner/checklist/save-anomalies/route.ts`
- `app/api/partner/checklist/submit/route.ts`

**Resultado:** Apenas uma entrada de timeline por status.

---

### 6. Solicitações de Peças ✅ 100%

**Status:** CONCLUÍDO  
**Data:** 13 de Outubro de 2025

- [x] Criar tabela `part_requests`
- [x] Vincular a `quote_id` e `item_key`
- [x] Implementar modal de criação
- [x] API de CRUD

**Migrations:**

- `20251013143245_create_part_requests_table.sql`

**Componentes:**

- `PartRequestModal.tsx`
- `PartRequestCard.tsx`

**Resultado:** Parceiros podem solicitar peças por item.

---

## 🟡 Em Progresso (20%)

### 7. Normalização de Categorias 🟡 40%

**Status:** EM PROGRESSO  
**Próximos passos:**

- [x] Tabela `partner_categories` criada
- [x] Relacionamento N:N com parceiros
- [ ] Adicionar campo `category` em `mechanics_checklist`
- [ ] Migration de backfill
- [ ] Atualizar queries para usar campo direto

**Estimativa:** 2 sprints

---

### 8. Documentação Atualizada 🟡 80%

**Status:** EM PROGRESSO  
**Próximos passos:**

- [x] Criar `DOCUMENTATION_REALITY_GAP_ANALYSIS.md`
- [x] Adicionar warning em `@docs/README.md`
- [x] Criar `@docs/as-is/CURRENT_STATE.md`
- [x] Criar `@docs/MIGRATION_STATUS.md`
- [ ] Criar ADRs para decisões arquiteturais
- [ ] Atualizar diagramas ER

**Estimativa:** 1 sprint

---

## ❌ Não Iniciado (20%)

### 9. Normalização de Contexto ❌ 0%

**Status:** NÃO INICIADO  
**Prioridade:** MÉDIA

**Objetivo:** Unificar `inspection_id` e `quote_id` em `(context_type, context_id)`.

**Tarefas:**

- [ ] Criar migration para adicionar `context_type` e `context_id`
- [ ] Backfill dados existentes
  - `inspection_id` → `context_type='inspection'`, `context_id=inspection_id`
  - `quote_id` → `context_type='quote'`, `context_id=quote_id`
- [ ] Atualizar APIs para usar novo formato
- [ ] Deprecar `inspection_id` e `quote_id`
- [ ] Atualizar TypeScript types
- [ ] Testar compatibilidade
- [ ] Remover campos antigos (breaking change)

**Estimativa:** 3 sprints  
**Risco:** ALTO (breaking change)

---

### 10. Renomeação de Tabelas ❌ 0%

**Status:** NÃO INICIADO  
**Prioridade:** BAIXA

**Objetivo:** Renomear tabelas de `mechanics_*` para `partner_checklist*`.

**Tarefas:**

- [ ] Criar views de compatibilidade
  ```sql
  CREATE VIEW mechanics_checklist AS SELECT * FROM partner_checklists;
  ```
- [ ] Migration de rename
- [ ] Atualizar código gradualmente
- [ ] Deprecar views antigas
- [ ] Remover views (breaking change)

**Estimativa:** 4 sprints  
**Risco:** MUITO ALTO (breaking change massivo)  
**Decisão:** Adiar para versão 2.0

---

### 11. Sistema de Templates ❌ 0%

**Status:** NÃO INICIADO  
**Prioridade:** MÉDIA

**Objetivo:** Implementar templates versionados por categoria.

**Tarefas:**

- [ ] Criar tabelas `checklist_templates` e `checklist_template_items`
- [ ] Migration inicial com templates padrão
- [ ] API de gerenciamento de templates (admin)
- [ ] Atualizar checklist para usar templates
- [ ] Versionamento e migração de templates
- [ ] UI de gerenciamento de templates

**Estimativa:** 5 sprints  
**Benefício:** Alta flexibilidade, manutenibilidade

---

### 12. Auditoria Completa ❌ 0%

**Status:** NÃO INICIADO  
**Prioridade:** MÉDIA

**Objetivo:** Rastreamento completo de alterações.

**Tarefas:**

- [ ] Adicionar `created_by`, `updated_by` a todas as tabelas
- [ ] Criar tabela de histórico `checklist_audit_log`
- [ ] Trigger de auditoria automática
- [ ] API de consulta de histórico
- [ ] UI de visualização de histórico

**Estimativa:** 3 sprints

---

## 📈 Métricas de Progresso

| Categoria              | Progresso | Status |
| ---------------------- | --------- | ------ |
| Isolamento e Segurança | 100%      | ✅     |
| Modelo de Dados        | 70%       | 🟡     |
| APIs                   | 60%       | 🟡     |
| Frontend               | 80%       | 🟡     |
| Documentação           | 80%       | 🟡     |
| Testes                 | 30%       | ❌     |
| **GERAL**              | **60%**   | 🟡     |

---

## 🎯 Roadmap

### Q4 2025 (Atual)

- ✅ Isolamento por parceiro
- ✅ Múltiplas evidências
- ✅ Fix constraints
- ✅ Timeline deduplicada
- 🟡 Documentação completa
- 🟡 Normalização de categorias

### Q1 2026

- Normalização de contexto (`context_type`, `context_id`)
- Sistema de templates (MVP)
- Auditoria básica
- Testes E2E completos

### Q2 2026

- Templates avançados (versionamento)
- Renomeação de tabelas (v2.0)
- API v2 padronizada
- Multi-tenancy (se necessário)

---

## 🚧 Bloqueios e Riscos

### Bloqueios Atuais

Nenhum bloqueio crítico no momento.

### Riscos Identificados

1. **Normalização de Contexto** (ALTO)
   - Breaking change que afeta todas as queries
   - Requer coordenação de deploy
   - Risco de perda de dados se backfill falhar
   - **Mitigação:** Manter ambos campos durante transição

2. **Renomeação de Tabelas** (MUITO ALTO)
   - Breaking change massivo
   - Afeta todo o código
   - Pode impactar integrações externas
   - **Mitigação:** Views de compatibilidade, deploy gradual

3. **Compatibilidade com Inspection ID** (MÉDIO)
   - Especialistas ainda usam `inspection_id`
   - Dificulta limpeza de código legado
   - **Mitigação:** Manter suporte até migração completa

---

## 📝 Decisões Arquiteturais (ADRs)

Decisões importantes tomadas durante a migração:

### ADR-001: Manter Inspection ID e Quote ID Simultaneamente

**Data:** 13 de Outubro de 2025  
**Status:** Aceito  
**Contexto:** Parceiros usam `quote_id`, especialistas usam `inspection_id`.  
**Decisão:** Manter ambos campos até normalização completa.  
**Consequências:** Código mais complexo, mas zero breaking changes.

### ADR-002: Adiar Renomeação de Tabelas

**Data:** 14 de Outubro de 2025  
**Status:** Aceito  
**Contexto:** Renomear `mechanics_*` → `partner_checklist*` é muito invasivo.  
**Decisão:** Adiar para versão 2.0, usar views de compatibilidade.  
**Consequências:** Nomes subótimos, mas estabilidade garantida.

### ADR-003: Remover Constraint Única de Evidências

**Data:** 14 de Outubro de 2025  
**Status:** Aceito  
**Contexto:** Usuários querem múltiplas fotos por item.  
**Decisão:** Remover `UNIQUE (inspection_id, item_key)`.  
**Consequências:** Permite múltiplas evidências, sem side effects.

### ADR-004: Timeline Criada Apenas em Submit

**Data:** 14 de Outubro de 2025  
**Status:** Aceito  
**Contexto:** Duplicatas apareciam ao abrir checklist.  
**Decisão:** Timeline criada apenas em `/submit`, não em `/init`.  
**Consequências:** Apenas uma entrada por status, comportamento correto.

---

## 📊 KPIs de Migração

| Métrica             | Atual | Meta   | Status |
| ------------------- | ----- | ------ | ------ |
| Cobertura de testes | 30%   | 80%    | ❌     |
| APIs atualizadas    | 60%   | 100%   | 🟡     |
| Documentação        | 80%   | 100%   | 🟡     |
| Breaking changes    | 0     | 0      | ✅     |
| Performance P95     | 250ms | <300ms | ✅     |
| Erros em produção   | 0.1%  | <1%    | ✅     |

---

## 🔄 Processo de Migração

### Princípios

1. **Zero Downtime** - Nenhuma migração pode causar indisponibilidade
2. **Backward Compatible** - Manter compatibilidade durante transição
3. **Gradual** - Migrações pequenas e incrementais
4. **Reversível** - Sempre ter rollback plan
5. **Testado** - Testar em staging antes de produção

### Checklist por Migration

- [ ] Migration escrita e revisada
- [ ] Testada localmente
- [ ] Testada em staging
- [ ] Rollback plan documentado
- [ ] Deploy em produção
- [ ] Monitoramento pós-deploy
- [ ] Documentação atualizada

---

## 📚 Recursos

- **Documentação alvo:** `@docs/`
- **Estado atual:** `@docs/as-is/CURRENT_STATE.md`
- **Análise de gaps:** `/docs/DOCUMENTATION_REALITY_GAP_ANALYSIS.md`
- **Migrations:** `supabase/migrations/`
- **Correções recentes:** `/docs/FIX_*.md`

---

## 👥 Equipe

**Tech Lead:** [A definir]  
**Backend:** [A definir]  
**Frontend:** [A definir]  
**QA:** [A definir]

---

**Próxima revisão:** 21 de Outubro de 2025  
**Frequência de atualização:** Semanal
