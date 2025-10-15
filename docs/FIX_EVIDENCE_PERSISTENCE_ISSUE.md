# 🐛 Correção Final: Evidências Não Persistem nas Referências do Banco

## 🎯 Problema Real Identificado

**Status Storage:** ✅ 2 imagens salvas corretamente  
**Status Banco:** ❌ 0 referências na tabela `mechanics_checklist_evidences`

### Cenário do Bug

```
1. Usuário faz upload de 2 fotos para item "clutch" ✅
2. Fotos são salvas no storage ✅
3. Usuário clica em "Salvar Checklist"
4. Backend recebe payload com evidences: {} (vazio!) ❌
5. Nenhuma referência é salva no banco ❌
6. Usuário recarrega página
7. Fotos não aparecem (banco não tem as referências) ❌
```

## 🔍 Causa Raiz

O hook `useChecklistOrchestrator` tinha uma lógica que **apenas fazia upload de NOVOS arquivos**:

```typescript
// LÓGICA ANTIGA ❌
const uploadedEvidenceUrls = { clutch: [], sparkPlugs: [], ... };

// Só adiciona se tiver ev.file (novo upload)
if (ev?.file) {
  // Upload e adiciona ao array
  uploadedEvidenceUrls[key].push(storage_path);
}

// Resultado: Se não há novos uploads, evidences fica vazio!
// payload.evidences = { clutch: [], sparkPlugs: [], ... } ❌
```

### Por Que Isso Acontecia?

Ao **recarregar a página**, o sistema:

1. ✅ Busca evidências do banco (mas banco está vazio!)
2. ✅ Retorna `evidences: {}` (vazio)
3. ❌ Estado do hook fica sem as fotos que estão no storage
4. ❌ Ao salvar, não há `ev.file` (pois não há novos uploads)
5. ❌ `uploadedEvidenceUrls` fica vazio
6. ❌ Backend não salva nenhuma referência

### Loop Vicioso

```
Storage: ✅ Tem fotos
Banco:   ❌ Sem referências
  ↓
Load:    ❌ Não encontra referências
Estado:  ❌ Sem evidências
  ↓
Save:    ❌ Envia evidences: {}
Banco:   ❌ Continua vazio
  ↓
(Repete infinitamente)
```

## ✅ Solução Implementada

Modificar o hook para **preservar evidências existentes** antes de fazer novos uploads.

### Arquivo Modificado

`modules/partner/hooks/checklist/useChecklistOrchestrator.ts` (linhas 141-176)

### Código Corrigido

```typescript
// NOVA LÓGICA ✅
const uploadedEvidenceUrls = { clutch: [], sparkPlugs: [], ... };

// PASSO 1: Preservar evidências já existentes (que vieram com URL)
for (const key of EVIDENCE_KEYS) {
  const items = evidences[key] || [];
  for (const ev of items) {
    if (ev?.url && !ev?.file) {
      // Extrair storage_path da URL assinada
      const urlObj = new URL(ev.url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/vehicle-media\/(.+)\?/);
      const storagePath = pathMatch ? pathMatch[1] : ev.url;
      uploadedEvidenceUrls[key].push(storagePath);
    }
  }
}

// PASSO 2: Fazer upload de novos arquivos
if (hasFiles) {
  for (const key of EVIDENCE_KEYS) {
    for (const ev of evidences[key] || []) {
      if (ev?.file) {
        // Upload...
        uploadedEvidenceUrls[key].push(storage_path);
      }
    }
  }
}

// Resultado: evidences sempre contém TODAS as evidências! ✅
```

### Fluxo Corrigido

```
Upload inicial:
  1. User faz upload de 2 fotos → storage ✅
  2. ev.file existe → faz upload
  3. uploadedEvidenceUrls = { clutch: ["path1", "path2"] } ✅
  4. Backend salva 2 referências no banco ✅
  
Reload e save novamente:
  1. Load busca banco → encontra 2 referências ✅
  2. Estado fica com ev.url (sem ev.file) ✅
  3. PASSO 1: Preserva paths existentes ✅
  4. uploadedEvidenceUrls = { clutch: ["path1", "path2"] } ✅
  5. Backend mantém 2 referências no banco ✅
```

## 🧪 Como Testar

### Teste 1: Upload Inicial

```bash
# 1. Limpar banco
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
DELETE FROM mechanics_checklist_evidences;
"

# 2. Acessar checklist
# http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9

# 3. Fazer upload de 2 fotos no item "clutch"
# 4. Salvar checklist
# 5. Verificar banco:

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT item_key, COUNT(*) as quantidade 
FROM mechanics_checklist_evidences 
GROUP BY item_key;
"

# Resultado esperado:
# item_key | quantidade
# ---------+-----------
# clutch   | 2
```

### Teste 2: Reload e Persistência

```bash
# 1. Pressionar F5 no navegador
# 2. Verificar se 2 fotos aparecem no card de "clutch" ✅
# 3. NÃO adicionar novas fotos
# 4. Salvar checklist novamente
# 5. Verificar banco:

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT item_key, COUNT(*) as quantidade 
FROM mechanics_checklist_evidences 
GROUP BY item_key;
"

# Resultado esperado (mesmas 2 fotos):
# item_key | quantidade
# ---------+-----------
# clutch   | 2
```

### Teste 3: Adicionar Mais Fotos

```bash
# 1. Com as 2 fotos já carregadas
# 2. Adicionar mais 1 foto
# 3. Salvar checklist
# 4. Verificar banco:

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT item_key, COUNT(*) as quantidade 
FROM mechanics_checklist_evidences 
GROUP BY item_key;
"

# Resultado esperado (3 fotos):
# item_key | quantidade
# ---------+-----------
# clutch   | 3
```

## 📊 Antes vs Depois

| Cenário | Antes ❌ | Depois ✅ |
|---------|---------|-----------|
| Upload inicial | 0 refs no banco | 2 refs no banco |
| Reload + display | Fotos não aparecem | Fotos aparecem |
| Save após reload | 0 refs (apaga tudo!) | 2 refs mantidas |
| Adicionar mais | Perde anteriores | Mantém + adiciona |

## 🔧 Detalhes Técnicos

### Extração do Storage Path

As URLs retornadas pelo `load` são assinadas:
```
https://xxx.supabase.co/storage/v1/object/sign/vehicle-media/uuid/uuid/evidences/clutch/file.jpg?token=xxx
```

Precisamos extrair apenas o path:
```
uuid/uuid/evidences/clutch/file.jpg
```

**Regex usado:**
```typescript
const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/vehicle-media\/(.+)\?/);
```

### Estados das Evidências

```typescript
// Estado 1: Novo upload (ainda não salvo)
{ file: File, url: undefined, id: "temp-123" }

// Estado 2: Carregado do banco
{ file: undefined, url: "https://...signed-url", id: "clutch-0" }

// Estado 3: Novo upload (blob local)
{ file: File, url: "blob:http://localhost:3000/...", id: "temp-456" }
```

**Lógica de decisão:**
- `ev.url && !ev.file` → Evidência existente (preservar)
- `ev.file` → Novo upload (fazer upload)
- Sem nenhum → Ignorar

## ⚠️ Observações Importantes

1. **URLs Expiram:** As URLs assinadas expiram em 1 hora. Isso é normal, o sistema gera novas ao carregar.

2. **Duplicação:** O código **não** verifica duplicatas. Se houver lógica para remover evidências, implementar no frontend.

3. **Performance:** Para muitas evidências (>10 por item), considerar batch upload.

4. **Rollback:** Se houver problemas, reverter mudança:
   ```bash
   git checkout HEAD~1 -- modules/partner/hooks/checklist/useChecklistOrchestrator.ts
   ```

## 📝 Arquivos Relacionados

| Arquivo | Status | Função |
|---------|--------|--------|
| `useChecklistOrchestrator.ts` | ✅ Corrigido | Preserva evidências existentes |
| `submit/route.ts` | ✅ Corrigido | Achata arrays de evidências |
| `upload-evidence/route.ts` | ✅ OK | Upload funciona corretamente |
| `load/route.ts` | ✅ OK | Retorna evidências com URLs |

## ✅ Checklist de Validação

- [ ] Upload inicial salva referências no banco
- [ ] Reload exibe todas as fotos
- [ ] Save após reload mantém referências
- [ ] Adicionar mais fotos não perde anteriores
- [ ] Remover fotos funciona corretamente
- [ ] Múltiplos items com evidências funcionam
- [ ] Lightbox exibe todas as imagens

---

**Status:** ✅ Implementado  
**Data:** 2025-10-14  
**Prioridade:** 🔴 CRÍTICO  
**Testado:** ⏸️ Aguardando teste manual

## 🚀 Próximos Passos

1. **Testar upload inicial** (Teste 1)
2. **Testar persistência** (Teste 2)
3. **Testar adição incremental** (Teste 3)
4. Se tudo funcionar: **commit e deploy**

**Comando de teste rápido:**
```bash
# Limpar e testar
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "DELETE FROM mechanics_checklist_evidences;"

# Acessar, fazer upload, salvar, verificar
# http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9
```
