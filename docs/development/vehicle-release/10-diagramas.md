# 10) Diagramas (Sequência e Fluxo)

> Observação: Diagramas em Mermaid para facilitar entendimento do fluxo. Não é implementação.

## 10.1 Sequência — Cliente solicita entrega e Admin aprova/sugere nova data

```mermaid
sequenceDiagram
  participant C as Cliente (Web)
  participant API as API (Client)
  participant ADM as Admin (Backoffice)
  participant APIA as API (Admin)
  participant DB as Banco de Dados

  C->>C: Veículo com status = Finalizado
  C->>C: Clica em “Solicitar entrega do Veículo”
  C->>API: POST /client/vehicles/{id}/request-delivery {addressId, date}
  API->>DB: Cria pedido (vehicle_release_requests: requested)
  API-->>C: 200 { success: true, requestId }
  C->>C: Exibe status “Aguardando aprovação”

  ADM->>APIA: GET /admin/vehicle-releases?status=requested
  APIA->>DB: Lista pedidos pendentes
  APIA-->>ADM: groups por endereço e pedidos
  ADM->>APIA: PATCH /admin/vehicle-releases/{id} { action: approve | propose_new_date }
  APIA->>DB: Atualiza status (approved | scheduled) e/ou data proposta
  APIA-->>ADM: 200 { success: true }

  C->>API: GET /client/vehicles/{id}/release-requests
  API->>DB: Busca status
  API-->>C: { status: approved | scheduled, date }
  C->>C: Mostra nova data aprovada/proposta
```

## 10.2 Fluxo de Estados — Pedido de Entrega

```mermaid
stateDiagram-v2
  [*] --> requested
  requested --> approved: admin aprova
  requested --> scheduled: admin sugere nova data
  approved --> scheduled: agenda data/janela
  scheduled --> in_transit: saiu para entrega
  in_transit --> delivered: entregue
  requested --> rejected: admin rejeita
  scheduled --> canceled: cancelado (cliente/admin)
  delivered --> [*]
  canceled --> [*]
  rejected --> [*]
```

## 10.3 Sequência — Ajuste do botão no Card do Veículo

```mermaid
sequenceDiagram
  participant UI as Client Dashboard
  participant TL as Timeline/Status

  UI->>TL: Verifica vehicle.status
  alt vehicle.status === "Finalizado"
    UI->>UI: Renderiza botão “Solicitar entrega do Veículo”
  else
    UI->>UI: Mantém botões atuais (sem entrega)
  end
```

