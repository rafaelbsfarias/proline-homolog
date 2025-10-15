# 📋 Resumo: Como Verificar Part Requests

**URL Teste:** http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9  
**Status:** ❌ **BUG CONFIRMADO**

---

## 🚨 PROBLEMA

**Solicitações de peças NÃO estão sendo salvas no banco de dados.**

### Evidência:

```sql
SELECT COUNT(*) FROM mechanics_checklist_items WHERE part_request IS NOT NULL;
-- Resultado: 0 rows ❌
```

---

## 🔍 COMO VERIFICAR

### Método 1: Script SQL (Rápido)

```bash
# Executar script de verificação
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f scripts/verify-part-requests.sql
```

**Resultado atual:**
- ✅ Schema da tabela: `part_request` column existe (JSONB)
- ✅ Items salvos: 30 items
- ❌ Part requests: 0 (BUG!)
- ❌ Evidences: 0 (outro bug relacionado)

---

### Método 2: Query Manual

```sql
-- Verificar items do quote
SELECT 
  item_key,
  item_status,
  CASE WHEN part_request IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as tem_part_request
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
ORDER BY item_key;
```

---

### Método 3: Browser DevTools

```
1. Abrir: http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-...
2. DevTools → Network → Filtrar: submit
3. Preencher checklist e solicitar peça
4. Clicar em "Salvar Checklist"
5. Verificar Request Payload:

✅ CORRETO (deveria ter):
{
  "clutch": "NOK",
  "clutchNotes": "Precisa trocar",
  "part_requests": {
    "clutch": {
      "peca": "Embreagem",
      "quantidade": 1
    }
  }
}

❌ ATUAL (não tem):
{
  "clutch": "NOK",
  "clutchNotes": "Precisa trocar"
  // part_requests ausente!
}
```

---

## 🐛 ROOT CAUSE

### 1. Frontend NÃO envia `part_requests` para o backend

**Arquivo:** `app/dashboard/partner/checklist/page.tsx`

```typescript
// Estado local gerencia part_requests
const [itemPartRequests, setItemPartRequests] = useState({});

// ❌ MAS não passa para saveChecklist()
await saveChecklist(); // Deveria ser: saveChecklist(itemPartRequests)
```

### 2. Hook NÃO recebe `part_requests` como parâmetro

**Arquivo:** `modules/partner/hooks/checklist/useChecklistOrchestrator.ts`

```typescript
// ❌ Função não aceita parâmetro
const saveChecklist = useCallback(async () => {
  const payload = { ...form }; // part_requests ausente
  await put('/api/partner/checklist/submit', payload);
}, [form]);

// ✅ DEVERIA SER:
const saveChecklist = useCallback(async (partRequests?: Record<string, unknown>) => {
  const payload = { 
    ...form, 
    part_requests: partRequests // Incluir no payload
  };
  await put('/api/partner/checklist/submit', payload);
}, [form]);
```

### 3. Backend NÃO extrai `part_request` do payload

**Arquivo:** `app/api/partner/checklist/submit/route.ts` (linha ~260)

```typescript
// ❌ Monta row sem part_request
const row: Record<string, unknown> = {
  vehicle_id: checklistData.vehicle_id,
  item_key: key,
  item_status: mappedStatus,
  item_notes: (checklistData as any)?.[notesKey] || null,
  // part_request: ??? FALTA!
};

// ✅ DEVERIA SER:
const row: Record<string, unknown> = {
  vehicle_id: checklistData.vehicle_id,
  item_key: key,
  item_status: mappedStatus,
  item_notes: (checklistData as any)?.[notesKey] || null,
  part_request: (checklistData.part_requests as any)?.[key] || null, // ✅ Extrair
};
```

---

## ✅ SOLUÇÃO

### 3 Mudanças Necessárias:

```
1. page.tsx:
   await saveChecklist(itemPartRequests);

2. useChecklistOrchestrator.ts:
   const saveChecklist = async (partReqs?: Record<string, unknown>) => {
     const payload = { ...form, part_requests: partReqs };
   }

3. submit/route.ts:
   part_request: (checklistData.part_requests)?.[key] || null
```

---

## 🧪 TESTE APÓS FIX

```bash
# 1. Aplicar as 3 correções

# 2. Limpar dados
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
DELETE FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';
"

# 3. Testar no browser
# - Preencher checklist
# - Solicitar peça para um item
# - Salvar

# 4. Verificar no banco
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 
  item_key, 
  CASE WHEN part_request IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as salvou
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
  AND item_key = 'clutch';
"

# Resultado esperado:
# item_key | salvou
# ----------+--------
# clutch   | ✅ SIM
```

---

## 📊 FLUXO CORRETO

```
┌──────────────┐
│ Usuario      │
│ preenche     │ → Solicita peça
│ modal        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ page.tsx     │
│itemPartReqs  │ → Estado local
│ {...}        │
└──────┬───────┘
       │ saveChecklist(itemPartReqs) ✅
       ▼
┌──────────────┐
│ Hook         │
│ recebe       │ → Inclui no payload
│ partReqs     │
└──────┬───────┘
       │ POST com part_requests ✅
       ▼
┌──────────────┐
│ Backend      │
│ extrai       │ → (checklistData.part_requests)?.[key]
│ part_request │
└──────┬───────┘
       │ INSERT part_request ✅
       ▼
┌──────────────┐
│ Database     │
│ part_request │ → Salvo!
│ = {...}      │
└──────────────┘
```

---

## 📄 DOCUMENTAÇÃO COMPLETA

- **Bug Report Detalhado:** `docs/BUG_PART_REQUESTS_NOT_SAVING.md`
- **Script de Verificação:** `scripts/verify-part-requests.sql`
- **Arquitetura:** `docs/CHECKLIST_ARCHITECTURE_DIAGRAM.md`

---

## 🎯 STATUS

- [x] Bug identificado
- [x] Root cause documentado
- [x] Solução proposta
- [ ] **Correção aplicada** ← PRÓXIMO PASSO
- [ ] Testado manualmente
- [ ] Teste E2E criado

---

**AÇÃO IMEDIATA:** Aplicar as 3 correções listadas acima.
