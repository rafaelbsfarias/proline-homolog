# 🏗️ DIAGRAMA DE RELACIONAMENTOS - SISTEMA DE ORÇAMENTOS

## 📊 Entidades e Relacionamentos

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    CLIENTS      │    │    VEHICLES     │    │ SERVICE_ORDERS  │
│                 │    │                 │    │                 │
│ • id (PK)       │    │ • id (PK)       │    │ • id (PK)       │
│ • name          │◄──┐│ • client_id(FK) │◄──┐│ • vehicle_id(FK)│
│ • email         │   ││ • plate         │   ││ • client_id(FK) │
│ • phone         │   ││ • brand         │   ││ • status        │
└─────────────────┘   │└─────────────────┘   │└─────────────────┘
                      │                      │          │
                      └──────────────────────┘          │
                                                        │
┌─────────────────┐    ┌─────────────────┐              │
│    PARTNERS     │    │ PARTNER_SERVICES│              │
│                 │    │                 │              │
│ • profile_id(PK)│◄──┐│ • id (PK)       │              │
│ • company_name  │   ││ • partner_id(FK)│              │
│ • cnpj          │   ││ • name          │              │
│ • is_active     │   ││ • description   │              │
└─────────────────┘   │└─────────────────┘              │
          │           │         │                       │
          │           └─────────┘                       │
          │                     │                       │
          │                     │                       │
┌─────────▼───────┐              │              ┌───────▼──────┐
│     QUOTES      │              │              │   SERVICES   │
│                 │              │              │              │
│ • id (PK)       │              │              │ • id (PK)    │
│ • partner_id(FK)│              │              │ • quote_id(FK)│
│ • service_order │◄─────────────┘              │ • description │
│   _id (FK)      │                             │ • value       │
│ • total_value   │                             │ • status      │
│ • status        │                             │ • estimated  │
│ • created_at    │                             │   _days       │
└─────────────────┘                             │ • parts_needed│
          │                                     └───────────────┘
          │                                             │
          │    ┌─────────────────┐                     │
          └───►│   QUOTE_ITEMS   │◄────────────────────┘
               │                 │
               │ • id (PK)       │
               │ • quote_id (FK) │
               │ • service_id(FK)│
               │ • quantity      │
               │ • unit_price    │
               │ • total_price   │
               │ • notes         │
               └─────────────────┘
```

---

## 🔄 FLUXO DE DADOS - CRIAÇÃO DE ORÇAMENTO

```
🚗 VEÍCULO EXISTENTE
├── ABC561S8 (Ford Palio 2021)
└── Status: "Análise Finalizada"

📋 SERVICE ORDER
├── ID: 5145908d-fd10-4d48-ae9b-4b5ff41383c6
├── vehicle_id: cced559b-8fcc-4777-9587-d63fc6369d83
└── status: "pending_quote"

👨‍🔧 PARTNER
├── mecanica@parceiro.com
├── ID: 86e44b50-3ecd-4d24-bb69-35a83ae09f8a
└── Catálogo: 37 serviços disponíveis

💰 PROCESSO DE ORÇAMENTO
│
├── 1. QUOTE (principal)
│   ├── service_order_id: [service_order.id]
│   ├── partner_id: [partner.id]
│   ├── status: "pending_admin_approval"
│   └── total_value: [soma dos itens]
│
├── 2. SERVICES (para cada serviço selecionado)
│   ├── quote_id: [quote.id]
│   ├── description: [partner_service.name]
│   ├── value: [partner_service.price]
│   └── status: "pending"
│
└── 3. QUOTE_ITEMS (para cada serviço)
    ├── quote_id: [quote.id]
    ├── service_id: [service.id criado acima]
    ├── quantity: [definido pelo usuário]
    └── total_price: [unit_price × quantity]
```

---

## 💡 EXEMPLO PRÁTICO

### Cenário: Partner seleciona 2 serviços

**Entrada do usuário:**
```json
{
  "vehiclePlate": "ABC561S8",
  "selectedServices": [
    {
      "partner_service_id": "e8e75b4d-90e1-46b7-893f-359ca53be068",
      "name": "Troca de óleo e filtros", 
      "price": 150,
      "quantity": 1
    },
    {
      "partner_service_id": "a2b99f21-b5b6-48fe-a710-a87edd95ac09",
      "name": "Reparo de sistema de freios",
      "price": 400,
      "quantity": 1  
    }
  ]
}
```

**Dados salvos no banco:**

1. **QUOTE** (1 registro):
```sql
INSERT INTO quotes (id, service_order_id, partner_id, total_value, status)
VALUES ('uuid-1', 'service-order-uuid', 'partner-uuid', 550.00, 'pending_admin_approval');
```

2. **SERVICES** (2 registros):
```sql
INSERT INTO services (id, quote_id, description, value, status) VALUES
('service-uuid-1', 'uuid-1', 'Troca de óleo e filtros', 150.00, 'pending'),
('service-uuid-2', 'uuid-1', 'Reparo de sistema de freios', 400.00, 'pending');
```

3. **QUOTE_ITEMS** (2 registros):
```sql
INSERT INTO quote_items (id, quote_id, service_id, quantity, unit_price, total_price) VALUES
('item-uuid-1', 'uuid-1', 'service-uuid-1', 1, 150.00, 150.00),
('item-uuid-2', 'uuid-1', 'service-uuid-2', 1, 400.00, 400.00);
```

---

## 🎯 RESULTADO FINAL

### No Dashboard do Partner:
- ✅ 1 Orçamento Pendente
- ✅ Veículo: ABC561S8 Ford Palio 2021
- ✅ 2 Serviços cotados
- ✅ Valor total: R$ 550,00
- ✅ Status: Aguardando aprovação do admin

### Na base de dados:
- ✅ 1 quote nova
- ✅ 2 services específicos para esta quote  
- ✅ 2 quote_items com quantidades e preços
- ✅ Relacionamentos corretos mantidos
- ✅ Integridade referencial preservada

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Transação Atômica**: Todo o processo deve ser uma transação única
2. **Rollback**: Se qualquer passo falhar, reverter tudo
3. **Validações**: Verificar se vehicle/service_order existem antes
4. **Status Enum**: Usar apenas valores válidos (pending_admin_approval, pending)
5. **Logs Detalhados**: Para debugar problemas específicos

---

## 🔧 DEBUGGING RECOMENDADO

Para entender por que ainda não está funcionando:

1. **Log cada passo** do processo de salvamento
2. **Verificar constraints** de cada tabela
3. **Testar inserção manual** no banco
4. **Validar tipos de dados** (UUID, decimais, enums)
5. **Confirmar foreign keys** existem antes de referenciar
