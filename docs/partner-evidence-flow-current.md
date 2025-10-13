# FLUXO ATUAL - Como Funciona o "Hack"

## 1️⃣ PARCEIRO ACESSA CHECKLIST

### URL:
```
/partner/checklist?quoteId={quote_id}
```

### API: `/api/partner/get-vehicle-from-inspection`

```typescript
// Fluxo por quoteId:
Quote → service_order → inspection (DO ESPECIALISTA!) → vehicle

// Retorna:
{
  vehicle: { id, brand, model, plate },
  inspection: { 
    id: "abc-123",  ← ID DA INSPEÇÃO DO ESPECIALISTA!
    inspection_date,
    odometer,
    fuel_level
  },
  inspectionId: "abc-123"  ← ISSO É O "EMPRÉSTIMO"
}
```

**O QUE ACONTECE:**
- Parceiro busca dados pelo `quote_id`
- API retorna `service_orders.source_inspection_id` 
- **Este inspection_id É DO ESPECIALISTA!**
- Parceiro "pega emprestado" este ID

---

## 2️⃣ PARCEIRO SALVA EVIDÊNCIAS DE MECÂNICA

### Hook: `usePartnerChecklist.ts`

```typescript
// Linha ~460
const formData = new FormData();
formData.append('vehicle_id', vehicle.id);
formData.append('item_key', 'clutch');  // exemplo
formData.append('file', file);

// ❌ NÃO ENVIA inspection_id AQUI!
```

### API: `/api/partner/checklist/upload-evidence`

```typescript
// Recebe:
{
  vehicle_id: "xyz-789",
  item_key: "clutch",
  file: File
}

// Salva no Storage:
// Path: {vehicle_id}/{partner_id}/itens/{filename}

// ❌ NÃO SALVA NO BANCO mechanics_checklist_evidences!
```

**PROBLEMA DESCOBERTO:**
- Upload de evidência **NÃO salva no banco**!
- Apenas salva arquivo no Storage
- Por isso imagens não aparecem!

---

## 3️⃣ PARCEIRO SALVA CHECKLIST COMPLETO

### API: `/api/partner/checklist/submit`

```typescript
// Linha ~161 - submit/route.ts
// Persiste evidências no banco:

const rows = entries.map(([item_key, storage_path]) => ({
  inspection_id: checklistData.inspection_id,  ← USA inspection DO ESPECIALISTA
  vehicle_id: checklistData.vehicle_id,
  item_key,
  storage_path,
}));

await supabase
  .from('mechanics_checklist_evidences')
  .upsert(rows, { onConflict: 'inspection_id,item_key' });
```

**O "HACK" FUNCIONA AQUI:**
- `inspection_id` vem do formulário
- Hook envia `inspection.id` (do especialista)
- Salva evidências com `inspection_id` emprestado
- **Por isso funcionava antes!**

---

## 4️⃣ PARCEIRO SALVA ANOMALIAS (FUNILARIA)

### API: `/api/partner/checklist/save-anomalies`

```typescript
// Linha ~157
processedAnomalies.push({
  inspection_id,  ← USA inspection DO ESPECIALISTA
  vehicle_id,
  description,
  photos: allPhotoPaths,
});

await supabase
  .from('vehicle_anomalies')
  .insert(processedAnomalies);
```

**MESMO "HACK":**
- `inspection_id` vem do FormData
- Hook envia inspection.id emprestado
- Salva anomalias com inspection do especialista

---

## 5️⃣ CLIENTE VÊ EVIDÊNCIAS

### API: `/api/vehicle-partner-evidences`

```typescript
// ANTES (commit 605d883):
await supabase
  .from('mechanics_checklist_evidences')
  .select('item_key, storage_path')
  .eq('inspection_id', inspectionId)  ← OBRIGATÓRIO
  .eq('vehicle_id', vehicleId);

// DEPOIS (commit ba98c8d):
let query = supabase
  .from('mechanics_checklist_evidences')
  .select('item_key, storage_path')
  .eq('vehicle_id', vehicleId);

if (inspectionId) {  ← OPCIONAL
  query = query.eq('inspection_id', inspectionId);
}
```

**O QUE QUEBROU:**
- Commit 605d883 tornou `inspection_id` obrigatório
- Queries sem inspection válido falhavam
- Por isso imagens pararam de aparecer

---

## ❌ PROBLEMAS DO HACK

### 1. Semântico
```
❌ Evidências de PARCEIRO salvas com inspection_id de ESPECIALISTA
❌ Mistura contextos diferentes (inspeção vs orçamento)
❌ Difícil rastrear "quem fez o quê"
```

### 2. Técnico
```
❌ Schema exige inspection_id NOT NULL
❌ Parceiros não têm inspection próprio
❌ Dependência do inspection do especialista
❌ Se especialista não fez inspeção, parceiro não consegue salvar
```

### 3. Queries
```
❌ Buscar por inspection_id retorna TUDO (especialista + parceiros)
❌ Não dá pra filtrar apenas evidências de parceiros
❌ Não dá pra filtrar por parceiro específico
```

---

## 🔧 POR QUE FUNCIONAVA ANTES?

**Checklist de Mecânica:**
1. Parceiro fazia upload de foto
2. Ao salvar checklist completo (submit), persistia no banco
3. Cliente buscava por vehicle_id + inspection_id
4. Encontrava evidências (mesmo com inspection errado)
5. **Funcionava acidentalmente!**

**O que quebrou:**
- Commit tentou "corrigir" tornando inspection_id obrigatório
- Mas não corrigiu a lógica do "empréstimo"
- Queries falhavam quando inspection não batia

---

## ✅ ESTADO APÓS COMMIT ba98c8d

**Mitigação temporária:**
- `inspection_id` tornado opcional nas queries
- Busca por `vehicle_id` primeiro
- Filtra por `inspection_id` se fornecido
- **Sistema volta a funcionar com hack**

**Ainda não corrigido:**
- Schema continua exigindo inspection_id NOT NULL
- Parceiros continuam usando inspection emprestado
- Problema estrutural permanece
