# 🔧 Refatoração de Código Duplicado - Parceiro

## 📊 Análise JSCPD

**Comando executado:**
```bash
npx jscpd --min-lines 5 app/ modules/ lib/
```

**Total de duplicações encontradas:** ~530 linhas duplicadas

---

## ✅ RESOLVIDO (Commit 3ff74b1)

### 1️⃣ **Arquivos 100% Duplicados** ❌ REMOVIDOS

#### schemas.ts e mappers.ts
- **Localização:** `app/api/partner/services/v2/`
- **Problema:** 2 arquivos idênticos (166 linhas total)
  - `schemas.ts` (81 linhas) - 100% igual a `v2/lib/schemas.ts`
  - `mappers.ts` (85 linhas) - 100% igual a `v2/lib/mappers.ts`

**Solução:**
```bash
# Removidos arquivos duplicados
rm app/api/partner/services/v2/schemas.ts
rm app/api/partner/services/v2/mappers.ts

# Mantida versão canônica em v2/lib/
```

**Benefícios:**
- ✅ Fonte única de verdade
- ✅ -166 linhas de código
- ✅ Manutenção simplificada

---

### 2️⃣ **Endpoints vehicle-history** 🔄 REFATORADOS

#### Duplicação: partner vs specialist (95 linhas)

**Antes:**
```typescript
// app/api/partner/vehicle-history/route.ts (95 linhas)
// app/api/specialist/vehicle-history/route.ts (90 linhas)
// Código 85% idêntico
```

**Solução Criada:**
```typescript
// modules/vehicles/utils/vehicleHistoryHelpers.ts (95 linhas)

export function validateVehicleId(vehicleId: string | null): NextResponse | null;

export async function fetchVehicleHistory(options: VehicleHistoryOptions): Promise<NextResponse>;
```

**Após Refatoração:**
```typescript
// app/api/partner/vehicle-history/route.ts (60 linhas) ✅ -35 linhas
export const GET = withPartnerAuth(async (req) => {
  // Validação específica de partner
  const validationError = validateVehicleId(vehicleId);
  if (validationError) return validationError;
  
  // Lógica compartilhada
  return fetchVehicleHistory({ supabase, vehicleId, logger, context: 'partner' });
});

// app/api/specialist/vehicle-history/route.ts (30 linhas) ✅ -60 linhas
export const GET = withSpecialistAuth(async (req) => {
  const validationError = validateVehicleId(vehicleId);
  if (validationError) return validationError;
  
  return fetchVehicleHistory({ supabase, vehicleId, logger, context: 'specialist' });
});
```

**Benefícios:**
- ✅ DRY (Don't Repeat Yourself)
- ✅ Lógica padronizada entre roles
- ✅ Fácil adicionar admin/client
- ✅ Logs consistentes
- ✅ -95 linhas duplicadas

---

## 📈 Resumo de Impacto

| Item | Antes | Depois | Redução |
|------|-------|--------|---------|
| **Arquivos duplicados** | 2 (166 linhas) | 0 | -166 linhas |
| **Endpoints duplicados** | 2 (185 linhas) | 2 (90 linhas) | -95 linhas |
| **Helper criado** | 0 | 1 (95 linhas) | +95 linhas |
| **Total líquido** | 351 linhas | 185 linhas | **-166 linhas (-47%)** |

---

## ⏳ PENDENTE (Menor Prioridade)

### 3️⃣ **EditServiceModal** (Autoduplicação)

**Localização:** `modules/partner/components/services/EditServiceModal.tsx`

**Duplicações internas:**
- Linhas 196-222 vs 156-182 (26 linhas)
- Linhas 229-263 vs 148-182 (34 linhas)
- Linhas 268-287 vs 148-167 (19 linhas)

**Total:** ~79 linhas duplicadas dentro do mesmo arquivo

**Causa:** Lógica de formulário repetida

**Solução Sugerida:**
```typescript
// Extrair para hooks customizados
const useServiceForm = () => { /* lógica comum */ };
const useServiceValidation = () => { /* validação comum */ };
```

**Impacto:** 🟡 Médio (apenas 1 arquivo)

---

### 4️⃣ **BudgetActions vs BudgetSummary**

**Localização:**
- `modules/partner/components/budget/BudgetActions.tsx` (linhas 28-68)
- `modules/partner/components/budget/BudgetSummary.tsx` (linhas 375-415)

**Duplicação:** 40 linhas (327 tokens)

**Causa:** Lógica de ações de orçamento repetida

**Solução Sugerida:**
```typescript
// modules/partner/components/budget/shared/useBudgetActions.ts
export const useBudgetActions = (budget: Budget) => {
  // Lógica compartilhada
};
```

**Impacto:** 🟡 Médio

---

### 5️⃣ **BudgetService** (Autoduplicação)

**Localização:** `modules/partner/services/BudgetService.ts`

**Duplicações internas:**
- Linhas 225-246 vs 149-170 (21 linhas)
- Linhas 413-429 vs 351-367 (16 linhas)

**Total:** ~37 linhas

**Causa:** Lógica de transformação repetida

**Solução Sugerida:**
```typescript
// Extrair para métodos privados
private transformBudgetData() { /* ... */ }
private validateBudgetItems() { /* ... */ }
```

**Impacto:** 🟢 Baixo (refatoração simples)

---

### 6️⃣ **Partner vs Specialist Checklist Pages**

**Localização:**
- `app/dashboard/partner/checklist/page.tsx`
- `app/dashboard/specialist/checklist/page.tsx`

**Duplicações:**
- Linhas 35-182 (147 linhas) - Layout e estrutura
- Linhas 274-369 vs 343-437 (95 linhas) - Renderização

**Total:** ~242 linhas duplicadas

**Causa:** Páginas muito similares, apenas hooks diferentes

**Solução Sugerida:**
```typescript
// modules/common/components/ChecklistPage.tsx
export const ChecklistPage = ({ role, hook }: ChecklistPageProps) => {
  const checklist = hook(); // usePartnerChecklist ou useSpecialistChecklist
  // Renderização compartilhada
};

// app/dashboard/partner/checklist/page.tsx
export default () => (
  <ChecklistPage role="partner" hook={usePartnerChecklist} />
);
```

**Impacto:** 🔴 Alto (mais complexo, afeta 2 páginas)

---

### 7️⃣ **API Routes** (Menor)

**Duplicações pequenas:**
- `app/api/partner/services/v2/[serviceId]/route.ts`
  - Linhas 111-128 vs 61-78 (17 linhas)
  - Linhas 158-176 vs 61-79 (18 linhas)

**Solução:** Extrair para helper de validação

**Impacto:** 🟢 Baixo (35 linhas total)

---

## 🎯 Priorização Recomendada

### **Fase 1: Concluída** ✅
- [x] Arquivos 100% duplicados (schemas, mappers)
- [x] Endpoints vehicle-history

**Resultado:** -166 linhas (-47%)

---

### **Fase 2: Próximos Passos** (Opcional)

**Ordem sugerida:**

1. **BudgetService** (🟢 Baixo esforço, 37 linhas)
   - Tempo estimado: 30 min
   - Risco: Baixo
   - Benefício: Código mais limpo

2. **BudgetActions/Summary** (🟡 Médio esforço, 40 linhas)
   - Tempo estimado: 1h
   - Risco: Médio
   - Benefício: Hook reutilizável

3. **EditServiceModal** (🟡 Médio esforço, 79 linhas)
   - Tempo estimado: 1-2h
   - Risco: Médio
   - Benefício: Componente mais manutenível

4. **Checklist Pages** (🔴 Alto esforço, 242 linhas)
   - Tempo estimado: 3-4h
   - Risco: Alto (2 páginas, muitos testes)
   - Benefício: Grande redução de duplicação

**Total Fase 2:** ~398 linhas, 6-8 horas de trabalho

---

## 📝 Decisão de Não Refatorar (Por enquanto)

### **Motivos para adiar Fase 2:**

1. **ROI Decrescente**
   - Fase 1: 47% redução com 2h trabalho (✅ excelente)
   - Fase 2: 20% redução adicional com 8h trabalho (⚠️ baixo ROI)

2. **Risco vs Benefício**
   - Checklist pages são críticas para o negócio
   - Refatoração pode introduzir bugs
   - Testes extensos necessários

3. **Prioridades do Projeto**
   - Features novas > Refatoração
   - Timeline de entrega

4. **Código Funcional**
   - Duplicação restante não causa bugs
   - Manutenção ainda é viável

### **Quando Revisitar:**

- ✅ Durante sprint de refatoração dedicada
- ✅ Ao adicionar novos roles (ex: admin checklist)
- ✅ Se bugs recorrentes em código duplicado
- ✅ Antes de escalar time (onboarding)

---

## 🔄 Como Continuar (Se necessário)

### Rodar análise novamente:
```bash
npm run jscpd
# ou
npx jscpd --min-lines 5 app/ modules/ lib/ --reporters html,console

# Abrir relatório
open reports/jscpd/html/index.html
```

### Verificar específico:
```bash
# Apenas components
npx jscpd modules/*/components/ --min-lines 10

# Apenas services
npx jscpd modules/*/services/ --min-lines 15

# Apenas pages
npx jscpd app/dashboard/ --min-lines 20
```

---

## 📚 Referências

- **Commit:** 3ff74b1
- **Branch:** aprovacao-orcamento-pelo-admin
- **Análise:** jscpd v4.0.5
- **Data:** 2025-10-09

### Arquivos Criados:
- `modules/vehicles/utils/vehicleHistoryHelpers.ts` (95 linhas)

### Arquivos Removidos:
- `app/api/partner/services/v2/schemas.ts` (81 linhas)
- `app/api/partner/services/v2/mappers.ts` (85 linhas)

### Arquivos Refatorados:
- `app/api/partner/vehicle-history/route.ts` (-35 linhas)
- `app/api/specialist/vehicle-history/route.ts` (-60 linhas)

---

**Status:** ✅ **Fase 1 Completa - Duplicações Críticas Resolvidas**

**Próximo:** ⏸️ **Fase 2 em Standby** (aguardando decisão do time)
