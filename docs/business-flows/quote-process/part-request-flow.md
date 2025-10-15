# Solicitação de Compra de Peças - Partner Checklist

## 📋 Visão Geral

Sistema de solicitação de compra de peças vinculado às anomalias encontradas durante a inspeção do checklist do parceiro.

## 🗄️ Estrutura do Banco de Dados

### Tabela: `part_requests`

```sql
CREATE TABLE part_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id UUID NOT NULL REFERENCES vehicle_anomalies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  part_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  estimated_price NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'received')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Status da Solicitação

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando aprovação do admin |
| `approved` | Aprovada para compra |
| `rejected` | Rejeitada pelo admin |
| `ordered` | Pedido realizado ao fornecedor |
| `received` | Peça recebida |

### RLS (Row Level Security)

- **Partners**: Podem criar e visualizar suas próprias solicitações
- **Clients**: Podem visualizar solicitações dos seus veículos
- **Specialists**: Podem visualizar solicitações dos veículos de seus clientes
- **Admins**: Acesso total

## 🎨 Interface do Parceiro

### Dynamic Checklist Page

#### 1. Registro de Anomalia
```tsx
// Cada anomalia tem:
- Descrição (obrigatório)
- Fotos (opcional, múltiplas)
- Solicitação de Peças (opcional) ✨ NOVO
```

#### 2. Botão de Solicitação
```tsx
// Aparece ao final de cada card de anomalia
{!anomaly.partRequest ? (
  <button onClick={() => openPartRequestModal(anomaly.id)}>
    🛒 Solicitar Compra de Peças
  </button>
) : (
  <div>
    // Exibe resumo da solicitação
    // Botões: "Editar" e "Remover"
  </div>
)}
```

#### 3. Modal de Solicitação
```tsx
// Campos do formulário:
- Nome da Peça * (obrigatório)
- Descrição (opcional) - especificações, marca sugerida
- Quantidade * (padrão: 1)
- Preço Estimado (opcional) - valor por unidade
```

### Estados da UI

1. **Sem Solicitação** 
   - Botão verde "🛒 Solicitar Compra de Peças"
   
2. **Com Solicitação**
   - Card azul com resumo da solicitação
   - Botões: "Editar" e "Remover"
   
3. **Modal Aberto**
   - Formulário de preenchimento
   - Botões: "Cancelar" e "Salvar Solicitação"

## 📡 Fluxo de Dados

### 1. Frontend → Hook

```typescript
// Interface da Anomalia
interface AnomalyEvidence {
  id: string;
  description: string;
  photos: (File | string)[];
  partRequest?: {
    partName: string;
    partDescription?: string;
    quantity: number;
    estimatedPrice?: number;
  };
}
```

### 2. Hook → API

```typescript
// modules/partner/hooks/usePartnerChecklist.ts
const saveAnomalies = async (anomalies: AnomalyEvidence[]) => {
  const anomaliesData = anomalies.map(anomaly => ({
    description: anomaly.description,
    photos: photoRefs,
    partRequest: anomaly.partRequest, // ✨ Incluído
  }));
  
  formData.append('anomalies', JSON.stringify(anomaliesData));
  // POST /api/partner/checklist/save-anomalies
};
```

### 3. API → Banco

```typescript
// app/api/partner/checklist/save-anomalies/route.ts

// 1. Salva anomalias
const { data: savedAnomalies } = await supabase
  .from('vehicle_anomalies')
  .insert(processedAnomalies)
  .select('*');

// 2. Para cada anomalia com partRequest
for (let i = 0; i < savedAnomalies.length; i++) {
  if (processedAnomalies[i].partRequest) {
    partRequestsToInsert.push({
      anomaly_id: savedAnomalies[i].id,
      vehicle_id,
      partner_id,
      part_name: anomaly.partRequest.partName,
      part_description: anomaly.partRequest.partDescription,
      quantity: anomaly.partRequest.quantity,
      estimated_price: anomaly.partRequest.estimatedPrice,
      status: 'pending',
    });
  }
}

// 3. Remove solicitações antigas (upsert behavior)
await supabase
  .from('part_requests')
  .delete()
  .in('anomaly_id', anomalyIds);

// 4. Insere novas solicitações
await supabase
  .from('part_requests')
  .insert(partRequestsToInsert);
```

## 🧪 Casos de Uso

### Caso 1: Primeira Solicitação

1. Parceiro registra anomalia: "Pastilha de freio gasta"
2. Clica em "🛒 Solicitar Compra de Peças"
3. Preenche:
   - Nome: "Pastilha de freio dianteira"
   - Descrição: "Original ou equivalente Bosch"
   - Quantidade: 2
   - Preço: 150.00
4. Clica em "Salvar Solicitação"
5. Card mostra resumo azul
6. Ao salvar checklist, solicitação vai para banco com status `pending`

### Caso 2: Editar Solicitação

1. Parceiro vê solicitação existente no card azul
2. Clica em "Editar Solicitação"
3. Modal abre com valores preenchidos
4. Altera quantidade de 2 para 4
5. Salva
6. Card atualiza na tela

### Caso 3: Remover Solicitação

1. Parceiro decide que não precisa mais da peça
2. Clica em "Remover" no card azul
3. Solicitação é removida do estado local
4. Botão verde "Solicitar" volta a aparecer
5. Ao salvar checklist, solicitação não é criada no banco

### Caso 4: Múltiplas Anomalias com Solicitações

1. Anomalia 1: "Pastilha desgastada" → Solicita pastilhas
2. Anomalia 2: "Disco riscado" → Solicita discos de freio
3. Anomalia 3: "Óleo vazando" → SEM solicitação (apenas evidência)
4. Ao salvar: 2 solicitações vão para banco

## 🎯 Regras de Negócio

1. **Vínculo Obrigatório**: Solicitação DEVE estar associada a uma anomalia
2. **Dados Obrigatórios**: Nome da peça e quantidade
3. **Valores Opcionais**: Descrição e preço estimado
4. **Persistência**: Salvo apenas quando checklist completo é salvo
5. **Atomicidade**: Se salvar anomalias falhar, solicitações não são criadas
6. **Upsert Behavior**: Ao re-salvar, remove antigas e cria novas (mantém histórico via created_at)

## 📊 Próximos Passos (Futuro)

### Painel Admin - Aprovação de Solicitações

```typescript
// Interface Admin
interface PartRequestWithDetails {
  id: string;
  part_name: string;
  part_description: string | null;
  quantity: number;
  estimated_price: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'received';
  partner_name: string;
  vehicle_plate: string;
  anomaly_description: string;
  created_at: string;
}

// Ações Admin
- Aprovar solicitação
- Rejeitar solicitação (com motivo)
- Marcar como pedido realizado
- Marcar como recebido
- Adicionar notas administrativas
```

### Integrações Futuras

- [ ] Integração com catálogo de peças
- [ ] Sugestões automáticas de fornecedores
- [ ] Comparação de preços
- [ ] Histórico de compras similares
- [ ] Notificações (partner e admin)
- [ ] Relatórios de solicitações por período
- [ ] Dashboard de status das peças

### Melhorias na UI

- [ ] Autocomplete para nomes de peças comuns
- [ ] Validação de preço vs. mercado
- [ ] Preview da solicitação antes de salvar checklist
- [ ] Indicador visual de anomalias com/sem solicitação
- [ ] Filtros por status na lista de solicitações

## 📝 Arquivos Modificados

```
✅ supabase/migrations/20251013143245_create_part_requests_table.sql
✅ modules/partner/hooks/usePartnerChecklist.ts
✅ app/dashboard/partner/dynamic-checklist/page.tsx
✅ app/api/partner/checklist/save-anomalies/route.ts
✅ docs/PART_REQUEST_FLOW.md (este arquivo)
```

## 🚀 Status

**✅ IMPLEMENTADO E FUNCIONAL**

- [x] Tabela `part_requests` criada
- [x] RLS policies configuradas
- [x] Interface do parceiro implementada
- [x] Modal de solicitação funcional
- [x] API atualizada para persistir solicitações
- [x] Hook atualizado com interface estendida
- [x] Documentação completa

**⏳ PENDENTE (Próximas Sprints)**
- [ ] Painel admin para aprovação
- [ ] Endpoints admin (aprovar/rejeitar)
- [ ] Notificações
- [ ] Relatórios

---

**Última atualização:** 13/10/2025  
**Versão:** 1.0.0  
**Branch:** refactor/partner-overview-incremental
