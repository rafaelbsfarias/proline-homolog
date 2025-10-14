# CRITICAL FIX NEEDED - Implementation Plan

**Data:** 14 de Outubro de 2025, 21:35  
**Branch:** `refactor/checklist-service`  
**Commit:** `35d762c` - Database migration applied ✅  
**Status:** 🔴 Code Changes Required

---

## ✅ O Que Foi Corrigido (Database)

### Migration 20251014210955 - APLICADA COM SUCESSO

**1. mechanics_checklist_items**
- ✅ Adicionada coluna `partner_id UUID` (FK → partners.profile_id)
- ✅ Criados 8 índices para performance
- ✅ Constraint `check_has_context_id` (inspection_id OR quote_id obrigatório)
- ✅ Unique indexes por partner+context+item
- ✅ RLS policies ativas (5 policies)

**2. mechanics_checklist_evidence**
- ✅ Tabela criada do zero (estava completamente faltando!)
- ✅ Estrutura completa: partner_id, inspection_id, quote_id, vehicle_id, item_key, media_url, media_type
- ✅ Criados 8 índices para performance
- ✅ Trigger `updated_at` automático
- ✅ RLS policies ativas (5 policies)

---

## 🔴 GAPs a Corrigir no Código

### GAP 1: ChecklistItemService.loadItems() - Adicionar filtro partner_id
**Prioridade:** P0 - CRÍTICO  
**Tempo:** 15min  
**Arquivo:** `modules/partner/services/checklist/items/ChecklistItemService.ts`

### GAP 2: EvidenceRepository.findAll() - Adicionar filtro partner_id  
**Prioridade:** P0 - CRÍTICO  
**Tempo:** 15min  
**Arquivo:** `modules/partner/services/checklist/evidences/EvidenceRepository.ts`

### GAP 3: LoadChecklistOptions - Adicionar partner_id  
**Prioridade:** P0 - CRÍTICO  
**Tempo:** 5min  
**Arquivo:** `modules/partner/services/checklist/types.ts`

### GAP 4: ChecklistService - Propagar partner_id  
**Prioridade:** P0 - CRÍTICO  
**Tempo:** 10min  
**Arquivo:** `modules/partner/services/checklist/ChecklistService.ts`

### GAP 5: API Routes - Incluir partner_id  
**Prioridade:** P0 - CRÍTICO  
**Tempo:** 10min  
**Arquivos:** `app/api/partner/checklist/load/route.ts`, `app/api/checklist/view/route.ts`

### GAP 6: Category Filter - Mostrar checklists sem anomalias  
**Prioridade:** P1 - IMPORTANTE  
**Tempo:** 5min  
**Arquivo:** `modules/vehicles/components/sections/PartnerEvidencesSection.tsx`

**TOTAL:** ~1 hora para P0 + P1

---

## 📋 Checklist de Implementação

- [ ] GAP 1: ChecklistItemService
- [ ] GAP 2: EvidenceRepository  
- [ ] GAP 3: LoadChecklistOptions interface
- [ ] GAP 4: ChecklistService
- [ ] GAP 5: API Routes
- [ ] GAP 6: Category Filter
- [ ] Teste: Isolamento entre partners
- [ ] Teste: RLS policies funcionando

---

## 🧪 Teste de Isolamento

```sql
-- Criar dados de teste para 2 partners
INSERT INTO mechanics_checklist_items (partner_id, quote_id, vehicle_id, item_key, item_status)
VALUES 
  ('partner-1', 'quote-123', 'vehicle-1', 'motor.oil', 'ok'),
  ('partner-2', 'quote-123', 'vehicle-1', 'freios.pastilhas', 'nok');

-- Verificar isolamento
SELECT partner_id, item_key FROM mechanics_checklist_items WHERE quote_id = 'quote-123';
-- Deve retornar 2 rows

-- Via API (deve filtrar por partner_id)
GET /api/checklist/view?quote_id=quote-123&partner_id=partner-1
-- Deve retornar apenas 1 item
```

---

## 🚀 Próxima Ação

**Qual opção você prefere?**

**A)** Implementar correções agora (~1h)  
**B)** Code review completo primeiro (~30min + 1h)  
**C)** Outro approach

Aguardo sua decisão! 🎯
