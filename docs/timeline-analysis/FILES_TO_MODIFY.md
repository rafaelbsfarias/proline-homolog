# 📂 Arquivos que Serão Modificados - Roadmap Timeline

**Data:** 08/10/2025  
**Fase:** 0 - Preparação

---

## 🎯 OBJETIVO

Documentar todos os arquivos que serão modificados durante a execução do roadmap, organizados por fase.

---

## FASE 0: PREPARAÇÃO E DIAGNÓSTICO

### **Etapa 0.1: Diagnóstico SQL**
**Arquivos Criados:**
- ✅ `/scripts/diagnose-vehicle-history-trigger-supabase.sql`
- ⏳ `/docs/timeline-analysis/diagnostics/diagnostic-results-2025-10-08.md` (após execução)

**Arquivos Modificados:**
- Nenhum

---

### **Etapa 0.2: Backup e Documentação**
**Branches Criados:**
- ✅ `feat/roadmap-fase-0-preparacao`
- ⏳ `backup/before-refactoring-2025-10-08` (será criado)

**Arquivos Criados:**
- ✅ `/docs/timeline-analysis/PROGRESS.md`
- ✅ `/docs/timeline-analysis/diagnostics/` (pasta)
- ✅ Este arquivo (`FILES_TO_MODIFY.md`)

---

## FASE 1: CORREÇÕES CRÍTICAS

### **Etapa 1.1: Padronizar Formato de Status**
**Arquivos Modificados:**
- ⏳ `/modules/vehicles/constants/vehicleStatus.ts`
  - Linha ~6: `ANALISE_FINALIZADA: 'ANALISE FINALIZADA'`
  - Mudar para: `ANALISE_FINALIZADA: 'ANÁLISE FINALIZADA'`

**Migrations Criados:**
- ⏳ `/supabase/migrations/20251008_fix_status_format.sql` (novo)

**Impacto Estimado:**
- 1 arquivo TypeScript modificado
- 1 migration SQL criado
- ~200 registros no banco afetados (estimativa)

---

### **Etapa 1.2: Verificar e Corrigir Trigger**
**Migrations Criados:**
- ⏳ `/supabase/migrations/20251008_verify_trigger.sql` (novo)

**Impacto:**
- Apenas verificação e teste
- Nenhum código TypeScript modificado

---

### **Etapa 1.3: Criar Constants Centralizadas**
**Arquivos Modificados:**
- ⏳ `/modules/vehicles/constants/vehicleStatus.ts`
  - Adicionar: tipos, helpers de validação

**Arquivos Criados:**
- ⏳ `/modules/vehicles/types/vehicleStatus.types.ts` (novo)
  - STATUS_TRANSITIONS map
  - Helpers: canTransition, getNextStatuses

**Impacto:**
- 1 arquivo modificado
- 1 arquivo novo
- Base para refactorings futuros

---

## FASE 2: PADRONIZAÇÃO E LIMPEZA

### **Etapa 2.1: Extrair Funções de Validação**
**Arquivos Criados:**
- ⏳ `/modules/vehicles/validators/vehicleValidators.ts` (novo)

**Arquivos Modificados:**
- ⏳ `/app/api/specialist/start-analysis/route.ts`
- ⏳ `/app/api/specialist/finalize-checklist/route.ts`
- ⏳ `/app/api/partner/checklist/init/route.ts`

**Impacto:**
- 1 arquivo novo
- 3 endpoints modificados
- ~50 linhas de código extraídas

---

### **Etapa 2.2: Padronizar Error Handling**
**Arquivos Criados:**
- ⏳ `/modules/common/errors/ApiError.ts` (novo)
- ⏳ `/modules/common/middleware/errorHandler.ts` (novo)

**Arquivos Modificados:**
- ⏳ Todos os endpoints de API (gradualmente)
  - `/app/api/specialist/*`
  - `/app/api/partner/*`

**Impacto:**
- 2 arquivos novos
- ~10 endpoints modificados
- Error handling consistente

---

### **Etapa 2.3: Padronizar Logging**
**Arquivos Modificados:**
- ⏳ Todos os endpoints de API (revisar e padronizar)

**Impacto:**
- ~10 endpoints modificados
- Apenas adição de logs, sem mudança de lógica

---

## FASE 3: REFACTORING MODULAR

### **Etapa 3.1: Criar VehicleStatusService**
**Arquivos Criados:**
- ⏳ `/modules/vehicles/services/VehicleStatusService.ts` (novo)
- ⏳ `/modules/vehicles/services/index.ts` (novo)

**Impacto:**
- 2 arquivos novos
- ~200 linhas de código de serviço
- Nenhuma modificação em endpoints ainda

---

### **Etapa 3.2: Refatorar start-analysis**
**Arquivos Modificados:**
- ⏳ `/app/api/specialist/start-analysis/route.ts`
  - Redução: ~30 linhas → ~15 linhas

**Impacto:**
- 1 endpoint refatorado
- Usa VehicleStatusService
- Testes manuais necessários

---

### **Etapa 3.3: Refatorar finalize-checklist**
**Arquivos Modificados:**
- ⏳ `/app/api/specialist/finalize-checklist/route.ts`
  - Redução: ~100 linhas → ~40 linhas

**Impacto:**
- 1 endpoint refatorado
- Testes extensivos necessários (criar service_order, quote)

---

### **Etapa 3.4: Refatorar checklist/init**
**Arquivos Modificados:**
- ⏳ `/app/api/partner/checklist/init/route.ts`
  - Remove insert manual em vehicle_history
  - Usa VehicleStatusService

**Impacto:**
- 1 endpoint refatorado
- ⚠️ **ATENÇÃO:** Depende de trigger funcionando

---

### **Etapa 3.5: Refatorar save-vehicle-checklist**
**Arquivos Modificados:**
- ⏳ `/app/api/partner/save-vehicle-checklist/route.ts`
  - Redução: ~260 linhas → ~100 linhas (50-60% redução)

**Arquivos Criados (opcional):**
- ⏳ `/modules/partner/services/ChecklistService.ts`

**Impacto:**
- 1 endpoint refatorado (o mais complexo)
- Funções auxiliares extraídas
- Testes muito extensivos necessários

---

## FASE 4: ARQUITETURA E SERVIÇOS

### **Etapa 4.1: Criar Repository Layer**
**Arquivos Criados:**
- ⏳ `/modules/vehicles/repositories/VehicleRepository.ts`
- ⏳ `/modules/vehicles/repositories/VehicleHistoryRepository.ts`
- ⏳ `/modules/vehicles/repositories/index.ts`

**Impacto:**
- 3 arquivos novos
- ~300 linhas de código
- Abstração de acesso ao banco

---

### **Etapa 4.2: Migrar VehicleStatusService para Usar Repository**
**Arquivos Modificados:**
- ⏳ `/modules/vehicles/services/VehicleStatusService.ts`
  - Injeta repositories ao invés de Supabase

**Impacto:**
- 1 arquivo modificado
- Endpoints precisam atualizar injeção de dependências

---

### **Etapa 4.3: Criar Value Objects (Opcional)**
**Arquivos Criados:**
- ⏳ `/modules/vehicles/domain/VehicleId.ts`
- ⏳ `/modules/vehicles/domain/VehicleStatus.ts`

**Impacto:**
- 2 arquivos novos (opcionais)
- Adoção gradual

---

## FASE 5: QUALIDADE E TESTES

### **Etapa 5.1: Adicionar Testes Unitários**
**Arquivos Criados:**
- ⏳ `/modules/vehicles/services/__tests__/VehicleStatusService.test.ts`
- ⏳ `/modules/vehicles/validators/__tests__/vehicleValidators.test.ts`
- ⏳ `/modules/vehicles/repositories/__tests__/VehicleRepository.test.ts`

**Impacto:**
- ~5 arquivos de teste novos
- Cobertura de ~80%

---

### **Etapa 5.2: Documentação de API**
**Arquivos Criados:**
- ⏳ `/docs/api/openapi.yaml`
- ⏳ `/app/api/docs/route.ts`

**Impacto:**
- Swagger UI disponível
- Documentação automática

---

### **Etapa 5.3: Code Review Final**
**Impacto:**
- Revisão de todos os arquivos modificados
- Ajustes finais
- Atualização de documentação

---

## 📊 RESUMO ESTATÍSTICO

### **Por Tipo:**
- **Arquivos Novos:** ~25 arquivos
- **Arquivos Modificados:** ~15 arquivos
- **Migrations SQL:** ~2 migrations
- **Branches:** ~10 branches (um por etapa crítica)

### **Por Linguagem:**
- **TypeScript:** ~90% dos arquivos
- **SQL:** ~10% (migrations)
- **YAML:** 1 arquivo (OpenAPI)

### **Complexidade:**
- **Simples (< 50 linhas):** ~10 arquivos
- **Média (50-200 linhas):** ~20 arquivos
- **Complexa (> 200 linhas):** ~5 arquivos

---

## 🔍 ARQUIVOS CRÍTICOS

### **Top 5 Mais Impactantes:**

1. **`/app/api/partner/save-vehicle-checklist/route.ts`**
   - Redução: 260 → 100 linhas
   - Risco: 🟡 Médio
   - Testes: Extensivos necessários

2. **`/modules/vehicles/services/VehicleStatusService.ts`**
   - Novo serviço central
   - Risco: 🟡 Médio
   - Impacto: Todo o sistema

3. **`/modules/vehicles/constants/vehicleStatus.ts`**
   - Mudança de formato
   - Risco: 🟡 Médio
   - Impacto: Trigger e queries

4. **`/app/api/specialist/finalize-checklist/route.ts`**
   - Redução: 100 → 40 linhas
   - Risco: 🟡 Médio
   - Testes: Criar service_order e quote

5. **`/modules/vehicles/repositories/VehicleRepository.ts`**
   - Nova camada de abstração
   - Risco: 🟢 Baixo
   - Impacto: Futuro refactoring

---

## ✅ CHECKLIST DE BACKUP

Antes de modificar arquivos críticos:
- [ ] Criar branch de backup: `backup/before-refactoring-2025-10-08`
- [ ] Push da branch de backup
- [ ] Documentar estado atual em `PROGRESS.md`
- [ ] Salvar dumps do banco (se necessário)

---

**Criado em:** 08/10/2025  
**Atualizado em:** 08/10/2025  
**Versão:** 1.0
