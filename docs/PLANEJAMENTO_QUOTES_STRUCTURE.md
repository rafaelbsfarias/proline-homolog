# 🏗️ PLANEJAMENTO: ESTRUTURA DE ORÇAMENTOS COM QUOTES

## 📋 SITUAÇÃO ATUAL

### ✅ **BUILD CORRIGIDO**
- Erros de TypeScript resolvidos
- Componentes funcionando corretamente
- Interface do parceiro operacional

### 🗄️ **ESTRUTURA ATUAL FUNCIONAL**
```sql
-- TABELAS EXISTENTES E FUNCIONAIS:
quotes (
  id,
  created_at,
  updated_at, 
  service_order_id,      -- FK para service_orders
  partner_id,            -- FK para partners
  total_value,           -- Valor total do orçamento
  supplier_delivery_date,
  status
)

service_orders (
  id,
  quote_id,              -- FK para quotes
  vehicle_id,            -- FK para vehicles  
  order_code,
  status,
  created_at,
  updated_at
)

vehicles (
  id,
  plate,
  brand,
  model,
  year,
  color
)

services (
  id,
  name,
  description,
  price,
  partner_id
)
```

---

## 🎯 OBJETIVO: ARMAZENAR SERVIÇOS SELECIONADOS

### **NECESSIDADE:**
O parceiro precisa poder:
1. ✅ Receber um pedido de orçamento (já funciona via `quotes`)
2. ✅ Ver dados do veículo (já funciona via `service_orders` → `vehicles`)
3. ❌ **FALTA:** Selecionar serviços e definir quantidade/preço
4. ❌ **FALTA:** Salvar os serviços selecionados com valores

---

## 🚀 SOLUÇÃO RECOMENDADA: CRIAR TABELA `quote_items`

### **VANTAGENS:**
- ✅ **Normalizada:** Melhor para consultas e relatórios
- ✅ **Relacionamentos:** FK para `services` permite integridade
- ✅ **Flexibilidade:** Cada item pode ter preço/quantidade customizada
- ✅ **Escalabilidade:** Fácil de expandir com novos campos
- ✅ **Auditoria:** Histórico detalhado de cada serviço

### **ESTRUTURA PROPOSTA:**

```sql
CREATE TABLE quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_service_id ON quote_items(service_id);

-- Constraint para garantir coerência
ALTER TABLE quote_items 
ADD CONSTRAINT check_total_price 
CHECK (total_price = quantity * unit_price);
```

---

## 📊 FLUXO COMPLETO PROPOSTO

### **1. FLUXO DE DADOS:**
```
Especialista → service_orders → quotes → quote_items ← services
                      ↓
                   vehicles
```

### **2. FLUXO DO PARCEIRO:**
```
1. Recebe notificação de novo quote
2. Acessa página de orçamento  
3. Vê dados do veículo (via service_orders)
4. Seleciona serviços da lista (services)
5. Define quantidade e preço unitário
6. Sistema calcula total automaticamente
7. Salva quote_items
8. Atualiza total_value na quote
```

### **3. ESTRUTURA DE RESPOSTA DA API:**
```json
{
  "id": "quote-uuid",
  "name": "Orçamento ABC003N2",
  "vehiclePlate": "ABC003N2", 
  "vehicleModel": "Palio",
  "vehicleBrand": "Chevrolet",
  "vehicleYear": 2015,
  "totalValue": 3500.00,
  "status": "draft",
  "items": [
    {
      "id": "item-uuid",
      "serviceId": "service-uuid", 
      "serviceName": "Lavagem Completa",
      "quantity": 2,
      "unitPrice": 50.00,
      "totalPrice": 100.00
    }
  ]
}
```

---

## 🛠️ IMPLEMENTAÇÃO EM ETAPAS

### **ETAPA 1: CRIAR TABELA `quote_items`** ✅ PRIORITÁRIA
```sql
-- Migration para criar a tabela
-- Relacionamentos com quotes e services
-- Constraints de integridade
```

### **ETAPA 2: AJUSTAR API DE ORÇAMENTOS**
```typescript
// GET /api/partner/budgets/[budgetId]
// - Incluir JOIN com quote_items e services
// - Retornar lista de serviços selecionados

// PUT /api/partner/budgets/[budgetId]  
// - Salvar/atualizar quote_items
// - Recalcular total_value na quotes
```

### **ETAPA 3: AJUSTAR BudgetService**
```typescript
// Remover referências a partner_budgets
// Usar quotes + quote_items
// Manter compatibilidade com interface atual
```

### **ETAPA 4: TESTAR FLUXO COMPLETO**
```
1. Criar quote com service_order + vehicle
2. Parceiro acessa orçamento
3. Seleciona serviços e define preços  
4. Salva e verifica persistência
```

---

## 📝 MIGRATION SQL ESPECÍFICA

```sql
-- 1. Criar tabela quote_items
CREATE TABLE quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir cálculo correto
  CONSTRAINT check_total_price_calculation 
  CHECK (total_price = quantity * unit_price)
);

-- 2. Índices para performance
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_service_id ON quote_items(service_id);
CREATE INDEX idx_quote_items_created_at ON quote_items(created_at);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_quote_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quote_items_updated_at
  BEFORE UPDATE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_items_updated_at();

-- 4. Função para recalcular total do quote
CREATE OR REPLACE FUNCTION recalculate_quote_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quotes 
  SET 
    total_value = COALESCE((
      SELECT SUM(total_price) 
      FROM quote_items 
      WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers para recalcular total automaticamente
CREATE TRIGGER trigger_recalculate_quote_total_insert
  AFTER INSERT ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_quote_total();

CREATE TRIGGER trigger_recalculate_quote_total_update  
  AFTER UPDATE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_quote_total();

CREATE TRIGGER trigger_recalculate_quote_total_delete
  AFTER DELETE ON quote_items
  FOR EACH ROW  
  EXECUTE FUNCTION recalculate_quote_total();
```

---

## ✅ PRÓXIMOS PASSOS RECOMENDADOS

### **IMEDIATO:**
1. **Criar migration** com a tabela `quote_items`
2. **Testar migration** em ambiente de desenvolvimento
3. **Ajustar API** para incluir quote_items nas consultas

### **CURTO PRAZO:**
1. **Atualizar BudgetService** para usar nova estrutura
2. **Implementar salvamento** de serviços selecionados
3. **Testar fluxo completo** do parceiro

### **MÉDIO PRAZO:**
1. **Limpar scripts temporários** do projeto
2. **Documentar nova arquitetura**
3. **Implementar validações** de negócio

---

## 🎯 RESULTADO ESPERADO

Com esta implementação, o parceiro será capaz de:

✅ **Receber pedidos de orçamento** (já funciona)  
✅ **Ver dados do veículo** (já funciona)  
✅ **Selecionar serviços** da sua lista  
✅ **Definir quantidade e preços** por serviço  
✅ **Salvar orçamento** com itens detalhados  
✅ **Calcular total automaticamente**  
✅ **Manter histórico** de todos os serviços  

**Domínio do parceiro limpo e funcional! 🚀**
