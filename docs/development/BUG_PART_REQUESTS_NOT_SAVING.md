# 🧪 Guia de Teste: Part Requests no Checklist

**Data:** 14 de Outubro de 2025  
**URL:** http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9  
**Status:** ❌ **BUG CONFIRMADO** - Part requests NÃO estão sendo salvos

---

## 🐛 PROBLEMA IDENTIFICADO

### O que está acontecendo:

```typescript
// ✅ Frontend: itemPartRequests está sendo populado
const [itemPartRequests, setItemPartRequests] = useState<...>({});

// ❌ Backend: part_request NÃO está sendo inserido na tabela
// mechanics_checklist_items NÃO tem part_request
```

### Verificação no Banco:

```sql
SELECT id, item_key, item_status, part_request 
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9' 
  AND part_request IS NOT NULL;

-- Resultado: 0 rows ❌
```

---

## 🔍 ANÁLISE DO CÓDIGO

### 1. Frontend (page.tsx) ✅

```typescript
// Estado local gerenciado corretamente
const [itemPartRequests, setItemPartRequests] = useState<...>({});

// Modal salva no estado local
const handleSavePartRequest = () => {
  const pr = buildPartRequest();
  if (pr && modalState.anomalyId) {
    const key = modalState.anomalyId as EvidenceKey;
    setItemPartRequests(prev => ({ ...prev, [key]: pr })); // ✅ Salva localmente
    close();
  }
};

// Passado para componente
<PartnerChecklistGroups
  partRequests={itemPartRequests} // ✅ Componente recebe
  ...
/>
```

**STATUS:** ✅ Frontend está OK

---

### 2. Hook (useChecklistOrchestrator) ⚠️

```typescript
// Hook retorna part_requests carregados do banco
const [partRequests, setPartRequests] = useState<Record<string, unknown>>({});

// Carrega part_requests salvos anteriormente
const pr: Record<string, unknown> = {};
for (const item of loadedItems) {
  if (item.part_request && item.item_key) pr[item.item_key] = item.part_request;
}
setPartRequests(pr); // ✅ Carrega do banco

// Retorna para o componente
return {
  ...
  partRequests, // ✅ Disponível para page.tsx
};
```

**PROBLEMA:** Hook NÃO recebe os `itemPartRequests` do estado local da página!

---

### 3. Backend (submit/route.ts) ❌

```typescript
// Monta rows para inserir
const itemRows = itemDefs.map(({ key, notesKey }) => {
  const status = (checklistData as any)?.[key];
  const mappedStatus = checklistService.mapStatus(status);
  
  const row: Record<string, unknown> = {
    vehicle_id: checklistData.vehicle_id,
    item_key: key,
    item_status: mappedStatus,
    item_notes: (checklistData as any)?.[notesKey] || null,
    partner_id: partnerId,
    // ❌ FALTA: part_request não está sendo incluído!
  };
  
  return row;
});

// Insert sem part_request
await supabase.from('mechanics_checklist_items').insert(itemRows);
```

**PROBLEMA CRÍTICO:** `part_request` NÃO está sendo extraído do `checklistData` e inserido no banco!

---

## 🚨 ROOT CAUSE

### Fluxo Atual (QUEBRADO):

```
┌─────────────────┐
│  page.tsx       │
│  itemPartReq    │  ← Usuário preenche modal
└────────┬────────┘
         │
         │ ❌ NÃO É ENVIADO ao hook
         ▼
┌─────────────────┐
│ saveChecklist() │
│ (hook)          │  ← Chama API SEM part_requests
└────────┬────────┘
         │
         │ POST /api/partner/checklist/submit
         ▼
┌─────────────────┐
│  Backend        │
│  submit/route   │  ← Payload NÃO tem part_requests
└────────┬────────┘
         │
         │ INSERT sem part_request
         ▼
┌─────────────────┐
│  Database       │
│  part_request   │  ← Sempre NULL
│  = NULL         │
└─────────────────┘
```

### Fluxo Correto (DEVERIA SER):

```
┌─────────────────┐
│  page.tsx       │
│  itemPartReq    │  ← Usuário preenche
└────────┬────────┘
         │
         │ ✅ Passa para hook via parâmetro
         ▼
┌─────────────────┐
│ saveChecklist() │
│ (recebe partReq)│  ← Inclui no payload
└────────┬────────┘
         │
         │ POST com part_requests
         ▼
┌─────────────────┐
│  Backend        │
│  lê partRequests│  ← Extrai do payload
└────────┬────────┘
         │
         │ INSERT com part_request
         ▼
┌─────────────────┐
│  Database       │
│  part_request   │  ← Salvo corretamente
│  = {...}        │
└─────────────────┘
```

---

## 🔧 CORREÇÃO NECESSÁRIA

### Mudança 1: Hook receber part_requests como parâmetro

**Arquivo:** `modules/partner/hooks/checklist/useChecklistOrchestrator.ts`

```typescript
// ANTES:
const saveChecklist = useCallback(async () => {
  const payload = {
    ...form,
    vehicle_id: vehicle.id,
    evidences: uploadedEvidenceUrls,
    // ❌ Falta part_requests
  };
  
  await put('/api/partner/checklist/submit', payload);
}, [vehicle, form, evidences]);

// DEPOIS:
const saveChecklist = useCallback(async (partRequestsData?: Record<string, unknown>) => {
  const payload = {
    ...form,
    vehicle_id: vehicle.id,
    evidences: uploadedEvidenceUrls,
    part_requests: partRequestsData || {}, // ✅ Adicionar ao payload
  };
  
  await put('/api/partner/checklist/submit', payload);
}, [vehicle, form, evidences]);
```

---

### Mudança 2: Page passar part_requests ao salvar

**Arquivo:** `app/dashboard/partner/checklist/page.tsx`

```typescript
// ANTES:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await saveChecklist(); // ❌ Não passa part_requests
    router.push('/dashboard');
  } catch {
    // Error handled
  }
};

// DEPOIS:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await saveChecklist(itemPartRequests); // ✅ Passa part_requests
    router.push('/dashboard');
  } catch {
    // Error handled
  }
};
```

---

### Mudança 3: Backend extrair e salvar part_requests

**Arquivo:** `app/api/partner/checklist/submit/route.ts`

```typescript
// ANTES (linha ~260):
const itemRows = itemDefs.map(({ key, notesKey }) => {
  const status = (checklistData as any)?.[key];
  const mappedStatus = checklistService.mapStatus(status);
  
  const row: Record<string, unknown> = {
    vehicle_id: checklistData.vehicle_id,
    item_key: key,
    item_status: mappedStatus,
    item_notes: (checklistData as any)?.[notesKey] || null,
    partner_id: partnerId,
    // ❌ Falta part_request
  };
  
  return row;
});

// DEPOIS:
const itemRows = itemDefs.map(({ key, notesKey }) => {
  const status = (checklistData as any)?.[key];
  const mappedStatus = checklistService.mapStatus(status);
  
  // ✅ Extrair part_request do payload
  const partRequestData = (checklistData.part_requests as Record<string, unknown>)?.[key] || null;
  
  const row: Record<string, unknown> = {
    vehicle_id: checklistData.vehicle_id,
    item_key: key,
    item_status: mappedStatus,
    item_notes: (checklistData as any)?.[notesKey] || null,
    part_request: partRequestData, // ✅ Incluir part_request
    partner_id: partnerId,
  };
  
  return row;
});
```

---

## 🧪 TESTE MANUAL

### 1. Preparação

```bash
# 1. Limpar dados antigos
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
DELETE FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';
"

# 2. Garantir que o servidor está rodando
pnpm dev
```

### 2. Teste no Browser

```
1. Login: mecanica@parceiro.com / 123qwe

2. Acessar:
   http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9

3. Preencher checklist:
   ✅ Clutch: NOK
   ✅ Observações: "Precisa trocar"
   
4. Solicitar peça:
   ✅ Clicar em "Solicitar Peça" do item Clutch
   ✅ Preencher:
      - Peça: Embreagem Kit Completo
      - Quantidade: 1
      - Observações: Urgente
   ✅ Salvar
   
5. Verificar se aparece o card:
   ✅ Deve aparecer "1 item solicitado"
   
6. Salvar checklist

7. Verificar no banco:
```

### 3. Verificação no Banco

```sql
-- Verificar items salvos
SELECT 
  id,
  item_key,
  item_status,
  item_notes,
  part_request::text as part_request_json,
  CASE 
    WHEN part_request IS NOT NULL THEN 'SIM ✅'
    ELSE 'NÃO ❌'
  END as tem_part_request
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
ORDER BY created_at DESC;

-- Verificar estrutura do part_request
SELECT 
  item_key,
  jsonb_pretty(part_request) as part_request_detalhado
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
  AND part_request IS NOT NULL;
```

### 4. Resultado Esperado

```
ANTES DO FIX:
┌──────────┬─────────────┬──────────────┬──────────────────┐
│ item_key │ item_status │ item_notes   │ tem_part_request │
├──────────┼─────────────┼──────────────┼──────────────────┤
│ clutch   │ NOK         │ Precisa...   │ NÃO ❌           │
└──────────┴─────────────┴──────────────┴──────────────────┘

DEPOIS DO FIX:
┌──────────┬─────────────┬──────────────┬──────────────────┐
│ item_key │ item_status │ item_notes   │ tem_part_request │
├──────────┼─────────────┼──────────────┼──────────────────┤
│ clutch   │ NOK         │ Precisa...   │ SIM ✅           │
└──────────┴─────────────┴──────────────┴──────────────────┘

part_request_detalhado:
{
  "peca": "Embreagem Kit Completo",
  "quantidade": 1,
  "observacoes": "Urgente"
}
```

---

## 🐛 DEBUG: Se ainda não funcionar

### Verificar Payload na Network Tab:

```javascript
// Chrome DevTools → Network → submit

// Request Payload deve conter:
{
  "vehicle_id": "...",
  "quote_id": "4d7d160a-1c8e-47e4-853e-efa9da78bdc9",
  "clutch": "NOK",
  "clutchNotes": "Precisa trocar",
  
  // ✅ Deve ter este campo:
  "part_requests": {
    "clutch": {
      "peca": "Embreagem Kit Completo",
      "quantidade": 1,
      "observacoes": "Urgente"
    }
  }
}
```

### Verificar Logs do Backend:

```bash
# Logs do Next.js
tail -f .next/trace

# Buscar por:
# - "submit_start"
# - "mechanics_checklist_items_prepared"
# - "mechanics_checklist_items_insert_ok"
```

### Adicionar Console.log Temporário:

```typescript
// submit/route.ts (linha ~260)
console.log('🔍 checklistData.part_requests:', checklistData.part_requests);

const itemRows = itemDefs.map(({ key, notesKey }) => {
  const partRequestData = (checklistData.part_requests as Record<string, unknown>)?.[key];
  console.log(`🔍 Item ${key} - part_request:`, partRequestData);
  
  // ... resto do código
});
```

---

## 📊 RESUMO

### ❌ Problema:
- `part_request` não está sendo salvo no banco
- Frontend gerencia estado local, mas não envia para backend
- Backend não extrai `part_requests` do payload

### ✅ Solução:
1. Hook aceitar `partRequests` como parâmetro
2. Page passar `itemPartRequests` ao chamar `saveChecklist()`
3. Backend extrair `part_requests` do payload e incluir no INSERT

### 🎯 Prioridade:
**ALTA** - Feature não funciona, usuário não consegue solicitar peças

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] 1. Modificar `useChecklistOrchestrator.ts` (aceitar parâmetro)
- [ ] 2. Modificar `page.tsx` (passar itemPartRequests)
- [ ] 3. Modificar `submit/route.ts` (extrair e salvar part_request)
- [ ] 4. Testar manualmente (criar part_request)
- [ ] 5. Verificar no banco (SELECT com part_request IS NOT NULL)
- [ ] 6. Testar reload (part_request deve aparecer após recarregar página)
- [ ] 7. Criar teste E2E

---

**Próximo Passo:** Aplicar as 3 correções listadas acima.

**Referências:**
- Bug Report: `docs/FIX_EVIDENCES_SCHEMA_MISMATCH.md`
- Arquitetura: `docs/CHECKLIST_ARCHITECTURE_DIAGRAM.md`
