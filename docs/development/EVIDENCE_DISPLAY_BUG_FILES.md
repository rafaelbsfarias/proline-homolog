# Arquivos Envolvidos no Fluxo de Evidências do Checklist

## 📋 Problema Atual
**Sintoma**: Ao atualizar a página, apenas a última imagem é exibida, mesmo tendo 3 imagens no storage e 3 referências no banco de dados.

---

## 🔍 Arquivos Envolvidos (Por Camada)

### 1️⃣ **BANCO DE DADOS**

#### Tabela
- `mechanics_checklist_evidences` - Armazena referências das evidências

#### Storage
- Bucket: `vehicle-media`
- Estrutura: `<vehicle_id>/<partner_id>/evidences/<item_key>/<filename>`

---

### 2️⃣ **BACKEND - API Routes**

#### Endpoints de Checklist
```
app/api/partner/checklist/
├── submit/route.ts          ⭐ SALVA evidências no banco
├── load/route.ts            ⭐ CARREGA evidências do banco
├── upload-evidence/route.ts ⭐ FAZ UPLOAD para storage
├── init/route.ts            - Inicializa checklist
├── save-anomalies/route.ts  - Salva anomalias
└── load-anomalies/route.ts  - Carrega anomalias
```

#### Endpoint Legado
```
app/api/partner-checklist/route.ts ⭐ API antiga (pode estar em uso)
```

---

### 3️⃣ **BACKEND - Services & Repositories**

#### Services
```
modules/partner/services/checklist/
├── ChecklistService.ts              ⭐ Serviço principal
├── evidences/
│   ├── EvidenceRepository.ts        ⭐ CRUD de evidências
│   ├── EvidenceService.ts           ⭐ Lógica de negócio
│   └── SignedUrlGenerator.ts        ⭐ Gera URLs assinadas
├── core/
│   ├── ChecklistMapper.ts           - Mapeia dados
│   └── ChecklistRepository.ts       - CRUD de checklist
└── items/
    └── ChecklistItemService.ts      - CRUD de items
```

#### Mappers
```
modules/partner/checklist/mappers/
└── ChecklistMappers.ts              ⭐ Mapeia evidências com URLs
    ├── mapEvidencesWithUrls()       ⭐ CONVERTE paths em URLs
    ├── mapItemsWithEvidences()      ⭐ ASSOCIA evidências aos itens
    └── mapItemsByCategory()         - Agrupa por categoria
```

#### Repositories
```
modules/partner/checklist/repositories/
└── MechanicsChecklistRepository.ts  ⭐ Queries do banco
    ├── getEvidencesByContext()      ⭐ BUSCA evidências
    └── getItemsByContext()          - Busca items
```

---

### 4️⃣ **FRONTEND - Hooks**

```
modules/partner/hooks/checklist/
├── useChecklistOrchestrator.ts      ⭐ ORQUESTRA todo o fluxo
│   ├── load()                       ⭐ CARREGA do backend
│   ├── saveChecklist()              ⭐ SALVA no backend
│   └── setFromUrlMap()              ⭐ SETA evidências no estado
├── useChecklistEvidences.ts         ⭐ GERENCIA estado das evidências
│   ├── addEvidence()                - Adiciona evidência
│   ├── removeEvidence()             - Remove evidência
│   └── setFromUrlMap()              ⭐ CONVERTE URLs em estado
├── useChecklistForm.ts              - Gerencia formulário
└── useChecklistAnomalies.ts         - Gerencia anomalias
```

---

### 5️⃣ **FRONTEND - Components**

#### Página Principal
```
app/dashboard/partner/checklist/page.tsx ⭐ PÁGINA PRINCIPAL
├── Usa: useChecklistOrchestrator
├── Passa: evidences para PartnerChecklistGroups
└── Renderiza: Loading, Error, Success states
```

#### Componentes de Checklist
```
modules/partner/components/checklist/
├── PartnerChecklistGroups.tsx       ⭐ RENDERIZA grupos de itens
│   └── Passa evidences para PhotoUpload
├── PhotoUpload.tsx                  ⭐ COMPONENTE DE UPLOAD/DISPLAY
│   ├── Exibe: Imagens existentes
│   ├── Upload: Novas imagens
│   └── Delete: Remove imagens
├── DynamicChecklistForm.tsx         - Formulário dinâmico
└── ChecklistSkeleton.tsx            - Loading state
```

---

### 6️⃣ **TIPOS E SCHEMAS**

```
modules/partner/types/
└── checklist.ts                     ⭐ TIPOS TypeScript
    ├── EvidenceItem                 ⭐ { file?, url?, id? }
    ├── EvidenceState                ⭐ Record<EvidenceKey, EvidenceItem[]>
    └── PartnerChecklistForm         - Formulário

modules/partner/checklist/
└── schemas.ts                       ⭐ SCHEMAS Zod
    ├── EvidenceRow                  - Row do banco
    └── ChecklistItemRow             - Item do banco

modules/partner/services/checklist/types/
├── EvidenceTypes.ts                 - Tipos de evidências
├── ChecklistTypes.ts                - Tipos de checklist
└── index.ts                         - Exportações
```

---

### 7️⃣ **CONSTANTES**

```
modules/partner/constants/
└── checklist.ts                     ⭐ EVIDENCE_KEYS
    └── EVIDENCE_KEYS: EvidenceKey[] - Lista de chaves válidas

modules/common/constants/
└── database.ts                      ⭐ Nomes de tabelas
    └── TABLES.MECHANICS_CHECKLIST_EVIDENCES
```

---

## 🔄 FLUXO COMPLETO (Load)

### Quando a página carrega:

```
1. page.tsx
   └── useChecklistOrchestrator()
       └── useEffect(() => load())
           
2. load() (useChecklistOrchestrator.ts:80-140)
   └── GET /api/partner-checklist?vehicleId=xxx&quoteId=xxx
   
3. /api/partner-checklist/route.ts (LEGADO) OU
   /api/partner/checklist/load/route.ts (NOVO)
   └── ChecklistService.getMechanicsChecklist()
       └── EvidenceRepository.findByContext()
           ├── Query: mechanics_checklist_evidences
           └── Return: EvidenceRow[]
       
4. ChecklistMappers.ts
   ├── mapEvidencesWithUrls(evidences)
   │   └── Para cada evidência:
   │       └── Gera signed URL
   ├── mapItemsWithEvidences(items, evidencesWithUrls)
   │   └── Para cada item:
   │       └── Filtra evidências por item_key ⚠️ POTENCIAL PROBLEMA
   └── Return: { form, evidences: Record<string, {url}> }
   
5. useChecklistOrchestrator.ts (linha ~110)
   └── setFromUrlMap(loadedEvidences)
   
6. useChecklistEvidences.ts
   └── setFromUrlMap()
       └── Para cada key em evidences:
           └── set(key, [{ url, id }]) ⚠️ PODE ESTAR PEGANDO APENAS 1
           
7. page.tsx
   └── Renderiza PartnerChecklistGroups
       └── evidences={evidences} ⚠️ Estado pode estar errado aqui
       
8. PartnerChecklistGroups.tsx
   └── Renderiza PhotoUpload
       └── items={evidences[itemKey] || []} ⚠️ Array pode ter apenas 1 item
       
9. PhotoUpload.tsx
   └── items.map() ⚠️ Renderiza apenas o que tem no array
```

---

## 🔄 FLUXO COMPLETO (Save)

### Quando o usuário salva:

```
1. page.tsx
   └── onClick={() => saveChecklist(itemPartRequests)}
   
2. saveChecklist() (useChecklistOrchestrator.ts:145-230)
   ├── Preserva evidências existentes (linha ~163-173)
   │   └── Para cada evidência com URL mas sem file:
   │       └── Extrai storage_path da URL
   │       └── Adiciona ao uploadedEvidenceUrls[key]
   │
   ├── Upload novos arquivos (linha ~179-203)
   │   └── Para cada evidência com file:
   │       └── POST /api/partner/checklist/upload-evidence
   │       └── Adiciona storage_path ao uploadedEvidenceUrls[key]
   │
   └── PUT /api/partner/checklist/submit
       └── payload.evidences = uploadedEvidenceUrls
       
3. /api/partner/checklist/submit/route.ts (linha 330-415)
   ├── Log: evidences_processing_start
   ├── Para cada item_key em checklistData.evidences:
   │   └── Para cada path no array:
   │       └── Cria row com media_url
   │
   ├── Busca evidências existentes (linha ~377-390)
   │   └── SELECT media_url FROM mechanics_checklist_evidences
   │   └── WHERE vehicle_id AND partner_id AND quote_id
   │
   ├── Filtra apenas novas (linha ~393-398)
   │   └── newRows = rows.filter(url not in existingUrls)
   │
   └── INSERT apenas novas (linha ~401-411)
       └── INSERT INTO mechanics_checklist_evidences
```

---

## ⚠️ PONTOS SUSPEITOS (Onde pode estar o bug)

### 🔴 **ALTA PRIORIDADE**

1. **`useChecklistEvidences.ts` - setFromUrlMap()**
   ```typescript
   // SUSPEITA: Pode estar convertendo Object em array de 1 elemento
   setFromUrlMap(urlMap: Record<string, { url: string }>)
   ```
   - ❓ Como converte `{ clutch: { url: "..." } }` em `EvidenceItem[]`?
   - ❓ Está criando array com 1 ou N elementos?

2. **`ChecklistMappers.ts` - mapItemsWithEvidences()**
   ```typescript
   // SUSPEITA: O filter pode estar retornando apenas 1 evidência
   evidences: evidencesWithUrls.filter(ev => ev.item_key === item.item_key)
   ```
   - ❓ `evidencesWithUrls` tem 3 elementos?
   - ❓ O filter está funcionando corretamente?

3. **`/api/partner-checklist/route.ts` (LEGADO)**
   ```typescript
   // SUSPEITA: Pode estar retornando formato errado
   return { evidences: Record<string, {url}> }
   ```
   - ❓ Qual formato está retornando?
   - ❓ Está agregando múltiplas evidências por item_key?

### 🟡 **MÉDIA PRIORIDADE**

4. **`EvidenceRepository.ts` - findByContext()**
   ```typescript
   // SUSPEITA: Query pode estar limitando resultados
   SELECT * FROM mechanics_checklist_evidences WHERE ...
   ```
   - ❓ Tem LIMIT 1?
   - ❓ Está retornando todas as 3 rows?

5. **`PhotoUpload.tsx` - Renderização**
   ```typescript
   // SUSPEITA: Pode estar renderizando apenas o primeiro
   items={evidences[itemKey] || []}
   ```
   - ❓ `evidences[itemKey]` é array de 3 ou 1?
   - ❓ O map() está iterando corretamente?

---

## 🎯 PRÓXIMOS PASSOS PARA DEBUG

### 1. Verificar o que o backend retorna
```bash
# Ver o que a API retorna
curl http://localhost:3000/api/partner-checklist?vehicleId=xxx&quoteId=xxx
```

### 2. Adicionar logs no frontend
```typescript
// Em useChecklistOrchestrator.ts linha ~110
console.log('loadedEvidences:', loadedEvidences);

// Em useChecklistEvidences.ts no setFromUrlMap
console.log('Setting evidences from URL map:', urlMap);
console.log('Result state:', evidences);
```

### 3. Verificar estado do hook
```typescript
// Em page.tsx linha ~25
console.log('evidences state:', evidences);
console.log('clutch evidences:', evidences.clutch);
```

### 4. Verificar mappers
```typescript
// Em ChecklistMappers.ts
console.log('evidencesWithUrls:', evidencesWithUrls);
console.log('itemsWithEvidences:', result);
```

---

## 📊 DIAGNÓSTICO ATUAL

**Confirmado no Banco:**
- ✅ Storage: 3 imagens
- ✅ Banco: 3 referências em `mechanics_checklist_evidences`

**Problema:**
- ❌ Frontend exibe apenas 1 imagem

**Hipótese:**
O problema está na **conversão dos dados** entre backend → frontend ou na **estrutura do estado** do React.

---

## 🔗 Arquivos de Teste/Debug Criados

```
scripts/
├── debug-evidences-issue.sh        - Diagnóstico do problema
├── restore-orphan-evidences.sh     - Restauração de órfãs
└── test-evidence-persistence.sh    - Teste de persistência

docs/development/
├── BUG_EVIDENCES_DISAPPEARING.md   - Doc do bug anterior
└── FIX_EVIDENCE_PERSISTENCE_ISSUE.md - Fix anterior
```

---

## 📝 RESUMO DOS ARQUIVOS CRÍTICOS

### **MUST CHECK** (Mais prováveis de ter o bug)

1. ⭐ `modules/partner/hooks/checklist/useChecklistEvidences.ts` - setFromUrlMap()
2. ⭐ `modules/partner/checklist/mappers/ChecklistMappers.ts` - mapItemsWithEvidences()
3. ⭐ `app/api/partner-checklist/route.ts` - Formato de retorno
4. ⭐ `modules/partner/components/checklist/PhotoUpload.tsx` - Renderização

### **SHOULD CHECK** (Podem ter impacto)

5. 🔶 `modules/partner/services/checklist/evidences/EvidenceRepository.ts` - Query
6. 🔶 `modules/partner/hooks/checklist/useChecklistOrchestrator.ts` - load()
7. 🔶 `app/dashboard/partner/checklist/page.tsx` - Props passing

---

**Data**: 14 de Outubro de 2025  
**Status**: 🔍 Investigação em andamento  
**Banco**: ✅ Correto (3 referências)  
**Storage**: ✅ Correto (3 imagens)  
**Frontend**: ❌ Exibindo apenas 1 imagem
