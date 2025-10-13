# Feature: Estimativa de Dias por Serviço

## 📋 Resumo
Permite que parceiros especifiquem uma estimativa de dias para completar cada serviço ao criar ou editar um orçamento. Isso melhora o planejamento e as expectativas do cliente.

## 🎯 Objetivo
Adicionar transparência ao processo de orçamento, permitindo que clientes e administradores vejam quanto tempo cada serviço levará.

## 🗄️ Mudanças no Banco de Dados

### Migration
**Arquivo**: `supabase/migrations/20251013071550_add_estimated_days_to_quote_items.sql`

```sql
-- Adiciona coluna estimated_days à tabela quote_items
ALTER TABLE quote_items 
ADD COLUMN estimated_days INTEGER;

-- Constraint: apenas valores positivos ou NULL
ALTER TABLE quote_items
ADD CONSTRAINT quote_items_estimated_days_positive 
CHECK (estimated_days IS NULL OR estimated_days > 0);

-- Índice para queries
CREATE INDEX idx_quote_items_estimated_days 
ON quote_items(estimated_days);

COMMENT ON COLUMN quote_items.estimated_days IS 
'Estimativa de dias para completar este serviço (NULL = não especificado)';
```

**Aplicado**: ✅ Sim

## 💻 Mudanças no Frontend

### 1. Hook: `useBudget.ts`
**Localização**: `modules/partner/hooks/useBudget.ts`

**Mudanças**:
- Interface `BudgetItem` estendida com `estimatedDays?: number`
- Novo método `updateEstimatedDays(serviceId, days)`
- Método `loadBudgetFromData` atualizado para incluir `estimatedDays`

```typescript
export interface BudgetItem {
  service: PartnerService;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  estimatedDays?: number;  // NOVO
}

const updateEstimatedDays = useCallback((serviceId: string, estimatedDays: number | undefined) => {
  setBudget(prev => {
    const updatedItems = prev.items.map(item =>
      item.service.id === serviceId ? { ...item, estimatedDays } : item
    );
    return { ...prev, items: updatedItems };
  });
}, []);
```

### 2. Hook: `useBudgetSaver.ts`
**Localização**: `modules/partner/hooks/useBudgetSaver.ts`

**Mudanças**:
- Interface `BudgetItem` estendida com `estimatedDays?: number`
- Payload inclui `estimatedDays` ao salvar

```typescript
items: budget.items.map(item => ({
  description: item.service.name,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  totalPrice: item.totalPrice,
  estimatedDays: item.estimatedDays,  // NOVO
}))
```

### 3. Componente: `BudgetSummary.tsx`
**Localização**: `modules/partner/components/budget/BudgetSummary.tsx`

**Mudanças**:
- Prop `onEstimatedDaysChange` adicionada
- UI com input para dias estimados

```tsx
interface BudgetSummaryProps {
  budget: Budget;
  onBudgetInfoChange: (field: string, value: string | number) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  onEstimatedDaysChange: (serviceId: string, estimatedDays: number | undefined) => void;  // NOVO
  onRemoveService: (serviceId: string) => void;
  onSave: () => void;
  onClear: () => void;
  canSave: boolean;
  isSaving: boolean;
  mode?: 'create' | 'edit';
}

// UI no card do serviço:
<div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
  <label style={{fontSize: '12px', color: '#666', fontWeight: '500'}}>
    📅 Prazo:
  </label>
  <input
    type="number"
    min="1"
    placeholder="Dias"
    value={item.estimatedDays || ''}
    onChange={e => {
      const value = e.target.value;
      onEstimatedDaysChange(
        item.service.id,
        value ? parseInt(value, 10) : undefined
      );
    }}
    style={{width: '60px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px'}}
  />
  <span style={{fontSize: '12px', color: '#999'}}>
    {item.estimatedDays === 1 ? 'dia' : 'dias'}
  </span>
</div>
```

### 4. Página: `orcamento/page.tsx`
**Localização**: `app/dashboard/partner/orcamento/page.tsx`

**Mudanças**:
- Importa `updateEstimatedDays` do hook
- Handler `handleEstimatedDaysChange` criado
- Passa handler para `BudgetSummary`

```typescript
const {
  budget,
  addService,
  removeService,
  updateQuantity,
  updateEstimatedDays,  // NOVO
  updateBudgetInfo,
  clearBudget,
  loadBudgetFromData,
} = useBudget();

const handleEstimatedDaysChange = (serviceId: string, estimatedDays: number | undefined) => {
  updateEstimatedDays(serviceId, estimatedDays);
};

<BudgetSummary
  budget={budget}
  onBudgetInfoChange={handleBudgetInfoChange}
  onQuantityChange={handleQuantityChange}
  onEstimatedDaysChange={handleEstimatedDaysChange}  // NOVO
  onRemoveService={handleRemoveService}
  onSave={handleSaveBudget}
  onClear={handleClearBudget}
  canSave={canSave}
  isSaving={savingBudget}
  mode={isEditing ? 'edit' : 'create'}
/>
```

## 🔌 Mudanças no Backend

### 1. API POST: Criar Orçamento
**Arquivo**: `app/api/partner/budgets/route.ts`

**Mudanças**:
- Schema de validação `BudgetItemSchema` estendido com `estimatedDays`
- Campo `estimated_days` adicionado ao insert de `quote_items`

```typescript
const BudgetItemSchema = z.object({
  serviceId: z.string().uuid('ID do serviço inválido'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unitPrice: z.number().nonnegative('Preço unitário deve ser não-negativo'),
  totalPrice: z.number().nonnegative('Preço total deve ser não-negativo'),
  estimatedDays: z.number().positive('Dias estimados devem ser positivos').optional(),  // NOVO
});

const budgetItems = data.items.map(item => ({
  quote_id: budget.id,
  service_id: item.serviceId,
  description: item.description,
  quantity: item.quantity,
  unit_price: item.unitPrice,
  total_price: item.totalPrice,
  estimated_days: item.estimatedDays || null,  // NOVO
  created_at: new Date().toISOString(),
}));
```

### 2. API PUT: Atualizar Orçamento
**Arquivo**: `app/api/partner/budgets/[budgetId]/route.ts`

**Mudanças**:
- Interface `BudgetItem` estendida com `estimatedDays?: number`
- Campo `estimated_days` adicionado ao insert de `quote_items`

```typescript
interface BudgetItem {
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  estimatedDays?: number;  // NOVO
}

const quoteItemInsert = {
  quote_id: budgetId,
  service_id: serviceId,
  quantity: item.quantity,
  unit_price: item.unitPrice,
  total_price: item.totalPrice,
  description: item.description || null,
  estimated_days: item.estimatedDays || null,  // NOVO
  created_at: new Date().toISOString(),
};
```

### 3. API GET: Buscar Orçamento
**Arquivo**: `app/api/partner/budgets/[budgetId]/route.ts`

**Mudanças**:
- Interface `BudgetItemResponse` estendida com `estimatedDays?: number`
- Query SELECT inclui `estimated_days`
- Mapeamento inclui `estimatedDays` na resposta

```typescript
interface BudgetItemResponse {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  estimatedDays?: number;  // NOVO
}

const { data: quoteItems, error: itemsError } = await supabase
  .from('quote_items')
  .select(`
    id,
    service_id,
    quantity,
    unit_price,
    total_price,
    description,
    estimated_days,  // NOVO
    created_at
  `)
  .eq('quote_id', budgetId)
  .order('created_at', { ascending: true });

const budgetItems: BudgetItemResponse[] = (quoteItems || []).map(item => ({
  id: item.id,
  serviceId: item.service_id,
  description: item.description || `Serviço ${item.service_id.slice(0, 8)}`,
  quantity: item.quantity,
  unitPrice: parseFloat(item.unit_price.toString()),
  totalPrice: parseFloat(item.total_price.toString()),
  estimatedDays: item.estimated_days || undefined,  // NOVO
}));
```

## ✅ Status de Implementação

| Componente | Status | Arquivo |
|-----------|--------|---------|
| Migration | ✅ Completo | `supabase/migrations/20251013071550_add_estimated_days_to_quote_items.sql` |
| Hook useBudget | ✅ Completo | `modules/partner/hooks/useBudget.ts` |
| Hook useBudgetSaver | ✅ Completo | `modules/partner/hooks/useBudgetSaver.ts` |
| Componente BudgetSummary | ✅ Completo | `modules/partner/components/budget/BudgetSummary.tsx` |
| Página Orçamento | ✅ Completo | `app/dashboard/partner/orcamento/page.tsx` |
| API POST /budgets | ✅ Completo | `app/api/partner/budgets/route.ts` |
| API PUT /budgets/[id] | ✅ Completo | `app/api/partner/budgets/[budgetId]/route.ts` |
| API GET /budgets/[id] | ✅ Completo | `app/api/partner/budgets/[budgetId]/route.ts` |

## 🧪 Como Testar

### 1. Criar Novo Orçamento com Dias Estimados
```bash
# 1. Acessar: http://localhost:3000/dashboard/partner/orcamento
# 2. Selecionar uma solicitação de serviço
# 3. Adicionar serviços
# 4. Para cada serviço, inserir dias estimados (ex: 2 dias)
# 5. Salvar orçamento
# 6. Verificar no banco:
```

```sql
SELECT 
  qi.id,
  qi.description,
  qi.estimated_days,
  q.id as quote_id
FROM quote_items qi
JOIN quotes q ON qi.quote_id = q.id
WHERE q.partner_id = '<partner_id>'
ORDER BY qi.created_at DESC
LIMIT 10;
```

### 2. Editar Orçamento Existente
```bash
# 1. Acessar lista de orçamentos
# 2. Clicar em "Editar" em um orçamento
# 3. Verificar se dias estimados carregam corretamente
# 4. Modificar valores
# 5. Salvar
# 6. Verificar persistência no banco
```

### 3. Casos de Borda
- ✅ Serviço sem dias estimados (NULL) → Deve aceitar
- ✅ Dias estimados = 0 → Deve rejeitar (constraint)
- ✅ Dias estimados negativos → Deve rejeitar (constraint)
- ✅ Dias estimados = 1 → Deve mostrar "dia" (singular)
- ✅ Dias estimados > 1 → Deve mostrar "dias" (plural)

## 🔮 Melhorias Futuras

### 1. Cálculo de Prazo Total
```typescript
// Opção A: Serviços paralelos (usa MAX)
const totalDays = Math.max(...budget.items.map(i => i.estimatedDays || 0));

// Opção B: Serviços sequenciais (usa SUM)
const totalDays = budget.items.reduce((sum, i) => sum + (i.estimatedDays || 0), 0);

// Exibir: "Prazo total estimado: X dias"
```

### 2. Visibilidade no Admin
```tsx
// Admin vê tempo estimado ao revisar orçamento
<div>
  <h4>Prazo Estimado</h4>
  <p>{maxEstimatedDays} dias</p>
</div>
```

### 3. Visibilidade no Cliente
```tsx
// Cliente vê quando aprovar orçamento
<div className="estimated-completion">
  <CalendarIcon />
  <span>Seu veículo ficará pronto em aproximadamente {maxEstimatedDays} dias</span>
</div>
```

### 4. Comparação com Real
```sql
-- Comparar estimado vs real
SELECT 
  qi.description,
  qi.estimated_days,
  EXTRACT(DAY FROM (qi.completed_at - qi.created_at)) as actual_days,
  qi.estimated_days - EXTRACT(DAY FROM (qi.completed_at - qi.created_at)) as difference
FROM quote_items qi
WHERE qi.completed_at IS NOT NULL
  AND qi.estimated_days IS NOT NULL;
```

### 5. Métricas de Acurácia do Parceiro
```typescript
// Calcular precisão das estimativas do parceiro
interface AccuracyMetrics {
  averageEstimate: number;
  averageActual: number;
  accuracy: number; // % de vezes que ficou dentro de ±1 dia
  onTime: number; // % de serviços completados no prazo
}
```

## 📝 Notas Técnicas

### Constraints do Banco
- `estimated_days` aceita `NULL` (opcional)
- `estimated_days` deve ser positivo quando definido
- Índice criado para performance em queries

### Validação
- Frontend: `type="number" min="1"` no input
- Backend: Zod schema com `.positive()` para validação
- Database: CHECK constraint para integridade

### TypeScript
- Todos os tipos atualizados end-to-end
- Sem erros de compilação
- Type safety mantido

## 🎨 UX/UI

### Design
- Ícone: 📅 (calendário) para indicar prazo
- Input: 60px de largura, número inteiro
- Placeholder: "Dias"
- Label contextual: "dia" vs "dias"

### Comportamento
- Valor inicial: vazio (NULL)
- Aceita apenas números inteiros positivos
- Atualização em tempo real no estado
- Persiste ao salvar

## 🚀 Deploy

### Checklist
- [x] Migration aplicada
- [x] Frontend atualizado
- [x] Backend atualizado
- [x] Sem erros TypeScript
- [x] Documentação criada
- [ ] Testes manuais executados
- [ ] Commit realizado
- [ ] Deploy em produção

### Comando de Deploy
```bash
git add -A
git commit -m "feat(quotes): adicionar estimativa de dias por serviço

- Migration: estimated_days em quote_items
- Frontend: input de dias em BudgetSummary
- Hook: updateEstimatedDays em useBudget
- Payload: estimatedDays incluído no save
- API: endpoints atualizados para persistir
"
git push origin refactor/partner-overview-incremental
```

---

**Data de Criação**: 2025-01-13  
**Status**: ✅ Implementação Completa  
**Próximos Passos**: Testes manuais e melhorias futuras
