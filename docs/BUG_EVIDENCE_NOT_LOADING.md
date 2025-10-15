# 🐛 Bug Fix: Evidências Não Sendo Recuperadas no Frontend

## 🎯 Problema Identificado

**Sintoma:** Evidências são salvas corretamente no Supabase Storage, mas não aparecem no frontend ao recarregar a página.

**Causa Raiz:** Backend não estava salvando as referências das evidências na tabela `mechanics_checklist_evidences`.

## 🔍 Análise Técnica

### Fluxo Esperado

```
1. Frontend faz upload → /api/partner/checklist/upload-evidence
   ↓
2. Storage retorna: { storage_path: "uuid/uuid/evidences/sparkPlugs/file.jpg" }
   ↓
3. Frontend acumula paths: { sparkPlugs: ["path1.jpg", "path2.jpg"] }
   ↓
4. Frontend envia payload: { evidences: { sparkPlugs: ["path1.jpg"] }, ... }
   ↓
5. Backend salva em mechanics_checklist_evidences ✅
   ↓
6. Reload: Backend busca evidências → Frontend renderiza ✅
```

### O Que Estava Acontecendo (BUG)

```typescript
// Backend (submit/route.ts) - ANTES ❌
const entries = Object.entries(checklistData.evidences) as [string, string][];
//                                                            ^^^^^^^^^^^^^^
//                                                            Esperava string, mas recebia string[]

const rows = entries
  .filter(([, path]) => !!path && String(path).trim() !== '')
  //           ^^^^ path era ["path1", "path2"], String() viraria "path1,path2"
  .map(([item_key, storage_path]) => { ... });
  //                ^^^^^^^^^^^^^ Tentava salvar array inteiro como string
```

**Resultado:** Nenhuma evidência era salva na tabela!

```sql
SELECT * FROM mechanics_checklist_evidences;
-- 0 rows (vazio!)
```

## ✅ Correção Aplicada

### Arquivo Modificado

**`app/api/partner/checklist/submit/route.ts`** (linhas 315-341)

### Mudança no Código

```typescript
// ANTES ❌
const entries = Object.entries(checklistData.evidences) as [string, string][];
const rows = entries
  .filter(([, path]) => !!path && String(path).trim() !== '')
  .map(([item_key, storage_path]) => {
    const row: Record<string, unknown> = {
      vehicle_id: checklistData.vehicle_id,
      item_key,
      media_url: storage_path,
      media_type: 'image',
      partner_id: partnerId,
    };
    // ... adicionar quote_id/inspection_id
    return row;
  });
```

```typescript
// DEPOIS ✅
const rows: Array<Record<string, unknown>> = [];

Object.entries(checklistData.evidences).forEach(([item_key, paths]) => {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  //                ^^^^^^^^^^^^^^^^^^^^ Suporta tanto string quanto string[]
  
  pathArray.forEach(storage_path => {
    if (storage_path && String(storage_path).trim() !== '') {
      const row: Record<string, unknown> = {
        vehicle_id: checklistData.vehicle_id,
        item_key,
        media_url: storage_path,  // Uma row por arquivo
        media_type: 'image',
        partner_id: partnerId,
      };
      // ... adicionar quote_id/inspection_id
      rows.push(row);
    }
  });
});
```

### Benefícios da Correção

1. ✅ **Suporta múltiplas evidências por item**
   ```typescript
   // Se enviar:
   { sparkPlugs: ["path1.jpg", "path2.jpg"] }
   
   // Salva 2 rows:
   // Row 1: { item_key: "sparkPlugs", media_url: "path1.jpg" }
   // Row 2: { item_key: "sparkPlugs", media_url: "path2.jpg" }
   ```

2. ✅ **Retrocompatível com formato antigo**
   ```typescript
   // Se enviar (formato legacy):
   { sparkPlugs: "path1.jpg" }
   
   // Também funciona! (converte para array)
   ```

3. ✅ **Validação robusta**
   - Ignora arrays vazios
   - Ignora strings vazias
   - Trim em todas as strings

## 🧪 Como Testar

### Teste Automatizado

```bash
# Executar script interativo
bash /home/rafael/workspace/proline-homolog/scripts/test-evidence-flow.sh
```

### Teste Manual

1. **Limpar dados:**
   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
   DELETE FROM mechanics_checklist_items WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';
   DELETE FROM mechanics_checklist_evidences WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';
   "
   ```

2. **Acessar checklist:**
   - URL: http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9
   - Login: mecanica@parceiro.com / 123qwe

3. **Adicionar evidência:**
   - Marcar "Velas de ignição" como NOK
   - Clicar em "Adicionar evidência"
   - Fazer upload de uma imagem
   - Salvar checklist

4. **Verificar no banco:**
   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
   SELECT item_key, media_url FROM mechanics_checklist_evidences 
   WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';
   "
   ```
   
   **Resultado esperado:**
   ```
   item_key   | media_url
   -----------+-----------------------------------------------
   sparkPlugs | uuid/uuid/evidences/sparkPlugs/arquivo.jpg
   ```

5. **Testar recuperação:**
   - Pressionar F5 no navegador
   - Verificar se a imagem aparece no card
   - Clicar em "Visualizar evidências (1)"
   - Confirmar que o lightbox abre com a imagem

### Verificação de Múltiplas Evidências

```bash
# 1. Adicionar 3 fotos diferentes para o mesmo item
# 2. Salvar
# 3. Verificar banco:

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 
  item_key, 
  COUNT(*) as quantidade_evidencias 
FROM mechanics_checklist_evidences 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9'
GROUP BY item_key;
"

# Resultado esperado:
# item_key   | quantidade_evidencias
# -----------+----------------------
# sparkPlugs | 3
```

## 📊 Impacto

### Antes da Correção ❌
```
Upload: ✅ Funciona (storage salva arquivo)
Banco:  ❌ Vazio (nenhuma row salva)
Load:   ❌ Retorna {} (nenhuma evidência)
Frontend: ❌ Não exibe nada
```

### Depois da Correção ✅
```
Upload: ✅ Funciona (storage salva arquivo)
Banco:  ✅ Salva rows (uma por arquivo)
Load:   ✅ Retorna { sparkPlugs: { url: "..." } }
Frontend: ✅ Exibe evidências + lightbox funciona
```

## 🔄 Compatibilidade

| Cenário | Status |
|---------|--------|
| Evidência única | ✅ Funciona |
| Múltiplas evidências | ✅ Funciona |
| Formato legacy (string) | ✅ Funciona (autoconverte) |
| Formato novo (array) | ✅ Funciona |
| Arrays vazios | ✅ Ignora corretamente |
| Strings vazias | ✅ Ignora corretamente |

## 🐛 Debug

### Se evidências ainda não aparecem:

1. **Verificar console do navegador (F12):**
   ```javascript
   // Procurar por erros relacionados a:
   - "load"
   - "evidence"
   - "signed url"
   ```

2. **Verificar Network tab:**
   ```
   POST /api/partner/checklist/load
   
   Response esperada:
   {
     "ok": true,
     "data": {
       "evidences": {
         "sparkPlugs": { "url": "https://..." }
       }
     }
   }
   ```

3. **Verificar logs do backend:**
   ```bash
   # No terminal onde `npm run dev` está rodando:
   # Procurar por:
   - "mechanics_checklist_evidences_insert_ok"
   - "evidences_loaded_with_urls"
   ```

4. **Verificar permissões do storage:**
   ```sql
   -- No Supabase Dashboard → Storage → vehicle-media
   -- Policies devem permitir:
   -- SELECT para authenticated users
   ```

## 📚 Arquivos Relacionados

| Arquivo | Função |
|---------|--------|
| `app/api/partner/checklist/submit/route.ts` | ✅ Corrigido - Salva evidências |
| `app/api/partner/checklist/upload-evidence/route.ts` | ✅ OK - Upload funciona |
| `modules/partner/hooks/checklist/useChecklistOrchestrator.ts` | ✅ OK - Envia evidências |
| `modules/partner/services/checklist/evidences/EvidenceService.ts` | ✅ OK - Carrega evidências |
| `modules/partner/components/checklist/PartnerChecklistGroups.tsx` | ✅ OK - Renderiza evidências |

## ✅ Checklist de Validação

Após aplicar correção:

- [ ] Evidências são salvas no storage ✅ (já funcionava)
- [ ] Evidências são salvas no banco ✅ (corrigido agora!)
- [ ] Evidências aparecem após reload ✅ (deve funcionar agora)
- [ ] Múltiplas evidências funcionam ✅ (suportado agora)
- [ ] Lightbox funciona ✅ (dependia do carregamento)

---

**Status:** ✅ Implementado e pronto para teste  
**Data:** 2025-10-14  
**Prioridade:** 🔴 CRÍTICO (bloqueia funcionalidade principal)  
**Testado:** ⏸️ Aguardando teste manual
