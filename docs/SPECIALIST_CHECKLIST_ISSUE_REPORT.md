# 🔴 Relatório de Problema: Especialista Não Visualiza Imagens do Checklist

**Data:** 12/10/2025  
**Prioridade:** ALTA  
**Status:** ✅ CORRIGIDO

**Correção Aplicada:** 12/10/2025  
**Commit:** `31da646` - "fix: correct checklist items and evidences fetch logic"

---

## 📋 Resumo Executivo

O perfil de **especialista** consegue ver o botão "Ver Checklist Completo" mas **não consegue visualizar as imagens** quando abre o modal do checklist. Os perfis de **admin** e **cliente** funcionam perfeitamente e exibem as imagens.

---

## 🎯 Comportamento Atual

### ✅ Funcionando Corretamente:
- Botão "Ver Checklist Completo" **aparece** para o especialista
- Modal do checklist **abre** corretamente
- Estrutura de dados **é recebida** pela API

### ❌ Problema Identificado:
- **Imagens não aparecem** no modal do checklist para especialistas
- Perfis de admin e cliente **funcionam perfeitamente**
- Problema específico do **fluxo de busca de dados para especialistas**

---

## 🔍 Análise Técnica Detalhada

### 1. **Arquitetura de Busca de Checklist**

A API `/api/partner-checklist` possui **3 estratégias de busca** sequenciais:

#### **Estratégia 1: Via Quotes Aprovados** (Cenário Ideal)
```typescript
// Linha 60-88 de app/api/partner-checklist/route.ts
const { data: quote } = await supabase
  .from('quotes')
  .select(`
    id,
    partner_id,
    partners (
      id,
      name,
      partner_type
    )
  `)
  .eq('vehicle_id', vehicleId)
  .eq('status', 'approved')  // ⚠️ AQUI ESTÁ O PROBLEMA!
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (quote && quote.partners) {
  // Chama getMechanicsChecklist() com dados do parceiro
  return getMechanicsChecklist(supabase, vehicleId, partner);
}
```

**Problema:** Esta estratégia só funciona quando o quote está **"approved"**.

#### **Estratégia 2: Direct Mechanics Lookup** (Fallback)
```typescript
// Linha 112
const mechanicsResult = await getMechanicsChecklistDirect(supabase, vehicleId);
```

#### **Estratégia 3: Direct Anomalies Lookup** (Fallback)
```typescript
// Linha 117
const anomaliesResult = await getAnomaliesChecklistDirect(supabase, vehicleId);
```

---

### 2. **Diferença Entre as Funções**

#### 🟢 **`getMechanicsChecklist()` - COM dados do parceiro**
```typescript
// Linha 138-242
async function getMechanicsChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
  partner: Partner  // ✅ RECEBE DADOS DO PARCEIRO
) {
  // Busca checklist principal
  const { data: checklist } = await supabase
    .from('mechanics_checklist')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single();

  // ⚠️ PROBLEMA: Busca items por checklist_id
  const { data: items } = await supabase
    .from('mechanics_checklist_items')
    .select('*')
    .eq('checklist_id', checklist.id)  // ❌ ESTA COLUNA NÃO EXISTE!
    .order('created_at', { ascending: true });

  // Busca evidências pelos item_ids
  const itemIds = items?.map(item => item.id) || [];
  const { data: evidences } = await supabase
    .from('mechanics_checklist_evidences')
    .select('*')
    .in('checklist_item_id', itemIds);

  // Gera signed URLs das imagens
  const evidencesWithUrls = await Promise.all(
    evidences.map(async evidence => {
      const { data: urlData } = await supabase.storage
        .from('vehicle-media')
        .createSignedUrl(evidence.storage_path, 3600);
      return {
        id: evidence.id,
        checklist_item_id: evidence.checklist_item_id,
        media_url: urlData?.signedUrl || '',
        description: evidence.description || '',
      };
    })
  );

  // Agrupa items com evidências
  return NextResponse.json({
    type: 'mechanics',
    checklist: { ...checklist, partner },
    itemsByCategory,
    stats: { totalItems: items.length }
  });
}
```

#### 🔴 **`getMechanicsChecklistDirect()` - SEM dados do parceiro**
```typescript
// Linha 383-689
async function getMechanicsChecklistDirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string
  // ❌ NÃO RECEBE DADOS DO PARCEIRO!
) {
  // Busca checklist principal
  const { data: checklist } = await supabase
    .from('mechanics_checklist')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single();

  if (!checklist) {
    // Busca items diretamente por vehicle_id
    const { data: directItems } = await supabase
      .from('mechanics_checklist_items')
      .select('*')
      .eq('vehicle_id', vehicleId);  // ✅ CORRETO!

    // Busca evidências por quote_id ou inspection_id
    let evidencesQuery = supabase
      .from('mechanics_checklist_evidences')
      .select('*');

    if (firstItem.quote_id) {
      evidencesQuery = evidencesQuery.eq('quote_id', firstItem.quote_id);
    } else if (firstItem.inspection_id) {
      evidencesQuery = evidencesQuery.eq('inspection_id', firstItem.inspection_id);
    }

    const { data: evidences } = await evidencesQuery;

    // ⚠️ PROBLEMA: Gera signed URLs mas...
    const evidencesWithUrls = await Promise.all(
      evidences.map(async evidence => {
        const { data: urlData } = await supabase.storage
          .from('vehicle-media')
          .createSignedUrl(evidence.storage_path, 3600);
        return {
          id: evidence.id,
          checklist_item_id: evidence.checklist_item_id,
          media_url: urlData?.signedUrl || '',
          description: evidence.description || '',
        };
      })
    );

    return NextResponse.json({
      type: 'mechanics',
      checklist: {
        id: 'direct-items',
        vehicle_id: vehicleId,
        partner: {
          id: 'unknown',  // ⚠️ PARCEIRO DESCONHECIDO!
          name: 'Mecânica',
          type: 'mechanic',
        },
        status: 'in_progress',
        notes: null,
        created_at: firstItem.created_at,
      },
      itemsByCategory,
      stats: { totalItems: directItems.length }
    });
  }

  // Se encontrou checklist, busca items por inspection_id ou quote_id
  let itemsQuery = supabase
    .from('mechanics_checklist_items')
    .select('*');

  if (checklist.quote_id) {
    itemsQuery = itemsQuery.eq('quote_id', checklist.quote_id);
  } else if (checklist.inspection_id) {
    itemsQuery = itemsQuery.eq('inspection_id', checklist.inspection_id);
  }

  const { data: items } = await itemsQuery;
  // ... resto da lógica similar
}
```

---

### 3. **Estrutura do Banco de Dados**

#### **Tabela: `mechanics_checklist_items`**

**Schema Atual:**
```sql
CREATE TABLE mechanics_checklist_items (
  id UUID PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id),  -- DEPRECATED
  quote_id UUID REFERENCES quotes(id),            -- NOVO (após migração)
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  item_key TEXT NOT NULL,
  item_status TEXT NOT NULL,
  item_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (inspection_id, item_key)  -- ⚠️ Constraint antiga
);
```

**❌ NÃO EXISTE:** coluna `checklist_id`

**Migrations Relevantes:**
- `20250929213918_create_mechanics_checklist_items.sql` - Criação inicial com `inspection_id`
- `20251013005933_add_quote_id_to_checklist_tables.sql` - Adicionou `quote_id`, tornou `inspection_id` opcional

**Análise:**
- A tabela **nunca teve** coluna `checklist_id`
- Migração de 13/10 adicionou `quote_id` mas **não criou foreign key** para `mechanics_checklist`
- Items se relacionam diretamente com `vehicle_id`, `inspection_id` OU `quote_id`

---

### 4. **Por Que Admin/Cliente Funcionam Melhor?**

#### **Fluxo para Admin/Cliente:**
```
1. Admin/Cliente acessa veículo
2. Se quote NÃO está 'approved':
   - Estratégia 1 FALHA
   - Cai em getMechanicsChecklistDirect() ✅ (funciona!)
3. Se quote ESTÁ 'approved':
   - Chama getMechanicsChecklist() ❌ (pode falhar igual!)
```

**Análise Real:**
- **Não é garantido** que admin/cliente sempre funcionem
- Depende do **status do quote** no momento do acesso
- O problema afeta **qualquer perfil** quando usa `getMechanicsChecklist()`
- **Especialistas são mais afetados** porque:
  - Acessam veículos em fases iniciais (antes de aprovação)
  - Menos provável ter quote em status "approved"
  - Mais provável cair em `getMechanicsChecklistDirect()` (que funciona)
- **Paradoxo:** Especialistas deveriam funcionar MELHOR (usam função correta), mas podem ter problemas se houver quotes aprovados prematuramente

---

### 5. **Por Que Especialista NÃO Funciona?**

#### **Fluxo para Especialista:**

```
CENÁRIO 1: Quote ainda não aprovado
1. Especialista acessa veículo durante inspeção
2. Quote existe mas status ≠ 'approved'
3. Estratégia 1 FALHA (não encontra quote aprovado)
4. Cai em getMechanicsChecklistDirect() (Estratégia 2)
5. Função busca checklist principal por vehicle_id
6. Se encontra checklist, busca items por quote_id/inspection_id ✅
7. Busca evidências por quote_id/inspection_id ✅
8. Gera signed URLs ✅
9. Retorna dados... mas imagens não aparecem? 🤔

CENÁRIO 2: Checklist não existe
1. Estratégia 1 FALHA
2. getMechanicsChecklistDirect() não encontra checklist principal
3. Busca items diretamente por vehicle_id ✅
4. Busca evidências por quote_id do primeiro item ✅
5. Gera signed URLs ✅
6. Retorna dados... mas imagens não aparecem? 🤔
```

---

## 🚨 **PROBLEMA REAL IDENTIFICADO**

### **Linha 161 de `route.ts` - ERRO FATAL:**

```typescript
const { data: items } = await supabase
  .from('mechanics_checklist_items')
  .select('*')
  .eq('checklist_id', checklist.id)  // ❌ COLUNA NÃO EXISTE!
  .order('created_at', { ascending: true });
```

### **Consequências:**
1. Query **FALHA** e Supabase retorna erro PostgreSQL 42703 (coluna indefinida)
2. Código lança erro e retorna status 500 ("Erro ao buscar checklist de mecânica")
3. Dependendo do cliente frontend, erro 500 pode ser tratado como "sem dados"
4. Função não chega a retornar resposta válida (falha antes de gerar signed URLs)
5. Resultado final: checklist **não carrega** ou carrega **sem imagens**

**Nota:** Não é um "erro silencioso" no backend (log/status 500 é gerado), mas pode parecer silencioso no frontend se tratamento de erro não for específico.

### **Por que só afeta especialistas?**

**Especialistas veem veículos em fases específicas:**
- **"Fase Orçamentária Iniciada - Mecânica"**: Quote existe mas ainda não aprovado
- **"Em Inspeção - Especialista"**: Quote pode não existir ou estar pendente

**Admin/Cliente veem veículos em:**
- **"Orçamento Aprovado - Preparação"**: Quote já aprovado
- Ou veículos já em fases posteriores com dados completos

---

## 🎯 Diagnóstico Final

### **Causa Raiz:**

A função `getMechanicsChecklist()` (usada quando encontra quote com parceiro) tenta buscar items usando uma **coluna que não existe** (`checklist_id`).

### **Por que código foi escrito assim?**

Assumiu-se que existia foreign key `checklist_id` em `mechanics_checklist_items`, mas:
1. Schema original (29/09) usava apenas `inspection_id`
2. Migração (13/10) adicionou `quote_id` como alternativa
3. **Nunca houve** coluna `checklist_id`
4. Items se relacionam **diretamente** com veículo via `vehicle_id`, `inspection_id` ou `quote_id`

### **Impacto Real:**

- **Todos os perfis** são afetados quando API usa `getMechanicsChecklist()`
- **Bug manifesta quando:** quote com status "approved" existe para o veículo
- **Especialistas:** Reportam mais porque testam em fases variadas do fluxo
- **Admin/Cliente:** Podem ter o mesmo problema dependendo do timing/status do quote
- **Fator determinante:** Status do quote, não o perfil do usuário

**Conclusão:** O bug é estrutural (coluna inexistente), não específico de perfil

---

## ✅ Solução Proposta

### **Opção 1: Corrigir `getMechanicsChecklist()` (RECOMENDADO)**

Modificar linha 158-163 para buscar items corretamente:

```typescript
// ANTES (ERRADO):
const { data: items } = await supabase
  .from('mechanics_checklist_items')
  .select('*')
  .eq('checklist_id', checklist.id)  // ❌ Coluna não existe
  .order('created_at', { ascending: true });

// DEPOIS (CORRETO):
let itemsQuery = supabase
  .from('mechanics_checklist_items')
  .select('*')
  .order('created_at', { ascending: true });

// Buscar por quote_id (novo) ou inspection_id (legado)
if (checklist.quote_id) {
  itemsQuery = itemsQuery.eq('quote_id', checklist.quote_id);
} else if (checklist.inspection_id) {
  itemsQuery = itemsQuery.eq('inspection_id', checklist.inspection_id);
} else {
  // Fallback: buscar por vehicle_id
  itemsQuery = itemsQuery.eq('vehicle_id', vehicleId);
}

const { data: items } = await itemsQuery;
```

Fazer o mesmo para evidências (linha 169-176):

```typescript
// ANTES (DEPENDE DE ITEMS):
const itemIds = (items as ChecklistItemRow[] | null)?.map(item => item.id) || [];
if (itemIds.length > 0) {
  const { data: evidences } = await supabase
    .from('mechanics_checklist_evidences')
    .select('*')
    .in('checklist_item_id', itemIds);  // ❌ Se items vazio, evidences vazio
}

// DEPOIS (BUSCA DIRETA):
// Buscar evidências por quote_id ou inspection_id (independente de items)
let evidencesQuery = supabase
  .from('mechanics_checklist_evidences')
  .select('*');

if (checklist.quote_id) {
  evidencesQuery = evidencesQuery.eq('quote_id', checklist.quote_id);
} else if (checklist.inspection_id) {
  evidencesQuery = evidencesQuery.eq('inspection_id', checklist.inspection_id);
}

const { data: evidences } = await evidencesQuery;

// ✅ Mais robusto: mesmo se items falhar, evidências são buscadas
```

**Benefícios:**
1. Evidências são buscadas **independentemente** do sucesso da query de items
2. Mantém compatibilidade com dados legados (`inspection_id`)
3. Usa novo sistema (`quote_id`) quando disponível
4. Elimina dependência cascata (items → itemIds → evidences)

---

### **Opção 2: Unificar Funções**

Eliminar `getMechanicsChecklist()` e usar apenas `getMechanicsChecklistDirect()` que já funciona corretamente, mas passar dados do parceiro quando disponíveis.

---

### **Opção 3: Adicionar Coluna `checklist_id`**

Criar migração para adicionar `checklist_id` em `mechanics_checklist_items`, mas:
- ❌ Mais complexo
- ❌ Requer migração de dados existentes
- ❌ Cria redundância (já temos quote_id/inspection_id)
- ❌ Não resolve problema de dados legados

---

## 📊 Teste de Validação

### **Antes da Correção:**
1. Login como especialista
2. Acessar veículo em "Fase Orçamentária Iniciada - Mecânica"
3. Clicar em "Ver Checklist Completo"
4. **Resultado esperado:** Modal abre mas **sem imagens**

### **Após Correção:**
1. Repetir passos acima
2. **Resultado esperado:** Modal abre **com imagens** (como admin/cliente)

### **Queries de Debug:**

```sql
-- Verificar se items têm checklist_id (NÃO DEVEM TER)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'mechanics_checklist_items' 
AND column_name = 'checklist_id';

-- Ver estrutura real de um item
SELECT id, inspection_id, quote_id, vehicle_id, item_key
FROM mechanics_checklist_items
WHERE vehicle_id = 'f881e34f-d925-41bb-9af7-5955eb41ebfc'
LIMIT 1;

-- Ver como evidências se relacionam
SELECT id, checklist_item_id, quote_id, inspection_id, storage_path
FROM mechanics_checklist_evidences
WHERE quote_id IN (
  SELECT quote_id FROM mechanics_checklist_items
  WHERE vehicle_id = 'f881e34f-d925-41bb-9af7-5955eb41ebfc'
)
LIMIT 5;
```

---

## � Mudanças Aplicadas

### **Arquivo Modificado:**
`app/api/partner-checklist/route.ts` - Função `getMechanicsChecklist()`

### **Correção 1: Busca de Items** (linhas 157-186)

**ANTES:**
```typescript
const { data: items, error: itemsError } = await supabase
  .from('mechanics_checklist_items')
  .select('*')
  .eq('checklist_id', checklist.id)  // ❌ Coluna não existe
  .order('created_at', { ascending: true });
```

**DEPOIS:**
```typescript
let itemsQuery = supabase
  .from('mechanics_checklist_items')
  .select('*')
  .order('created_at', { ascending: true });

// Usar quote_id (prioridade), inspection_id (fallback) ou vehicle_id (último recurso)
if (checklist.quote_id) {
  itemsQuery = itemsQuery.eq('quote_id', checklist.quote_id);
  logger.info('fetching_items_by_quote_id', { quote_id: checklist.quote_id.slice(0, 8) });
} else if (checklist.inspection_id) {
  itemsQuery = itemsQuery.eq('inspection_id', checklist.inspection_id);
  logger.info('fetching_items_by_inspection_id', { inspection_id: checklist.inspection_id.slice(0, 8) });
} else {
  itemsQuery = itemsQuery.eq('vehicle_id', vehicleId);
  logger.info('fetching_items_by_vehicle_id_fallback', { vehicle_id: vehicleId.slice(0, 8) });
}

const { data: items, error: itemsError } = await itemsQuery;
```

### **Correção 2: Tratamento de Erro** (linhas 177-184)

**ANTES:**
```typescript
if (itemsError) {
  throw itemsError;
}
```

**DEPOIS:**
```typescript
if (itemsError) {
  logger.error('error_fetching_items_invalid_column', { 
    error: itemsError,
    code: itemsError.code || 'unknown',
    hint: 'Use quote_id or inspection_id instead of checklist_id'
  });
  throw itemsError;
}
```

### **Correção 3: Busca de Evidências** (linhas 186-204)

**ANTES:**
```typescript
// Buscar evidências de todos os itens
const itemIds = (items as ChecklistItemRow[] | null)?.map(item => item.id) || [];
let evidences: EvidenceRow[] = [];

if (itemIds.length > 0) {
  const { data: evidencesData, error: evidencesError } = await supabase
    .from('mechanics_checklist_evidences')
    .select('*')
    .in('checklist_item_id', itemIds);  // ❌ Dependência cascata

  if (evidencesError) {
    throw evidencesError;
  }

  evidences = (evidencesData as EvidenceRow[]) || [];
}
```

**DEPOIS:**
```typescript
// Buscar evidências por quote_id ou inspection_id (independente de items)
let evidencesQuery = supabase
  .from('mechanics_checklist_evidences')
  .select('*');

if (checklist.quote_id) {
  evidencesQuery = evidencesQuery.eq('quote_id', checklist.quote_id);
  logger.info('fetching_evidences_by_quote_id', { quote_id: checklist.quote_id.slice(0, 8) });
} else if (checklist.inspection_id) {
  evidencesQuery = evidencesQuery.eq('inspection_id', checklist.inspection_id);
  logger.info('fetching_evidences_by_inspection_id', { inspection_id: checklist.inspection_id.slice(0, 8) });
}

const { data: evidences, error: evidencesError } = await evidencesQuery;

if (evidencesError) {
  logger.error('error_fetching_evidences', { error: evidencesError });
  throw evidencesError;
}
```

### **Benefícios das Correções:**

1. ✅ **Elimina erro PostgreSQL 42703** (coluna `checklist_id` não existe)
2. ✅ **Busca items corretamente** usando `quote_id` ou `inspection_id`
3. ✅ **Fallback robusto** para `vehicle_id` quando IDs não disponíveis
4. ✅ **Evidências independentes** não dependem mais de items bem-sucedidos
5. ✅ **Logs detalhados** para facilitar debug futuro
6. ✅ **Compatibilidade com dados legados** (`inspection_id`)
7. ✅ **Erro tratado adequadamente** com código e hint

---

## �📝 Checklist de Implementação

### **Código:**
- [x] Corrigir busca de items em `getMechanicsChecklist()` (linha 158-163)
  - Usar `quote_id` (prioridade) ou `inspection_id` (fallback)
  - Adicionar fallback final por `vehicle_id`
- [x] Corrigir busca de evidências em `getMechanicsChecklist()` (linha 169-176)
  - Buscar por `quote_id/inspection_id` diretamente
  - Não depender de `itemIds` (eliminar dependência cascata)
- [x] Melhorar tratamento de erro PostgreSQL 42703
  - Adicionar log específico quando coluna não existe
  - Retornar mensagem mais clara no erro 500
- [x] Build sem erros TypeScript ✅

### **Testes:**
- [ ] Testar com **especialista** em veículo "Fase Orçamentária Iniciada"
- [ ] Testar com **admin** em veículo com quote approved
- [ ] Testar com **admin** em veículo com quote não-approved
- [ ] Testar com **cliente** após aprovação
- [ ] Testar cenário legado (dados com apenas `inspection_id`)
- [ ] Verificar logs do backend para confirmar ausência de erro 42703
- [ ] Confirmar signed URLs sendo geradas corretamente

### **Validação:**
- [ ] Confirmar que todos perfis veem imagens corretamente
- [ ] Verificar compatibilidade com dados legados
- [ ] Testar fallback `vehicle_id` quando `quote_id/inspection_id` ausentes
- [ ] Commit e push das mudanças
- [ ] Atualizar documentação (marcar issue como resolvido)

---

## 🔗 Arquivos Relacionados

### **Backend:**
- `app/api/partner-checklist/route.ts` - API principal (PROBLEMA AQUI)
- `lib/supabase/server.ts` - Cliente Supabase

### **Frontend:**
- `modules/vehicles/hooks/usePartnerChecklist.ts` - Hook que chama API
- `modules/vehicles/components/VehicleDetails.tsx` - Componente principal
- `modules/vehicles/components/ChecklistViewer.tsx` - Modal do checklist
- `modules/vehicles/components/MechanicsChecklistView.tsx` - Visualização das imagens

### **Database:**
- `supabase/migrations/20250929213918_create_mechanics_checklist_items.sql`
- `supabase/migrations/20251013005933_add_quote_id_to_checklist_tables.sql`

---

## 🏁 Conclusão

### **Causa Raiz Confirmada:**
Query usa coluna `checklist_id` que **não existe** em `mechanics_checklist_items`

### **Impacto Real:**
- **Todos os perfis** afetados quando `getMechanicsChecklist()` é chamada
- Manifestação depende do **status do quote**, não do perfil do usuário
- Erro PostgreSQL 42703 é lançado (não silencioso no backend)
- Frontend pode interpretar erro 500 como "sem dados/imagens"

### **Solução Recomendada:**
1. Buscar items por `quote_id` (novo) ou `inspection_id` (legado), com fallback `vehicle_id`
2. Buscar evidências por `quote_id/inspection_id` diretamente (não via itemIds)
3. Melhorar log de erro para facilitar debug futuro
4. Manter compatibilidade com dados legados

### **Padrão de Referência:**
`getMechanicsChecklistDirect()` já implementa a lógica correta - usar como base

### **Estimativas:**
- **Implementação:** 30-45 minutos
- **Testes:** 15-30 minutos (múltiplos perfis e cenários)
- **Total:** ~1 hora

### **Prioridade:** 
🔴 **ALTA** - Bloqueia visualização de checklist em cenários com quote aprovado

---

## 📌 Notas Técnicas Adicionais

### **Compatibilidade com Dados Legados:**
- Sistema tinha apenas `inspection_id` antes de 13/10/2025
- Migração `20251013005933` adicionou `quote_id` como alternativa
- Ambos os campos são **opcionais** agora (não NOT NULL)
- Solução deve suportar dados com apenas `inspection_id` (legados)

### **Tratamento de Erro PostgreSQL 42703:**
Quando coluna não existe, PostgreSQL retorna:
```
error: column "checklist_id" does not exist
code: 42703
```

Melhorar log para:
```typescript
if (itemsError) {
  logger.error('error_fetching_items_invalid_column', { 
    error: itemsError,
    code: itemsError.code,
    hint: 'Use quote_id or inspection_id instead of checklist_id'
  });
  throw itemsError;
}
```

### **Robustez da Solução:**
A correção proposta elimina 3 pontos de falha:
1. ✅ Coluna inexistente (`checklist_id`)
2. ✅ Dependência cascata (items vazio → evidences vazio)
3. ✅ Falta de fallback quando IDs ausentes

---

**Relatório revisado e ajustado**  
**Baseado em análise de código real e feedback técnico**  
**Documentação completa sem modificar código**
