# Plano de Refatoração - Domínio Partner (DRY, SOLID, Clean Architecture)

**Data:** 09/10/2025  
**Branch Base:** `refactor/partner-security-fixes`  
**Status:** 📋 Planejamento

## 🎯 Objetivo

Eliminar duplicações, inconsistências e violações de princípios DRY/SOLID no domínio Partner, melhorando manutenibilidade, testabilidade e aderência aos padrões do projeto.

---

## 📊 Análise de Problemas Identificados

### 🔴 Crítico (P0) - Bloqueia desenvolvimento seguro

1. **Duplicação de Error Handlers** (3 implementações diferentes)
   - `app/api/partner/services/v2/lib/error-handler.ts` (completo, bem estruturado)
   - `app/api/partner/services/v2/[serviceId]/route.ts` (reimplementação local)
   - `@/lib/utils/apiErrorHandlers` (legacy, usado em endpoints antigos)
   - **Impacto:** Comportamento inconsistente, dificulta manutenção, viola DRY
   - **Arquivos afetados:** ~15 endpoints

2. **Schemas Zod Duplicados**
   - `UpdateServiceSchema` existe em:
     - `/v2/lib/schemas.ts` (✅ correto, centralizado)
     - `/v2/[serviceId]/route.ts` (❌ duplicado)
   - **Impacto:** Validações divergentes, manutenção dupla

3. **Arquivos Backup em Produção**
   - `app/api/partner/budgets/route.ts.backup`
   - `app/api/(admin)/(collections)/admin/propose-collection-date/route.ts.backup`
   - **Impacto:** Confusão, sujeira no repositório

### 🟡 Alto (P1) - Afeta consistência arquitetural

4. **Inconsistência de Infraestrutura Supabase**
   - `SupabaseService.getInstance().getAdminClient()` (✅ padrão atual)
   - `supabase` direto de `@/modules/common/services/supabaseClient` (❌ usado em BudgetService)
   - **Impacto:** Viola Dependency Injection, dificulta testes, inconsistência

5. **BudgetService com Mistura de Responsabilidades**
   - Chama `supabase.auth.getUser()` internamente (6 vezes)
   - **Impacto:** Viola SRP, dificulta testes unitários, coupling alto
   - **Arquivo:** `modules/partner/services/BudgetService.ts`

6. **Endpoints Duplicados/Concorrentes**
   - **V2 (novo):** `/api/partner/services/v2/**` ✅
   - **Legacy (antigo):** 
     - `/api/partner/services/**` ❌
     - `/api/partner/list-services` ❌
   - **Hooks ainda usam legacy:** `usePartnerServices` aponta para rotas antigas
   - **Impacto:** Divergência funcional, confusão, manutenção dupla

### 🟢 Médio (P2) - Melhorias de qualidade

7. **Constantes Mágicas - Checklist**
   - `itemDefs` duplicado em:
     - `app/api/partner/checklist/submit/route.ts`
     - Derivado/normalizado em `modules/partner/services/ChecklistService.ts`
   - Chaves como `motor`, `transmissão`, etc. espalhadas
   - **Impacto:** Manutenção duplicada, risco de divergência

8. **Nomenclatura Ambígua - Budget vs Quote**
   - Endpoints usam "budget" mas tabela é `quotes`
   - Alterna entre termos sem padrão claro
   - **Impacto:** Confusão conceitual, curva de aprendizado

9. **Strings Mágicas** (tabelas, buckets, categorias)
   - Nomes de tabelas hardcoded em múltiplos locais
   - `'vehicle-media'` bucket repetido ~20 vezes
   - **Impacto:** Refactoring arriscado, typos silenciosos

---

## 🚀 Plano de Execução (5 Fases)

### **Fase 1: Unificação de Error Handling e Schemas** (P0)
**Tempo estimado:** 2-3 horas  
**Branch:** `refactor/partner-dry-error-handling`

#### Checklist:
- [ ] 1.1. Criar `modules/common/http/errorHandlers.ts` (versão unificada)
  - Mover lógica de `/v2/lib/error-handler.ts` para módulo comum
  - Adicionar JSDoc completo
  - Exportar tipos `ApiErrorResponse`, `ErrorMapping`
  
- [ ] 1.2. Atualizar `/v2/[serviceId]/route.ts`
  - Remover funções locais `handleServiceResult`, etc
  - Importar de `modules/common/http/errorHandlers`
  - Remover schema duplicado `UpdateServiceSchema`
  - Importar de `v2/lib/schemas`
  
- [ ] 1.3. Atualizar endpoints legacy para usar handler unificado
  - `/api/partner/services/route.ts`
  - `/api/partner/list-services/route.ts`
  - `/api/partner/services/[serviceId]/route.ts` (antigo)
  
- [ ] 1.4. Deprecar `@/lib/utils/apiErrorHandlers` (adicionar JSDoc @deprecated)

- [ ] 1.5. Verificação
  - Build passa ✅
  - Testes de erro consistentes
  - Commit: `refactor(partner): unifica error handling em módulo comum`

---

### **Fase 2: Padronização de Infraestrutura Supabase** (P1)
**Tempo estimado:** 2-3 horas  
**Branch:** `refactor/partner-supabase-di`

#### Checklist:
- [ ] 2.1. Refatorar `BudgetService.ts`
  - Remover import direto de `supabaseClient`
  - Usar `SupabaseService.getInstance().getAdminClient()`
  - Remover todas chamadas `supabase.auth.getUser()` (6x)
  - Adicionar parâmetro `partnerId: string` em todos os métodos
  - Atualizar JSDoc com padrão DI
  
- [ ] 2.2. Atualizar endpoints que usam BudgetService
  - `/api/partner/budgets/route.ts`
  - `/api/partner/budgets/[budgetId]/route.ts`
  - Extrair `partnerId` do `req.user.id` antes de chamar service
  - Passar como parâmetro explícito
  
- [ ] 2.3. Verificar outros services com mesmo problema
  - `grep -r "supabaseClient" modules/partner/`
  - Corrigir inconsistências encontradas
  
- [ ] 2.4. Verificação
  - Build passa ✅
  - Testes unitários de BudgetService funcionam com mock
  - Commit: `refactor(partner): padroniza acesso Supabase via DI`

---

### **Fase 3: Migração de Endpoints Legacy para V2** (P1)
**Tempo estimado:** 3-4 horas  
**Branch:** `refactor/partner-endpoints-v2-migration`

#### Checklist:
- [ ] 3.1. Atualizar hooks para usar V2
  - Localizar `usePartnerServices` e similares
  - Trocar URLs: `/api/partner/list-services` → `/api/partner/services/v2`
  - Trocar URLs: `/api/partner/services/${id}` → `/api/partner/services/v2/${id}`
  - Atualizar tipos se necessário
  
- [ ] 3.2. Testar compatibilidade
  - Verificar UI do dashboard partner
  - Testar CRUD completo de services
  - Validar comportamento idêntico
  
- [ ] 3.3. Adicionar avisos de depreciação nos endpoints legacy
  - Header `X-Deprecated: true` na resposta
  - Log de warning ao chamar endpoint antigo
  - JSDoc com `@deprecated` e link para v2
  
- [ ] 3.4. Criar issue para remoção futura (após 2 sprints)
  - Documentar endpoints a remover
  - Data estimada de remoção
  
- [ ] 3.5. Verificação
  - Dashboard partner funciona 100% ✅
  - Logs mostram uso apenas de V2
  - Commit: `refactor(partner): migra hooks para endpoints v2`

---

### **Fase 4: Centralização de Constantes** (P2)
**Tempo estimado:** 2 horas  
**Branch:** `refactor/partner-constants`

#### Checklist:
- [ ] 4.1. Criar `modules/partner/checklist/constants.ts`
  - Extrair `CHECKLIST_ITEM_KEYS` (motor, transmissão, etc.)
  - Extrair `EVIDENCE_KEYS` (já existe no hook, centralizar)
  - Criar enum ou const object com todas as chaves
  - Adicionar JSDoc explicativo
  
- [ ] 4.2. Atualizar `ChecklistService.ts`
  - Importar constantes de `constants.ts`
  - Remover definições locais
  - Atualizar referências
  
- [ ] 4.3. Atualizar `/checklist/submit/route.ts`
  - Remover `itemDefs` local
  - Importar de `constants.ts`
  
- [ ] 4.4. Atualizar hooks do frontend
  - Importar constantes compartilhadas
  - Garantir consistência
  
- [ ] 4.5. Criar `modules/common/constants/database.ts`
  - Extrair nomes de tabelas: `TABLES = { QUOTES: 'quotes', ... }`
  - Extrair nomes de buckets: `BUCKETS = { VEHICLE_MEDIA: 'vehicle-media', ... }`
  - Exportar como const object
  
- [ ] 4.6. Substituir strings mágicas (~50 ocorrências)
  - Buscar: `grep -r "'vehicle-media'" app/api/partner/`
  - Substituir por: `BUCKETS.VEHICLE_MEDIA`
  - Fazer para todas as tabelas/buckets
  
- [ ] 4.7. Verificação
  - Build passa ✅
  - Grep não encontra strings mágicas
  - Commit: `refactor(partner): centraliza constantes de checklist e database`

---

### **Fase 5: Padronização de Nomenclatura e Limpeza** (P2)
**Tempo estimado:** 1-2 horas  
**Branch:** `refactor/partner-cleanup`

#### Checklist:
- [ ] 5.1. Remover arquivos backup
  ```bash
  git rm app/api/partner/budgets/route.ts.backup
  git rm app/api/(admin)/(collections)/admin/propose-collection-date/route.ts.backup
  ```
  
- [ ] 5.2. Criar decisão arquitetural sobre Budget vs Quote
  - Opção A: Padronizar tudo para "budget" (renomear tabela `quotes`)
  - Opção B: Padronizar tudo para "quote" (renomear rotas/services)
  - Opção C: Manter híbrido mas documentar claramente
  - **Recomendação:** Opção C (menos breaking changes) + doc
  
- [ ] 5.3. Documentar decisão em `docs/partner/BUDGET_QUOTE_TERMINOLOGY.md`
  - Explicar: "Budget" é termo de UI/negócio
  - Explicar: "Quote" é termo de database/backend
  - Mapa de equivalências
  - Convenção: endpoints usam "budget", queries usam "quote"
  
- [ ] 5.4. Adicionar comentários nos endpoints ambíguos
  ```typescript
  /**
   * Budget API
   * Note: Internamente usa tabela 'quotes' do banco de dados.
   * Ver docs/partner/BUDGET_QUOTE_TERMINOLOGY.md
   */
  ```
  
- [ ] 5.5. Atualizar README do módulo partner
  - Adicionar seção "Convenções de Nomenclatura"
  - Link para documentação de terminologia
  
- [ ] 5.6. Verificação
  - Build passa ✅
  - Documentação clara e acessível
  - Commit: `refactor(partner): padroniza nomenclatura e remove arquivos residuais`

---

## 📈 Métricas de Sucesso

### Antes da Refatoração
- ❌ 3 implementações de error handler
- ❌ 2 definições de `UpdateServiceSchema`
- ❌ 2 formas de acessar Supabase (inconsistência)
- ❌ 6 violações de SRP em BudgetService
- ❌ 2 conjuntos de endpoints concorrentes (v2 + legacy)
- ❌ ~50+ strings mágicas espalhadas
- ❌ 2 arquivos `.backup` em produção
- ❌ Nomenclatura ambígua sem documentação

### Depois da Refatoração
- ✅ 1 handler centralizado em `modules/common/http/`
- ✅ 1 fonte única de schemas em `v2/lib/schemas.ts`
- ✅ 1 forma padronizada via `SupabaseService` (DI)
- ✅ BudgetService com SRP: recebe `partnerId` como parâmetro
- ✅ Endpoints legacy deprecados, hooks migrados para v2
- ✅ Constantes centralizadas em `constants.ts`
- ✅ Repositório limpo, sem backups
- ✅ Documentação clara sobre Budget/Quote

### KPIs Esperados
- **Redução de duplicação:** -70% (3→1 handlers, schemas consolidados)
- **Cobertura de testes:** +30% (DI facilita mocks)
- **Manutenibilidade:** +50% (constantes únicas, padrão claro)
- **Onboarding:** -40% tempo (documentação consistente)

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking changes em produção | Baixa | Alto | Manter compatibilidade com deprecation period |
| Endpoints legacy ainda em uso | Média | Médio | Logs + headers deprecation, remover só após 2 sprints |
| Renomear Budget/Quote causa confusão | Alta | Baixo | Optar por Opção C (documentar, não renomear) |
| Testes falhando após DI | Média | Médio | Criar mocks antes, testar incrementalmente |

---

## 📅 Timeline Estimado

| Fase | Duração | Data Início | Data Fim |
|------|---------|-------------|----------|
| Fase 1 | 2-3h | 09/10 14:00 | 09/10 17:00 |
| Fase 2 | 2-3h | 09/10 17:00 | 09/10 20:00 |
| Fase 3 | 3-4h | 10/10 09:00 | 10/10 13:00 |
| Fase 4 | 2h   | 10/10 14:00 | 10/10 16:00 |
| Fase 5 | 1-2h | 10/10 16:00 | 10/10 18:00 |
| **Total** | **10-14h** | **09/10** | **10/10** |

---

## 🔄 Próximas Ações

1. ✅ Revisar este documento
2. ⏳ Aprovar plano (aguardando confirmação)
3. ⏳ Executar Fase 1 (começar por error handlers)
4. ⏳ PR incremental após cada fase (ou ao final)
5. ⏳ Atualizar documentação de arquitetura

---

## 📚 Referências

- `docs/DEVELOPMENT_INSTRUCTIONS.md` - Princípios do projeto
- `docs/partner-services-architecture.md` - Arquitetura atual
- `/modules/partner/domain/**` - DDD implementation
- Princípios: DRY, SOLID, Clean Architecture, Composition Pattern

---

**Autor:** GitHub Copilot + Rafael  
**Revisão:** Pendente  
**Status:** 📋 Aguardando aprovação para executar
