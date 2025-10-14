# Code Review Analysis - Gaps Identified

**Data:** 14 de Outubro de 2025, 21:10  
**Branch:** `refactor/checklist-service`  
**Status:** 🔴 Gaps Críticos Identificados

---

## ✅ Pontos Fortes Confirmados

### 1. Segmentação por Partner (Parcial)
- ✅ `mechanics_checklist` lê/escreve com `partner_id`
- ✅ `ChecklistRepository.findOneForPartner` implementado
- ✅ `vehicle_anomalies` filtra por `partner_id`
- ✅ API `GET /api/checklist/view` aceita `partner_id`

**Arquivos:**
- `modules/partner/services/checklist/core/ChecklistRepository.ts`
- `app/api/partner/checklist/submit/route.ts`
- `app/api/checklist/view/route.ts`

### 2. UI - Vehicle Details
- ✅ `PartnerEvidencesSection` renderiza botão por partner+categoria
- ✅ `useDynamicChecklistLoader` passa `partnerId` consistentemente
- ✅ Lightbox com índice correto

**Arquivos:**
- `modules/vehicles/components/sections/PartnerEvidencesSection.tsx`
- `modules/vehicles/hooks/useDynamicChecklistLoader.ts`
- `modules/vehicles/components/VehicleDetails.tsx`

### 3. Suporte a quote_id
- ✅ API `categories` não depende exclusivamente de `inspection_id`
- ✅ Suporta fluxo `quote_id`-only

**Arquivo:**
- `app/api/checklist/categories/route.ts`

### 4. Segurança
- ✅ Partner paths usam `withPartnerAuth`
- ✅ Viewer path usa `withAnyAuth` + ownership checks

---

## 🔴 Gaps Críticos (vs Roadmap)

### GAP 1: Segmentação de Items e Evidences **[CRÍTICO]**

**Problema:**
```typescript
// ChecklistItemService.loadItems() - SEM filtro de partner_id
async loadItems(options: LoadChecklistOptions): Promise<any[]> {
  let query = this.supabase
    .from(TABLES.MECHANICS_CHECKLIST_ITEMS)
    .select('item_key, item_status, item_notes, part_request');

  query = applyIdFilters(query, options) as typeof query;
  // ❌ NÃO filtra por partner_id
  
  const { data, error } = await query;
  return data || [];
}
```

**Risco:**
- Se 2+ partners preenchem items/evidences para a mesma `inspection_id`/`quote_id`
- Load vai **misturar dados de diferentes parceiros** ⚠️

**Impacto:** ALTO - Violação de segurança e integridade de dados

**Arquivos Afetados:**
- `modules/partner/services/checklist/items/ChecklistItemService.ts`
- `modules/partner/services/checklist/evidences/EvidenceRepository.ts`

**Correção Necessária:**
```typescript
// ANTES
query = applyIdFilters(query, options) as typeof query;

// DEPOIS
query = applyIdFilters(query, options) as typeof query;
if (partner_id) {
  query = query.eq('partner_id', partner_id);
}
```

---

### GAP 2: Schema do Banco - Colunas Faltantes **[CRÍTICO]**

**Problema:**
Submit route tenta DELETE/INSERT com filtro `partner_id`:

```typescript
// app/api/partner/checklist/submit/route.ts
await adminClient
  .from(TABLES.MECHANICS_CHECKLIST_ITEMS)
  .delete()
  .eq('inspection_id', data.inspection_id)
  .eq('partner_id', partnerId); // ❌ Coluna pode não existir
```

**Verificar:**
```sql
-- Checar se colunas existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mechanics_checklist_items'
  AND column_name IN ('partner_id', 'quote_id');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mechanics_checklist_evidence'
  AND column_name IN ('partner_id', 'quote_id');
```

**Resultado Esperado:**
- `mechanics_checklist_items`: deve ter `partner_id`, `quote_id`
- `mechanics_checklist_evidence`: deve ter `partner_id`, `quote_id`

**Se faltarem colunas:**
- Criar migration para adicionar
- Atualizar índices
- Adicionar constraints

---

### GAP 3: Listagem de Categorias - Filtro Incorreto **[MÉDIO]**

**Problema:**
```typescript
// modules/vehicles/components/sections/PartnerEvidencesSection.tsx
const availableCategories = categories.filter(c => c.has_anomalies);
// ❌ Só mostra categorias COM anomalias
```

**Comportamento Atual:**
- Partner salva checklist (sem anomalias)
- Categoria **NÃO aparece** na listagem
- Usuário não vê o checklist salvo

**Comportamento Esperado:**
- Mostrar TODAS categorias com checklist salvo
- Anomalias são opcionais

**Correção:**
```typescript
// Opção A: Remover filtro completamente
const availableCategories = categories;

// Opção B: Filtro mais abrangente
const availableCategories = categories.filter(c => 
  c.has_anomalies || c.has_checklist_saved
);
```

**Impacto:** MÉDIO - UX ruim, confusão do usuário

---

### GAP 4: Evidences Display - Requisito Ambíguo **[BAIXO]**

**Problema:**
```typescript
// MechanicsChecklistView.tsx
const itemsWithEvidence = checklistData.items
  .filter(item => item.item_status === 'nok' && item.media_url) // ❌ Só NOK
```

**Decisão Necessária:**
1. Mostrar evidences apenas para items NOK? (atual)
2. Mostrar evidences para items OK também?

**Impacto:** BAIXO - Questão de UX, não afeta funcionalidade core

---

### GAP 5: Normalização de Contexto **[BAIXO]**

**Problema:**
Código ainda usa `inspection_id` OR `quote_id` em queries separadas.

**Ideal (futuro):**
```typescript
interface Context {
  context_type: 'inspection' | 'quote';
  context_id: string;
}
```

**Impacto:** BAIXO - Melhoria de arquitetura, não urgente

---

## 📊 Priorização de Correções

### 🔥 P0 - CRÍTICO (Fazer Agora)
1. **Verificar schema do banco** (5 min)
   - Rodar SQL para checar colunas
   - Se faltarem, criar migrations

2. **Adicionar filtro `partner_id` em load** (30 min)
   - Atualizar `ChecklistItemService.loadItems()`
   - Atualizar `EvidenceRepository.findAll()`
   - Propagar `partner_id` em `LoadChecklistOptions`

### ⚠️ P1 - IMPORTANTE (Fazer Hoje)
3. **Corrigir filtro de categorias** (15 min)
   - Remover ou ajustar filtro `has_anomalies`
   - Testar com checklist sem anomalias

### 📝 P2 - MÉDIO (Fazer Amanhã)
4. **Decidir sobre evidences display** (5 min decisão + 10 min código)
   - Confirmar requisito com stakeholder
   - Ajustar filtro se necessário

### 🔮 P3 - FUTURO (v2.0)
5. **Normalizar contexto** (design completo)
   - Criar RFC para `(context_type, context_id)`
   - Planejar migração gradual

---

## 🎯 Plano de Ação Imediato

### Etapa 1: Verificar Schema (5 min)
```bash
cd /home/rafael/workspace/proline-homolog
npx supabase db execute --file scripts/verify_schema.sql
```

### Etapa 2: Criar Migrations (se necessário)
```bash
# Se partner_id falta em mechanics_checklist_items
supabase migration new add_partner_id_to_items_and_evidences

# Se quote_id falta em mechanics_checklist_evidence
# (já existe em mechanics_checklist_items)
```

### Etapa 3: Corrigir Load Functions (30 min)
- Atualizar `ChecklistItemService.ts`
- Atualizar `EvidenceRepository.ts`
- Adicionar `partner_id` em `LoadChecklistOptions`

### Etapa 4: Corrigir UI de Categorias (15 min)
- Ajustar filtro em `PartnerEvidencesSection.tsx`

### Etapa 5: Testar (30 min)
- Cenário: 2 partners, mesmo quote_id
- Verificar isolamento de dados

---

## 🔍 Resultado da Verificação de Schema

**Executado em:** 14/10/2025, 21:15  
**Comando:** `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/verify_schema.sql`

### ❌ Problemas Encontrados

#### 1. `mechanics_checklist_items`
**Colunas Presentes:**
- ✅ `id` (uuid, PK)
- ✅ `inspection_id` (uuid, nullable)
- ✅ `vehicle_id` (uuid, not null)
- ✅ `item_key` (text, not null)
- ✅ `item_status` (text, not null)
- ✅ `item_notes` (text, nullable)
- ✅ `quote_id` (uuid, nullable) - **ADICIONADA recentemente**
- ✅ `part_request` (jsonb, nullable) - **ADICIONADA recentemente**

**Colunas Faltantes:**
- ❌ `partner_id` - **CRÍTICO para segmentação**

**Índices:** 
- ⚠️ NENHUM índice criado (performance ruim)

**Constraints:**
- ⚠️ NENHUM constraint criado

**RLS Policies:**
- ⚠️ NENHUMA policy ativa (segurança fraca)

#### 2. `mechanics_checklist_evidence`
**Status:** ❌ **TABELA NÃO EXISTE**

Isso explica completamente o erro:
```
ERROR:  relation "public.mechanics_checklist_evidence" does not exist
```

### 🎯 Conclusão

**Estado Atual:**
- `mechanics_checklist_items` existe mas falta `partner_id`
- `mechanics_checklist_evidence` **NÃO EXISTE** na base
- Código tenta usar tabela inexistente
- Submit route falhará ao tentar INSERT/DELETE em evidences

**Impacto:**
- 🔴 **BLOQUEADOR:** Sistema não pode salvar/carregar evidências
- 🔴 **SEGURANÇA:** Sem `partner_id`, dados não são isolados por parceiro

---

## 📝 Observabilidade (Recomendado)

### Logs Críticos a Adicionar
```typescript
logger.info('load_items_partner_scope', {
  inspection_id,
  quote_id,
  partner_id,
  items_count: data.length,
});

logger.warn('potential_data_leak', {
  inspection_id,
  quote_id,
  partner_id_missing: !partner_id,
});
```

### Métricas P95 (Futuro)
- Latência de load por categoria
- Taxa de erro por partner
- Volume de items/evidences por quote

---

## ✅ Decisão de Continuidade

**Opção A: Corrigir Gaps Críticos Agora** (Recomendado)
- Tempo: ~1h30min
- Evita problemas de segurança
- Branch pronta para merge

**Opção B: Continuar Roadmap e Corrigir Depois**
- Riscos: mixing de dados entre partners
- Benefício: avançar mais rápido

**Opção C: Code Review Completo Primeiro**
- Identificar outros gaps
- Plano de correção consolidado

---

## 🤔 Sua Decisão

Qual abordagem prefere?

**A)** Corrigir gaps críticos agora (~1h30min)  
**B)** Continuar roadmap (aceitar riscos temporários)  
**C)** Code review completo primeiro

**Aguardo sua decisão!** 🎯
