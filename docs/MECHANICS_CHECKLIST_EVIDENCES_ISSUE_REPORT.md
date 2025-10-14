# Relatório: Problema com Exibição de Imagens no Checklist de Mecânica

**Data:** 14 de outubro de 2025  
**Problema:** Imagens não estão aparecendo próximas aos itens NOK no modal "Vistoria - Mecânica"  
**Status:** 🔴 Em investigação

---

## 📋 Resumo Executivo

O usuário reportou que as imagens (evidências) não estão sendo exibidas no modal de visualização do checklist de mecânica, especificamente próximo aos itens marcados como NOK (Embreagem, Velas de Ignição, etc.).

---

## 🔍 Tentativas de Correção Realizadas

### 1. **Primeira Tentativa: Adicionar Condição para Exibir Evidências**
**Data:** Primeira interação  
**Ação:** Modificação no `MechanicsChecklistView.tsx` para exibir evidências apenas para itens NOK

```tsx
{/* Exibir evidências apenas para itens NOK */}
{item.item_status === 'nok' && item.evidences && item.evidences.some(e => !!e.media_url) && (
  <div className={styles.evidencesGrid}>
    {/* ... renderização das imagens ... */}
  </div>
)}
```

**Resultado:** ❌ Falhou - Imagens continuam não aparecendo

---

### 2. **Segunda Tentativa: Remover Filtro NOK (Exibir para Todos)**
**Data:** Segunda interação  
**Ação:** Alterado para exibir evidências tanto para itens OK quanto NOK

```tsx
{/* Exibir evidências quando existirem (OK ou NOK) */}
{item.evidences && item.evidences.some(e => !!e.media_url) && (
  <div className={styles.evidencesGrid}>
    {/* ... renderização das imagens ... */}
  </div>
)}
```

**Resultado:** ❌ Falhou - Imagens continuam não aparecendo

---

### 3. **Terceira Tentativa: Voltar ao Filtro NOK**
**Data:** Terceira interação (atual)  
**Ação:** Restaurado para exibir evidências apenas para itens NOK

```tsx
{item.item_status === 'nok' && item.evidences && item.evidences.some(e => !!e.media_url) && (
  <div className={styles.evidencesGrid}>
    {/* ... renderização das imagens ... */}
  </div>
)}
```

**Resultado:** ❌ Falhou - Imagens continuam não aparecendo

---

## 🏗️ Arquitetura do Sistema

### Fluxo de Dados

```
1. Usuário abre modal "Vistoria - Mecânica"
   ↓
2. Hook usePartnerChecklist(vehicleId) é executado
   ↓
3. Hook chama GET /api/partner-checklist?vehicleId={id}
   ↓
4. API busca dados:
   - mechanics_checklist (tabela principal)
   - mechanics_checklist_items (itens ok/nok)
   - mechanics_checklist_evidences (imagens)
   ↓
5. API gera signed URLs para imagens do Storage
   ↓
6. API retorna JSON com estrutura:
   {
     type: 'mechanics',
     itemsByCategory: {
       'transmission': [
         {
           id: '...',
           item_key: 'clutch',
           item_status: 'nok',
           evidences: [
             {
               id: '...',
               media_url: 'https://...',
               description: '...'
             }
           ]
         }
       ]
     }
   }
   ↓
7. MechanicsChecklistView renderiza itens
   ↓
8. Para cada item NOK, deveria renderizar evidências
```

### Estrutura do Banco de Dados

#### Tabela: `mechanics_checklist`
```sql
- id (UUID)
- vehicle_id (UUID)
- quote_id (UUID) -- NOVO
- inspection_id (UUID) -- DEPRECATED
- status (TEXT)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
```

#### Tabela: `mechanics_checklist_items`
```sql
- id (UUID)
- vehicle_id (UUID)
- quote_id (UUID) -- NOVO
- inspection_id (UUID) -- DEPRECATED
- item_key (TEXT) -- Ex: 'clutch', 'sparkPlugs'
- item_status (TEXT) -- 'ok' | 'nok'
- item_notes (TEXT)
- created_at (TIMESTAMPTZ)
```

#### Tabela: `mechanics_checklist_evidences`
```sql
- id (UUID)
- vehicle_id (UUID)
- quote_id (UUID) -- NOVO
- inspection_id (UUID) -- DEPRECATED
- item_key (TEXT) -- Ex: 'clutch', 'sparkPlugs'
- storage_path (TEXT) -- Caminho no Storage
- description (TEXT)
- created_at (TIMESTAMPTZ)

⚠️ IMPORTANTE: NÃO possui coluna checklist_item_id
```

---

## 🐛 Problema Identificado

### ❌ **CAUSA RAIZ: Falta de Relação Direta entre Evidências e Itens**

A tabela `mechanics_checklist_evidences` **NÃO possui uma coluna `checklist_item_id`** para fazer a ligação direta com `mechanics_checklist_items.id`.

**Relacionamento Atual:**
```
mechanics_checklist_items.item_key == mechanics_checklist_evidences.item_key
```

**Problema no Código da API:**
```typescript
// Linha 246-248 em app/api/partner-checklist/route.ts
evidences: evidencesWithUrls.filter(
  // Prefer direct link via checklist_item_id; fallback to item_key association
  ev => ev.checklist_item_id === item.id || ev.item_key === item.item_key
)
```

O código tenta filtrar por `checklist_item_id` (que não existe na tabela), depois faz fallback para `item_key`.

**Mas há um problema:** A interface `EvidenceRow` define `checklist_item_id` como obrigatório:

```typescript
// Linha 23-29 em app/api/partner-checklist/route.ts
interface EvidenceRow {
  id: string;
  checklist_item_id: string;  // ❌ NÃO EXISTE NA TABELA
  storage_path: string;
  description: string | null;
  item_key?: string | null;    // ✅ ESTE SIM EXISTE
}
```

---

## 🔬 Análise de Logs

### Verificações Necessárias

Para confirmar o diagnóstico, precisamos verificar:

1. **As evidências estão sendo salvas no banco?**
   ```sql
   SELECT * FROM mechanics_checklist_evidences 
   WHERE vehicle_id = '{vehicle_id}'
   ORDER BY created_at DESC;
   ```

2. **Os storage_path estão corretos?**
   ```sql
   SELECT item_key, storage_path, description 
   FROM mechanics_checklist_evidences 
   WHERE vehicle_id = '{vehicle_id}';
   ```

3. **Os signed URLs estão sendo gerados?**
   - Adicionar log na API após geração dos signed URLs
   - Verificar se `evidencesWithUrls` tem dados

4. **O filtro de evidências está funcionando?**
   ```typescript
   console.log('Item:', item.item_key);
   console.log('Evidences available:', evidencesWithUrls.map(e => e.item_key));
   console.log('Filtered evidences:', item.evidences);
   ```

---

## 🔧 Possíveis Soluções

### Solução 1: Adicionar Coluna `checklist_item_id` ✅ RECOMENDADA
Criar migration para adicionar relação direta:

```sql
-- Migration: add_checklist_item_id_to_evidences
ALTER TABLE mechanics_checklist_evidences
  ADD COLUMN checklist_item_id UUID REFERENCES mechanics_checklist_items(id) ON DELETE CASCADE;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_evidences_item_id 
  ON mechanics_checklist_evidences(checklist_item_id);

-- Preencher dados existentes (se houver)
UPDATE mechanics_checklist_evidences e
SET checklist_item_id = i.id
FROM mechanics_checklist_items i
WHERE e.item_key = i.item_key
  AND e.vehicle_id = i.vehicle_id
  AND (
    (e.quote_id IS NOT NULL AND e.quote_id = i.quote_id)
    OR 
    (e.inspection_id IS NOT NULL AND e.inspection_id = i.inspection_id)
  );
```

**Vantagens:**
- Relação direta e confiável
- Melhor performance
- Evita ambiguidades

**Desvantagens:**
- Requer migration
- Precisa atualizar código de salvamento

---

### Solução 2: Corrigir Filtro por `item_key` ⚡ RÁPIDA

Ajustar o código da API para focar no `item_key`:

```typescript
// Linha 23-29: Corrigir interface
interface EvidenceRow {
  id: string;
  checklist_item_id?: string | null;  // Tornar opcional
  storage_path: string;
  description: string | null;
  item_key: string;  // Tornar obrigatório
}

// Linha 220: Ajustar mapeamento
evidencesWithUrls = await Promise.all(
  ((evidences as EvidenceRow[]) || []).map(async evidence => {
    const { data: urlData } = await supabase.storage
      .from('vehicle-media')
      .createSignedUrl(evidence.storage_path, 3600);

    return {
      id: evidence.id,
      item_key: evidence.item_key,  // Garantir que está presente
      media_url: urlData?.signedUrl || '',
      description: evidence.description || '',
    };
  })
);

// Linha 246: Simplificar filtro
evidences: evidencesWithUrls.filter(ev => ev.item_key === item.item_key)
```

**Vantagens:**
- Não requer migration
- Correção rápida
- Usa estrutura existente

**Desvantagens:**
- Depende de `item_key` estar sempre preenchido
- Menos robusto que relação por ID

---

### Solução 3: Adicionar Logs Detalhados 🔍 DEBUG

Adicionar logs na API para identificar onde está falhando:

```typescript
// Após buscar evidências
logger.info('evidences_fetched', {
  count: evidences?.length || 0,
  sample: evidences?.slice(0, 2).map(e => ({
    id: e.id?.slice(0, 8),
    item_key: e.item_key,
    has_storage_path: !!e.storage_path
  }))
});

// Após gerar signed URLs
logger.info('signed_urls_generated', {
  count: evidencesWithUrls.length,
  sample: evidencesWithUrls.slice(0, 2).map(e => ({
    id: e.id.slice(0, 8),
    item_key: e.item_key,
    has_url: !!e.media_url
  }))
});

// Ao associar evidências aos itens
itemsWithEvidences.forEach(item => {
  if (item.item_status === 'nok') {
    logger.info('item_evidences', {
      item_key: item.item_key,
      item_status: item.item_status,
      evidences_count: item.evidences.length,
      evidences_have_urls: item.evidences.every(e => !!e.media_url)
    });
  }
});
```

---

## ✅ Próximos Passos

1. **Adicionar logs detalhados na API** (Solução 3)
   - Verificar se evidências estão sendo buscadas
   - Verificar se signed URLs estão sendo gerados
   - Verificar se filtro está funcionando

2. **Verificar banco de dados diretamente**
   - Confirmar existência de registros em `mechanics_checklist_evidences`
   - Verificar se `item_key` está preenchido corretamente

3. **Implementar correção** (Solução 2 ou 1)
   - Se dados existem: Solução 2 (correção rápida)
   - Para longo prazo: Solução 1 (migration completa)

4. **Testar fluxo completo**
   - Salvar novo checklist com evidências
   - Verificar se dados são salvos corretamente
   - Verificar se exibição funciona

---

## 📊 Checklist de Verificação

- [ ] Logs adicionados na API
- [ ] Verificado banco de dados diretamente
- [ ] Confirmado existência de dados em `mechanics_checklist_evidences`
- [ ] Verificado se `item_key` está preenchido
- [ ] Verificado se `storage_path` está correto
- [ ] Testado geração de signed URLs manualmente
- [ ] Implementada correção (Solução 2 ou 1)
- [ ] Testado salvamento de novo checklist
- [ ] Testado visualização de checklist existente
- [ ] Verificado itens OK e NOK separadamente

---

## 📝 Notas Técnicas

### Migração de Arquitetura

O sistema passou por uma migração de `inspection_id` para `quote_id`:

- **Antes:** Parceiros usavam `inspection_id` "emprestado"
- **Depois:** Parceiros têm seu próprio `quote_id`

**Migration aplicada:** `20251013005933_add_quote_id_to_checklist_tables.sql`

Esta migração pode ter causado inconsistências se:
1. Dados antigos ainda usam `inspection_id`
2. Novos dados usam `quote_id`
3. API tenta buscar por ambos mas falha na associação

### Constraint de Unicidade

```sql
-- mechanics_checklist_evidences tem constraint:
UNIQUE (inspection_id, item_key)  -- Para dados legados
-- OU
UNIQUE (quote_id, item_key)       -- Para dados novos
```

Isso pode causar conflitos se:
- Mesma evidência for salva duas vezes
- Item key estiver duplicado
- quote_id ou inspection_id estiverem null

---

## 🔗 Arquivos Relacionados

- `/app/api/partner-checklist/route.ts` - API que busca dados
- `/modules/vehicles/hooks/usePartnerChecklist.ts` - Hook React
- `/modules/vehicles/components/modals/MechanicsChecklistView.tsx` - Componente de exibição
- `/app/api/partner/checklist/submit/route.ts` - API que salva dados
- `/supabase/migrations/20250929213308_update_mechanics_checklist_add_inspection_and_evidences.sql` - Criação da tabela
- `/supabase/migrations/20251013005933_add_quote_id_to_checklist_tables.sql` - Migração quote_id

---

**Atualizado em:** 14/10/2025  
**Autor:** Sistema de Diagnóstico Automático  
**Versão:** 1.0
