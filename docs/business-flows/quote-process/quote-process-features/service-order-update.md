# Atualização: Ordem de Serviço com Prazos e Preços

## 📋 Resumo
Atualização da página de Ordem de Serviço para:
1. Remover informações do prestador de serviço e cliente
2. Adicionar informação de preço unitário por serviço
3. Mostrar data de impressão
4. Indicar que execução deve começar em 24 horas
5. Calcular e exibir data estimada de conclusão baseada nos prazos dos serviços

## 🎯 Objetivo
Tornar a ordem de serviço mais focada nas informações operacionais essenciais:
- **Quando começar**: Máximo 24 horas após impressão
- **Quanto tempo**: Prazo estimado por serviço e total
- **Quando terminar**: Data calculada de conclusão
- **Quanto custa**: Valor unitário de cada serviço

## 🗄️ Mudanças no Backend

### API Endpoint: `/api/partner/service-order/[quoteId]`
**Arquivo**: `app/api/partner/service-order/[quoteId]/route.ts`

#### Mudanças nos Dados Retornados

**1. Busca de Itens com Preços e Prazos**:
```typescript
const { data: items, error: itemsError } = await supabase
  .from('quote_items')
  .select('id, description, quantity, unit_price, estimated_days, completed_at')
  .eq('quote_id', quoteId)
  .order('description', { ascending: true });
```

**2. Cálculo de Prazo Total**:
```typescript
// Soma de todos os estimated_days dos itens
const totalEstimatedDays = (items || []).reduce((total, item) => {
  return total + (item.estimated_days || 0);
}, 0);
```

**3. Cálculo de Datas**:
```typescript
// Data de impressão (agora)
const printDate = new Date();

// Data de início (24 horas após impressão)
const startDate = new Date(printDate);
startDate.setHours(startDate.getHours() + 24);

// Data de conclusão estimada (adicionando dias úteis)
let daysToAdd = totalEstimatedDays || estimatedDays;
const currentDate = new Date(startDate);

while (daysToAdd > 0) {
  currentDate.setDate(currentDate.getDate() + 1);
  const dayOfWeek = currentDate.getDay();
  // Pular fins de semana (0 = domingo, 6 = sábado)
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    daysToAdd--;
  }
}
```

**4. Resposta Atualizada**:
```typescript
{
  ok: true,
  serviceOrder: {
    id: string,
    created_at: string,
    print_date: string,              // NOVO
    start_date: string,              // NOVO
    estimated_completion_date: string, // NOVO
    estimated_days: number,          // Agora é a soma total
    status: string,
    vehicle: { ... },
    partner: { ... },
    client: { ... },
    items: Array<{
      id: string,
      description: string,
      quantity: number,
      unit_price: number,           // NOVO
      estimated_days?: number,      // NOVO
    }>,
    evidences: [ ... ]
  }
}
```

## 💻 Mudanças no Frontend

### Página: `/dashboard/partner/service-order`
**Arquivo**: `app/dashboard/partner/service-order/page.tsx`

#### 1. Interface Atualizada

```typescript
interface ServiceOrderData {
  id: string;
  created_at: string;
  print_date: string;                 // NOVO
  start_date: string;                 // NOVO
  estimated_completion_date: string;  // NOVO
  estimated_days: number;
  status: string;
  vehicle: { ... };
  partner: { ... };
  client: { ... };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;              // NOVO
    estimated_days?: number;         // NOVO
  }>;
}
```

#### 2. Função de Formatação de Data/Hora

```typescript
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

#### 3. Cabeçalho Atualizado

**Antes**:
```
ORDEM DE SERVIÇO
OS Nº: B85E4BC4
Data de Emissão: 13/10/2025
```

**Depois**:
```
ORDEM DE SERVIÇO
OS Nº: B85E4BC4
Data de Emissão: 13/10/2025 14:30
```

#### 4. Seção de Prazos (NOVA)

Substituiu as seções "PRESTADOR DE SERVIÇO" e "CLIENTE" por:

```tsx
<div style={{ background: '#e8f4f8', padding: '20px', borderRadius: '8px' }}>
  <h3>⏰ PRAZOS DO SERVIÇO</h3>
  
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
    {/* Início da Execução */}
    <div>
      <p><strong>Início da Execução:</strong></p>
      <p style={{ fontWeight: 'bold' }}>14/10/2025 14:30</p>
      <p style={{ color: '#e74c3c' }}>(Máximo 24 horas após impressão)</p>
    </div>
    
    {/* Conclusão Estimada */}
    <div>
      <p><strong>Conclusão Estimada:</strong></p>
      <p style={{ fontWeight: 'bold', color: '#27ae60' }}>15/10/2025</p>
      <p style={{ color: '#7f8c8d' }}>(1 dia útil)</p>
    </div>
  </div>
</div>
```

**Características**:
- Background azul claro (#e8f4f8)
- Ícone de relógio ⏰
- Data de início em preto
- Alerta vermelho sobre 24 horas
- Data de conclusão em verde
- Contagem de dias úteis

#### 5. Tabela de Serviços Atualizada

**Colunas Anteriores**:
- Item
- Descrição do Serviço
- Qtd.

**Colunas Novas**:
- Item
- Descrição do Serviço
- Qtd.
- **Valor Unit.** (NOVO)
- **Prazo** (NOVO)

```tsx
<table>
  <thead>
    <tr>
      <th>Item</th>
      <th>Descrição do Serviço</th>
      <th>Qtd.</th>
      <th style={{ textAlign: 'right' }}>Valor Unit.</th>
      <th style={{ textAlign: 'center' }}>Prazo</th>
    </tr>
  </thead>
  <tbody>
    {data.items.map((item, index) => (
      <tr key={item.id}>
        <td>{index + 1}</td>
        <td>{item.description}</td>
        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
        <td style={{ textAlign: 'right', fontWeight: '500' }}>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(item.unit_price)}
        </td>
        <td style={{ textAlign: 'center', color: '#7f8c8d' }}>
          {item.estimated_days
            ? `${item.estimated_days} ${item.estimated_days === 1 ? 'dia' : 'dias'}`
            : '-'}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Formatação**:
- Valores em BRL: R$ 150,00
- Prazo: "1 dia" ou "2 dias" ou "-"
- Alinhamento: preço à direita, prazo centralizado

#### 6. Rodapé Atualizado

**Antes**:
```
Emitido em: 13/10/2025 14:30:45
```

**Depois**:
```
Impresso em: 13/10/2025 14:30
```

## 📊 Comparação Visual

### Layout Anterior
```
┌─────────────────────────────────────────┐
│ ORDEM DE SERVIÇO                        │
│ OS Nº: B85E4BC4                        │
│ Data: 13/10/2025                        │
├──────────────────┬──────────────────────┤
│ PRESTADOR        │ CLIENTE              │
│ Empresa: ...     │ Nome: ...            │
│ Responsável: ... │ Telefone: ...        │
│ Telefone: ...    │ E-mail: ...          │
├──────────────────┴──────────────────────┤
│ VEÍCULO                                 │
│ Placa | Marca | Modelo | Ano | Cor | Km│
├─────────────────────────────────────────┤
│ SERVIÇOS                                │
│ Item | Descrição | Qtd.                 │
│  1   | Serviço A |  1                   │
│  2   | Serviço B |  1                   │
├─────────────────────────────────────────┤
│ ⏱ Prazo: 1 dias úteis                   │
└─────────────────────────────────────────┘
```

### Layout Novo
```
┌─────────────────────────────────────────┐
│ ORDEM DE SERVIÇO                        │
│ OS Nº: B85E4BC4                        │
│ Data de Emissão: 13/10/2025 14:30      │
├─────────────────────────────────────────┤
│ ⏰ PRAZOS DO SERVIÇO                    │
│ ┌─────────────────┬─────────────────┐  │
│ │ Início:         │ Conclusão:      │  │
│ │ 14/10 14:30     │ 15/10/2025      │  │
│ │ (Max 24h)       │ (1 dia útil)    │  │
│ └─────────────────┴─────────────────┘  │
├─────────────────────────────────────────┤
│ VEÍCULO                                 │
│ Placa | Marca | Modelo | Ano | Cor | Km│
├─────────────────────────────────────────┤
│ SERVIÇOS                                │
│ # | Descrição | Qtd | Valor | Prazo    │
│ 1 | Serviço A |  1  | R$ 50 | 1 dia    │
│ 2 | Serviço B |  1  | R$100 | -        │
└─────────────────────────────────────────┘
```

## 🔧 Lógica de Cálculo de Dias Úteis

### Algoritmo
```typescript
function calcularDataConclusao(dataInicio: Date, diasUteis: number): Date {
  let diasRestantes = diasUteis;
  const dataAtual = new Date(dataInicio);
  
  while (diasRestantes > 0) {
    dataAtual.setDate(dataAtual.getDate() + 1);
    const diaDaSemana = dataAtual.getDay();
    
    // Se não for sábado (6) nem domingo (0)
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      diasRestantes--;
    }
  }
  
  return dataAtual;
}
```

### Exemplo de Cálculo

**Cenário 1**: Impressão na sexta-feira às 14:00
- **Impressão**: Sexta, 13/10/2025 14:00
- **Início**: Sábado, 14/10/2025 14:00 (24h depois)
- **Prazo**: 2 dias úteis
- **Conclusão**: Quarta, 18/10/2025
  - Sábado 14 (ignorado - fim de semana)
  - Domingo 15 (ignorado - fim de semana)
  - Segunda 16 (dia útil #1)
  - Terça 17 (dia útil #2)
  - Quarta 18 (conclusão)

**Cenário 2**: Impressão na segunda-feira às 10:00
- **Impressão**: Segunda, 16/10/2025 10:00
- **Início**: Terça, 17/10/2025 10:00
- **Prazo**: 1 dia útil
- **Conclusão**: Quarta, 18/10/2025

## ✅ Regras de Negócio

### 1. Início da Execução
- **Máximo**: 24 horas após impressão da OS
- **Indicador**: Texto vermelho alertando prazo
- **Responsabilidade**: Parceiro deve iniciar trabalho no prazo

### 2. Cálculo de Prazo
- **Fonte**: Soma de `estimated_days` de todos os `quote_items`
- **Fallback**: Se nenhum item tem prazo, usa `estimated_days` da tabela `services`
- **Tipo**: Apenas dias úteis (segunda a sexta)

### 3. Data de Conclusão
- **Base**: Data de início + dias úteis
- **Feriados**: Não são considerados (apenas sábado/domingo ignorados)
- **Precisão**: Data (sem hora específica)

### 4. Valores Unitários
- **Formato**: BRL com 2 decimais (R$ 150,00)
- **Fonte**: `quote_items.unit_price`
- **Visibilidade**: Sempre exibido

### 5. Prazo por Serviço
- **Formato**: "X dia(s)" ou "-"
- **Fonte**: `quote_items.estimated_days`
- **Opcional**: Se NULL, mostra "-"

## 📱 Responsividade

### Impressão
```css
@media print {
  @page {
    margin: 1cm;
  }
  .no-print {
    display: none !important;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

**Características**:
- Margem de 1cm
- Cores preservadas (backgrounds azul/verde)
- Botões de ação ocultados
- Otimizado para A4

## 🧪 Casos de Teste

### Teste 1: Ordem com Múltiplos Serviços e Prazos
```json
{
  "items": [
    { "description": "Troca de óleo", "unit_price": 150.00, "estimated_days": 1 },
    { "description": "Alinhamento", "unit_price": 80.00, "estimated_days": 1 },
    { "description": "Balanceamento", "unit_price": 60.00, "estimated_days": null }
  ]
}
```

**Resultado Esperado**:
- Prazo total: 2 dias úteis
- Serviço 1: "1 dia"
- Serviço 2: "1 dia"  
- Serviço 3: "-"

### Teste 2: Ordem Impressa na Sexta
**Input**:
- Data impressão: Sexta, 13/10/2025 16:00
- Prazo total: 3 dias úteis

**Output**:
- Início: Sábado, 14/10/2025 16:00
- Conclusão: Quarta, 18/10/2025
  - Sábado ignorado
  - Domingo ignorado
  - Segunda (dia 1)
  - Terça (dia 2)
  - Quarta (dia 3)

### Teste 3: Ordem Sem Prazos Definidos
**Input**:
```json
{
  "items": [
    { "description": "Serviço", "unit_price": 100.00, "estimated_days": null }
  ]
}
```

**Output**:
- Prazo total: 0 (ou valor de `services.estimated_days`)
- Na tabela: "-"
- Data conclusão: mesma data de início

## 📊 Impacto

### Informações Removidas
- ❌ Seção "PRESTADOR DE SERVIÇO"
  - Empresa
  - Responsável
  - Telefone
- ❌ Seção "CLIENTE"
  - Nome
  - Telefone
  - E-mail

**Justificativa**: Foco operacional - essas informações são mantidas no sistema mas não são necessárias na ordem de serviço impressa.

### Informações Adicionadas
- ✅ Data/hora de impressão
- ✅ Data/hora de início (24h após impressão)
- ✅ Data estimada de conclusão
- ✅ Alerta de 24h para início
- ✅ Valor unitário de cada serviço
- ✅ Prazo individual de cada serviço

## 🔄 Fluxo Completo

```
1. Cliente aprova orçamento
   ↓
2. Parceiro acessa "Gerar Ordem de Serviço"
   ↓
3. Sistema calcula:
   - Data impressão = agora
   - Data início = impressão + 24h
   - Prazo total = soma(estimated_days dos itens)
   - Data conclusão = início + prazo (dias úteis)
   ↓
4. Ordem gerada com:
   - Cabeçalho (OS#, data impressão)
   - Seção de prazos (início, conclusão)
   - Dados do veículo
   - Tabela de serviços (com preços e prazos)
   - Assinaturas
   ↓
5. Parceiro imprime/baixa PDF
   ↓
6. Parceiro tem 24h para iniciar execução
```

## 🎯 Objetivos Alcançados

✅ **Clareza Operacional**: Informações essenciais para execução  
✅ **Gestão de Prazo**: Alertas e datas claras  
✅ **Transparência Financeira**: Valores por serviço visíveis  
✅ **Planejamento**: Prazos individuais ajudam na organização  
✅ **Responsabilização**: Alerta de 24h para início é explícito  
✅ **Rastreabilidade**: Data de impressão registrada  

---

**Data de Criação**: 2025-10-13  
**Status**: ✅ Implementação Completa  
**Impacto**: Alto - Melhora gestão operacional e transparência
