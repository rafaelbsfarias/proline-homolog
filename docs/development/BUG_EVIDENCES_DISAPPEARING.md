# BUG: Evidências Desaparecendo ao Atualizar Página

## 🐛 Problema Identificado

Quando o parceiro salvava o checklist múltiplas vezes, as evidências anteriores **desapareciam** da interface, mesmo estando presentes no storage.

### Sintomas
- ❌ Imagens ficavam no storage mas não apareciam na interface
- ❌ Apenas a última imagem enviada era exibida
- ❌ Impossível deletar imagens antigas (não apareciam)
- ❌ Perda de histórico de evidências

### Diagnóstico

**Storage (correto):** ✅ 3 imagens
```
ceb85fb1.../evidences/clutch/william04-1760481474071-im2j7kgs.png
ceb85fb1.../evidences/clutch/WhatsApp-Image-2025-08-27-at-1-1760481785872-phcvplox.jpeg
ceb85fb1.../evidences/clutch/caixa-rasgada-1760483343249-t9ld3xro.png
```

**Banco de Dados (incorreto):** ❌ 1 referência
```
clutch | ceb85fb1.../evidences/clutch/caixa-rasgada-1760483343249-t9ld3xro.png
```

**Resultado:** As 2 primeiras imagens ficaram **órfãs** (sem referência no banco).

---

## 🔍 Causa Raiz

No endpoint `/api/partner/checklist/submit`, o código estava **deletando todas as evidências antigas** antes de inserir as novas:

```typescript
// ❌ CÓDIGO ANTIGO (PROBLEMÁTICO)
// Remover evidências anteriores deste parceiro neste contexto
let evDel = supabase
  .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
  .delete()
  .eq('vehicle_id', checklistData.vehicle_id)
  .eq('partner_id', partnerId);

const { error: evDelErr } = await evDel;

// Inserir novas evidências
const { error: evError } = await supabase
  .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
  .insert(rows);
```

### Fluxo Problemático

1. Usuário faz upload de imagem A → Storage ✅, Banco ✅
2. Usuário salva checklist → Tudo ok
3. Usuário faz upload de imagem B → Storage ✅
4. Usuário salva checklist → **DELETE** apaga referências antigas, insere apenas B
5. Resultado: Storage tem A e B ✅, Banco tem apenas B ❌

---

## ✅ Solução Implementada

Mudamos a lógica para **UPSERT**: verificar evidências existentes e inserir apenas as novas.

```typescript
// ✅ CÓDIGO NOVO (CORRETO)
// Buscar evidências existentes para este contexto
let existingQuery = supabase
  .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
  .select('media_url')
  .eq('vehicle_id', checklistData.vehicle_id)
  .eq('partner_id', partnerId);

const { data: existingEvidences } = await existingQuery;
const existingUrls = new Set((existingEvidences || []).map(e => e.media_url));

// Filtrar apenas evidências que ainda não existem
const newRows = rows.filter(row => !existingUrls.has(row.media_url as string));

logger.debug('evidence_upsert_analysis', {
  total_in_payload: rows.length,
  already_exists: rows.length - newRows.length,
  to_insert: newRows.length,
});

// Inserir apenas as novas
if (newRows.length > 0) {
  const { error: evError } = await supabase
    .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
    .insert(newRows);
  // ...
}
```

### Novo Fluxo (Correto)

1. Usuário faz upload de imagem A → Storage ✅, Banco ✅
2. Usuário salva checklist → Tudo ok
3. Usuário faz upload de imagem B → Storage ✅
4. Frontend envia A + B no payload
5. Backend verifica: A já existe, B é nova
6. Backend insere apenas B
7. Resultado: Storage tem A e B ✅, Banco tem A e B ✅

---

## 🔧 Arquivos Modificados

### `app/api/partner/checklist/submit/route.ts`
- **Linha ~377**: Substituído DELETE + INSERT por lógica de UPSERT
- **Adicionado**: Log `evidence_upsert_analysis` para debug
- **Adicionado**: Log detalhado do payload de evidências

---

## 🧪 Scripts Criados

### 1. `scripts/debug-evidences-issue.sh`
Diagnostica o problema mostrando:
- Quantidade de imagens no storage
- Quantidade de referências no banco
- Evidências órfãs

```bash
./scripts/debug-evidences-issue.sh
```

### 2. `scripts/restore-orphan-evidences.sh`
Restaura evidências órfãs (emergencial):
- Busca imagens no storage sem referência
- Insere referências faltantes no banco
- Valida resultado final

```bash
./scripts/restore-orphan-evidences.sh
```

---

## ✅ Validação

### Antes da Correção
```
Storage: 3 imagens ✅
Banco:   1 referência ❌
Interface: 1 imagem exibida ❌
```

### Depois da Correção
```
Storage: 3 imagens ✅
Banco:   3 referências ✅
Interface: 3 imagens exibidas ✅
```

### Teste de Regressão

1. **Carregar página com 3 imagens existentes:**
   - ✅ Todas devem aparecer

2. **Adicionar uma 4ª imagem e salvar:**
   - ✅ As 3 antigas devem permanecer
   - ✅ A nova deve ser adicionada
   - ✅ Total: 4 imagens

3. **Recarregar a página:**
   - ✅ Todas as 4 devem aparecer

4. **Deletar uma imagem:**
   - ✅ Deve ser removida do storage e do banco
   - ✅ As outras 3 devem permanecer

---

## 📊 Logs de Debug

### Log do Payload
```json
{
  "level": "debug",
  "message": "evidences_processing_start",
  "hasEvidences": true,
  "evidencesType": "object",
  "evidencesKeys": ["clutch"],
  "evidencesData": {
    "clutch": [
      "ceb85fb1.../clutch/william04-1760481474071-im2j7kgs.png",
      "ceb85fb1.../clutch/WhatsApp-Image-2025-08-27-at-1-1760481785872-phcvplox.jpeg",
      "ceb85fb1.../clutch/caixa-rasgada-1760483343249-t9ld3xro.png"
    ]
  }
}
```

### Log do UPSERT
```json
{
  "level": "debug",
  "message": "evidence_upsert_analysis",
  "total_in_payload": 3,
  "already_exists": 2,
  "to_insert": 1
}
```

---

## ⚠️ Ponto de Atenção

O **frontend já estava correto**! O hook `useChecklistOrchestrator.ts` já fazia:
1. Preservar evidências existentes (URLs sem file)
2. Fazer upload de novas evidências
3. Enviar todas no payload

O problema era **exclusivamente no backend** que deletava as antigas.

---

## 🎯 Impacto

### Antes
- ❌ Perda de evidências históricas
- ❌ Necessidade de refazer uploads
- ❌ Impossível rastrear alterações
- ❌ Frustração do usuário

### Depois
- ✅ Todas as evidências preservadas
- ✅ Histórico completo mantido
- ✅ Possibilidade de deletar individualmente
- ✅ Experiência do usuário melhorada

---

## 📅 Resolução

**Data:** 14 de Outubro de 2025  
**Status:** ✅ Resolvido  
**Evidências restauradas:** ✅ 2 imagens recuperadas  
**Testes:** ✅ Validado com sucesso

---

## 🔗 Arquivos Relacionados

- `app/api/partner/checklist/submit/route.ts` - Correção principal
- `modules/partner/hooks/checklist/useChecklistOrchestrator.ts` - Hook do frontend (já estava correto)
- `scripts/debug-evidences-issue.sh` - Script de diagnóstico
- `scripts/restore-orphan-evidences.sh` - Script de restauração
- `docs/BUG_EVIDENCE_NOT_LOADING.md` - Documentação do bug anterior relacionado
- `docs/FIX_EVIDENCE_PERSISTENCE_ISSUE.md` - Documentação da correção anterior

---

## 📝 Lições Aprendidas

1. **DELETE antes de INSERT é perigoso**: Sempre considerar UPSERT ou idempotência
2. **Logs são essenciais**: Os logs adicionados ajudaram a identificar o problema rapidamente
3. **Validar ambos os lados**: O frontend estava correto, mas o backend tinha o bug
4. **Scripts de diagnóstico**: Fundamentais para identificar dados órfãos
5. **Scripts de recuperação**: Importante ter plano de restauração para dados perdidos
