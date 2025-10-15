# Auditoria: Endpoint Partner Checklist

**Endpoint:** `http://localhost:3000/dashboard/partner/checklist?quoteId=XXX`  
**Data:** 14 de Outubro de 2025  
**Objetivo:** Mapear todos os arquivos relacionados e identifi## 🗑️ CÓDIGO MORTO

### 1. **Páginas Antigas** ⚠️

```
⚠️ app/dashboard/partner/dynamic-checklist/
   - Status: EM USO PARCIAL
   - Usado por: Parceiros NÃO-mecânicos (Funilaria, Lavagem, etc)
   - Componentes reutilizados: PartRequestModal, usePartRequestModal, PartRequestCard
   - Referenciado em: PartnerDashboard.tsx (linha 265)
   - Ação: NÃO DELETAR (mas considerar consolidar com checklist-v2)
```

**Evidências:**
```typescript
// PartnerDashboard.tsx (linha 265)
const link = category === 'Mecânica'
  ? `/dashboard/partner/checklist?quoteId=${quote.id}`
  : `/dashboard/partner/dynamic-checklist?quoteId=${quote.id}`;
```

**Componentes compartilhados:**
- `app/dashboard/partner/dynamic-checklist/hooks/usePartRequestModal.ts`
- `app/dashboard/partner/dynamic-checklist/types/index.ts`
- `app/dashboard/partner/dynamic-checklist/components/PartRequestModal.tsx`
- `app/dashboard/partner/dynamic-checklist/components/PartRequestCard.tsx` duplicado/morto/deprecado

---

## 📂 ARQUIVOS PRINCIPAIS

### 1. **PÁGINA** (Frontend)
```
✅ ATIVO: app/dashboard/partner/checklist/page.tsx (430 linhas)
```
- **Status:** Em uso (rota principal)
- **Função:** Renderiza checklist hard-coded para categoria "Mecânica"
- **Dependências:**
  - Hook: `useChecklistOrchestrator`
  - Componente: `PartnerChecklistGroups`
  - Modal: `PartRequestModal` (reutilizado de `dynamic-checklist`)

---

### 2. **API ROUTES** (Backend)

#### 2.1 Endpoints ATIVOS ✅

| Arquivo | Rota | Método | Função |
|---------|------|--------|--------|
| `app/api/partner/checklist/init/route.ts` | `/api/partner/checklist/init` | GET | Inicializa checklist (retorna template) |
| `app/api/partner/checklist/load/route.ts` | `/api/partner/checklist/load` | GET | Carrega checklist existente |
| `app/api/partner/checklist/submit/route.ts` | `/api/partner/checklist/submit` | POST | **SALVA checklist** (CRITICAL) |
| `app/api/partner/checklist/upload-evidence/route.ts` | `/api/partner/checklist/upload-evidence` | POST | Upload de imagens |
| `app/api/partner/checklist/templates/route.ts` | `/api/partner/checklist/templates` | GET | Lista templates disponíveis |
| `app/api/partner/checklist/templates/[category]/route.ts` | `/api/partner/checklist/templates/:category` | GET | Template por categoria |

#### 2.2 Endpoints SUSPEITOS 🟡

| Arquivo | Status | Razão |
|---------|--------|-------|
| `app/api/partner/checklist/exists/route.ts` | ⚠️ EM USO | Usado por `useChecklistCache.ts` (linha 123) |
| `app/api/partner/checklist/save-anomalies/route.ts` | ✅ ATIVO | Usado por `dynamic-checklist` (parceiros não-mecânicos) |
| `app/api/partner/checklist/load-anomalies/route.ts` | ✅ ATIVO | Usado por `dynamic-checklist` (parceiros não-mecânicos) |

---

### 3. **MÓDULOS** (Business Logic)

#### 3.1 Services ✅

```
modules/partner/checklist/services/
  ✅ mechanicsChecklistService.ts (usado)
  ⚠️ anomaliesService.ts (outro fluxo - NÃO usado no endpoint principal)
```

#### 3.2 Repositories ✅

```
modules/partner/checklist/repositories/
  ✅ MechanicsChecklistRepository.ts (usado)
  ⚠️ AnomaliesRepository.ts (outro fluxo - NÃO usado no endpoint principal)
```

#### 3.3 Controller ✅

```
modules/partner/checklist/controller/
  ✅ partnerChecklistController.ts (orquestra tudo)
```

#### 3.4 Utils ✅

```
modules/partner/checklist/utils/
  ✅ signedUrlService.ts (gera URLs de S3/Storage)
  ✅ groupByCategory.ts (agrupa items por categoria)
```

#### 3.5 Schemas ✅

```
modules/partner/checklist/
  ✅ schemas.ts (tipos TypeScript)
  ✅ errors.ts (erros customizados)
```

#### 3.6 Mappers ✅

```
modules/partner/checklist/mappers/
  ✅ ChecklistMappers.ts (transforma dados DB → API)
```

---

### 4. **HOOKS** (React)

#### 4.1 Hooks ATIVOS ✅

```
modules/partner/hooks/checklist/
  ✅ useChecklistOrchestrator.ts (hook principal usado pela página)
  ✅ useChecklistForm.ts (gerencia estado do formulário)
  ✅ useChecklistData.ts (carrega dados do backend)
  ✅ useChecklistSubmit.ts (salva dados no backend)
  ✅ useAnomalies.ts (gerencia anomalias)
```

#### 4.2 Hooks DEPRECADOS ⚠️

```
⚠️ modules/partner/hooks/usePartnerChecklist.ts
   - Status: WRAPPER (em uso por 1 arquivo)
   - Usado por: app/dashboard/partner/dynamic-checklist/page.tsx
   - Função: Compatibilidade entre orchestrator e dynamic-checklist
   - Ação: MANTER enquanto dynamic-checklist existir
```

**Uso encontrado:**
```typescript
// app/dashboard/partner/dynamic-checklist/page.tsx
import { usePartnerChecklist } from '@/modules/partner/hooks/usePartnerChecklist';

const { form, vehicle, ... } = usePartnerChecklist();
```

---

### 5. **COMPONENTES** (UI)

#### 5.1 Componentes ATIVOS ✅

```
modules/partner/components/checklist/
  ✅ PartnerChecklistGroups.tsx (renderiza grupos de items)
  ✅ DynamicChecklistForm.tsx (usado em checklist-v2)
```

#### 5.2 Componentes ISOLADOS 🟡

```
modules/partner/components/
  ⚠️ InspectionData.tsx (dados de inspeção - usado em ambas páginas)
```

---

## 🔄 CÓDIGO DUPLICADO

### 1. **PÁGINAS DUPLICADAS** ❌

#### Página 1 (ATUAL): `/dashboard/partner/checklist`
```
✅ app/dashboard/partner/checklist/page.tsx
```
- **Características:**
  - Formulário HARD-CODED (campos fixos)
  - Categoria: Mecânica apenas
  - Hook: `useChecklistOrchestrator`
  - Componentes: `PartnerChecklistGroups`

#### Página 2 (NOVA): `/dashboard/partner/checklist-v2`
```
⚠️ app/dashboard/partner/checklist-v2/page.tsx
```
- **Características:**
  - Formulário DINÂMICO (baseado em templates)
  - Categorias: Todas (Mecânica, Funilaria, etc)
  - Hook: `useChecklistTemplate`
  - Componentes: `DynamicChecklistForm`

**DUPLICAÇÃO:** Duas páginas fazendo a mesma coisa de formas diferentes.

**RECOMENDAÇÃO:** Decidir qual será a versão oficial e deletar a outra.

---

### 2. **HOOKS DUPLICADOS** ❌

#### Hook 1 (WRAPPER): `modules/partner/hooks/usePartnerChecklist.ts`
```typescript
// Apenas delega para useChecklistOrchestrator
export function usePartnerChecklist() {
  const o = useChecklistOrchestrator();
  return { ...o }; // Wrapper vazio
}
```

#### Hook 2 (VIEWER): `modules/vehicles/hooks/usePartnerChecklist.ts`
```typescript
// Usado para VISUALIZAR checklist (admin/specialist)
export function usePartnerChecklist(vehicleId?: string) {
  // Chama /api/partner-checklist (diferente!)
  return { data, loading, error };
}
```

**PROBLEMA:** Mesmo nome, funções diferentes!

**RECOMENDAÇÃO:**
- ✅ **Renomear:** `modules/vehicles/hooks/usePartnerChecklist.ts` → `usePartnerChecklistViewer.ts`
- ❌ **Deletar:** `modules/partner/hooks/usePartnerChecklist.ts` (wrapper inútil)

---

### 3. **ROTAS DUPLICADAS/DEPRECADAS** ⚠️

#### Rota 1: `/api/partner/checklist/exists`
```typescript
// Verifica se checklist existe
GET /api/partner/checklist/exists?quoteId=XXX
```

#### Rota 2: `/api/partner/checklist/load`
```typescript
// Carrega checklist (também verifica existência)
GET /api/partner/checklist/load?quoteId=XXX&inspectionId=YYY
```

**DUPLICAÇÃO:** `/exists` é redundante, `/load` retorna `null` se não existir.

**RECOMENDAÇÃO:** Deletar `/exists`, usar apenas `/load`.

---

## 🗑️ CÓDIGO MORTO

### 1. **Páginas Antigas** ❌

```
❌ app/dashboard/partner/dynamic-checklist/page.tsx
   - Status: EXPERIMENTAL (nunca foi para produção)
   - Motivo: Substituído por checklist-v2
   - Ação: DELETAR (após confirmar que não está em uso)
```

### 2. **Arquivos de Backup** ❌

```bash
find . -name "*.backup" -o -name "*.original"
```

**Encontrados:**
```
❌ app/dashboard/admin/partner-overview/page.tsx.backup
❌ app/dashboard/admin/partner-overview/page.tsx.original
```

**Ação:** DELETAR (já estão no Git)

---

### 3. **Scripts Antigos** ⚠️

```
⚠️ scripts/debug_checklist_data.sql
   - Status: DEBUG (útil temporariamente)
   - Ação: MOVER para docs/ ou deletar após debug

⚠️ scripts/show_mechanics_checklist_schema.sh
   - Status: UTILITÁRIO (útil para DBs)
   - Ação: MANTER
```

---

## 📊 RESUMO DE AÇÕES

### ✅ MANTER (Arquivos Essenciais)

1. **Página Principal:**
   - `app/dashboard/partner/checklist/page.tsx`

2. **API Routes:**
   - `app/api/partner/checklist/init/route.ts`
   - `app/api/partner/checklist/load/route.ts`
   - `app/api/partner/checklist/submit/route.ts`
   - `app/api/partner/checklist/upload-evidence/route.ts`
   - `app/api/partner/checklist/templates/route.ts`
   - `app/api/partner/checklist/templates/[category]/route.ts`

3. **Módulos:**
   - `modules/partner/checklist/*` (todos)

4. **Hooks:**
   - `modules/partner/hooks/checklist/*` (todos)

5. **Componentes:**
   - `modules/partner/components/checklist/*` (todos)

---

### ❌ DELETAR (Código Morto/Duplicado)

#### ⚠️ ATUALIZAÇÃO: Nada pode ser deletado ainda!

**Descobertas após auditoria:**

1. ✅ **dynamic-checklist ESTÁ EM USO**
   - Usado por parceiros não-mecânicos (Funilaria, Lavagem, Pneus, Loja)
   - Referenciado em `PartnerDashboard.tsx`
   - Componentes compartilhados com `/checklist`

2. ✅ **usePartnerChecklist (wrapper) ESTÁ EM USO**
   - Usado por `dynamic-checklist/page.tsx`
   - Necessário enquanto duas páginas coexistirem

3. ✅ **/exists ESTÁ EM USO**
   - Usado por `useChecklistCache.ts`
   - Cache/invalidação de checklist

#### Arquivos Seguros para Deletar:

```bash
# Apenas backups podem ser removidos com segurança
rm app/dashboard/admin/partner-overview/page.tsx.backup
rm app/dashboard/admin/partner-overview/page.tsx.original
```

**Impacto:** Nenhum (são apenas backups, já versionados no Git)

---

### 🔄 REFATORAR (Decisões Necessárias)

#### 1. Escolher Versão do Checklist

**Opção A:** Manter `/checklist` (hard-coded)
- ✅ Funciona agora
- ❌ Difícil de manter (mudanças exigem código)

**Opção B:** Migrar para `/checklist-v2` (dinâmico)
- ✅ Flexível (templates no DB)
- ✅ Suporta todas as categorias
- ❌ Precisa testar todas as categorias

**RECOMENDAÇÃO:** Migrar para V2 após testes completos.

**Ação:**
```bash
# Quando V2 estiver 100% testado:
mv app/dashboard/partner/checklist app/dashboard/partner/checklist-old
mv app/dashboard/partner/checklist-v2 app/dashboard/partner/checklist
```

#### 2. Renomear Hook Duplicado

```bash
# Renomear para evitar confusão
mv modules/vehicles/hooks/usePartnerChecklist.ts \
   modules/vehicles/hooks/usePartnerChecklistViewer.ts
```

**Atualizar imports:**
```typescript
// De:
import { usePartnerChecklist } from '@/modules/vehicles/hooks/usePartnerChecklist';

// Para:
import { usePartnerChecklistViewer } from '@/modules/vehicles/hooks/usePartnerChecklistViewer';
```

---

## 🧪 TESTES NECESSÁRIOS

Antes de deletar qualquer arquivo, verificar usos:

```bash
# 1. Verificar usos de usePartnerChecklist (wrapper)
grep -r "usePartnerChecklist" --include="*.ts" --include="*.tsx" .

# 2. Verificar usos de /dynamic-checklist
grep -r "dynamic-checklist" --include="*.ts" --include="*.tsx" .

# 3. Verificar usos de /exists endpoint
grep -r "/api/partner/checklist/exists" --include="*.ts" --include="*.tsx" .
```

---

## 📋 CHECKLIST DE LIMPEZA

### Fase 1: Seguro (Sem Risco)
- [ ] Deletar arquivos `.backup` e `.original`
- [ ] Deletar scripts de debug temporários
- [ ] Mover documentação antiga para `/docs/archived/`

### Fase 2: Baixo Risco (Testar Antes)
- [x] ~~Deletar `/api/partner/checklist/exists`~~ **❌ EM USO** (useChecklistCache.ts)
- [x] ~~Deletar `modules/partner/hooks/usePartnerChecklist.ts`~~ **❌ EM USO** (dynamic-checklist)

### Fase 3: Médio Risco (Decisão de Produto)
- [ ] Escolher entre `/checklist` e `/checklist-v2`
- [ ] Deletar página não escolhida
- [ ] Atualizar links no dashboard

### Fase 4: Refatoração (Longo Prazo)
- [ ] Renomear `usePartnerChecklist` (vehicles) → `usePartnerChecklistViewer`
- [ ] Consolidar anomalies no fluxo principal (ou separar completamente)
- [ ] Criar testes E2E para checklist

---

## 🎯 PRÓXIMOS PASSOS

1. **Imediato:** 
   - ✅ Testar imagens e part_requests no checklist atual
   - [ ] Deletar apenas backups seguros (.backup, .original)

2. **Curto Prazo:**
   - [ ] Testar checklist-v2 para TODAS as categorias
   - [ ] Comparar funcionalidades: dynamic-checklist vs checklist-v2
   - [ ] Documentar diferenças entre as 3 páginas

3. **Médio Prazo:**
   - [ ] Consolidar `/checklist`, `/dynamic-checklist`, `/checklist-v2` em UMA página
   - [ ] Migrar componentes compartilhados para local comum
   - [ ] Criar testes E2E para todas as categorias

4. **Longo Prazo:**
   - [ ] Sistema de templates unificado para todas as categorias
   - [ ] Cache inteligente de checklists
   - [ ] Performance: lazy loading de evidências

---

## 📌 NOTAS IMPORTANTES

### ⚠️ NÃO DELETAR SEM VERIFICAR:

- **Anomalies:** Fluxo separado usado por outros parceiros (não-mecânica)
- **Templates:** Sistema usado por checklist-v2 (futuro)
- **Evidences:** APIs de upload usadas por múltiplos fluxos

### ✅ SEGURO DELETAR:

- Backups (`.backup`, `.original`)
- Wrappers vazios (`usePartnerChecklist.ts` em `modules/partner/hooks/`)
- Scripts de debug (após resolver bugs)

---

**Autor:** GitHub Copilot  
**Revisão:** Pendente
