# 12) Contratos de API — Entrega do Veículo (Cliente/Admin)

> Rascunho dos endpoints. Não implementar ainda — alinhar com times de Produto/Ops.

## 12.1 Padrões Gerais
- Autenticação via Bearer Token.
- Datas: usar ISO (YYYY-MM-DD para data; ISO-8601 para timestamps) no payload e resposta.
- Erros: `{ error: string, details?: any }` com status HTTP 4xx/5xx.
- Sucesso: `{ success: true, ... }`.

## 12.2 Cliente — Criar pedido de entrega
POST `/api/client/deliveries`

Request
```json
{
  "vehicleId": "<uuid>",
  "addressId": "<uuid>",
  "desiredDate": "2025-10-25"
}
```

Response (201)
```json
{
  "success": true,
  "request": {
    "id": "<uuid>",
    "vehicle_id": "<uuid>",
    "service_order_id": "<uuid>",
    "client_id": "<uuid>",
    "address_id": "<uuid>",
    "status": "requested",
    "desired_date": "2025-10-25",
    "created_at": "2025-10-20T16:00:00.000Z"
  }
}
```

Validações
- Veículo pertence ao cliente e está “Finalizado”.
- Não há budgets pendentes/execução para o veículo.
- Address pertence ao cliente.

## 12.3 Cliente — Detalhe do pedido
GET `/api/client/deliveries/{requestId}`

Response (200)
```json
{
  "success": true,
  "request": {
    "id": "<uuid>",
    "status": "scheduled",
    "desired_date": "2025-10-25",
    "window_start": "2025-10-26T09:00:00.000Z",
    "window_end": "2025-10-26T12:00:00.000Z",
    "scheduled_at": "2025-10-22T15:00:00.000Z",
    "address": { "id": "<uuid>", "label": "Rua X, 123 - Centro" }
  },
  "events": [
    { "event_type": "created", "created_at": "2025-10-20T16:00:00.000Z" },
    { "event_type": "scheduled", "created_at": "2025-10-22T15:00:00.000Z" }
  ]
}
```

## 12.4 Cliente — Solicitar mudança de data
POST `/api/client/deliveries/{requestId}/reschedule`

Request
```json
{
  "requestedDate": "2025-10-28",
  "reason": "Estarei viajando"
}
```

Response (200)
```json
{ "success": true, "rescheduleRequestId": "<uuid>" }
```

Regras
- Só permitido se pedido não estiver `delivered`, `canceled`, `rejected`.
- Gera event `reschedule_requested` e linha em `delivery_reschedule_requests`.

## 12.5 Cliente — Aceitar/Recusar proposta do Admin
POST `/api/client/deliveries/{requestId}/accept-proposal`
```json
{ "rescheduleRequestId": "<uuid>" }
```

POST `/api/client/deliveries/{requestId}/decline-proposal`
```json
{ "rescheduleRequestId": "<uuid>", "reason": "Prefiro outra data" }
```

Efeitos
- `accept-proposal`: marca `resolution=accepted`, atualiza `delivery_requests.window_start/end` e `status=scheduled` (ou mantém `scheduled`), gera `scheduled` event.
- `decline-proposal`: `resolution=declined`, pode manter pedido em `approved` até nova proposta.

## 12.6 Admin — Listar pedidos
GET `/api/admin/deliveries?status=requested&addressId=<uuid>&dateStart=2025-10-20&dateEnd=2025-10-31&clientId=<uuid>`

Response (200)
```json
{
  "success": true,
  "items": [
    {
      "id": "<uuid>",
      "client": { "id": "<uuid>", "name": "Cliente X" },
      "vehicle": { "id": "<uuid>", "plate": "ABC1D23" },
      "address": { "id": "<uuid>", "label": "Rua X, 123 - Centro" },
      "status": "requested",
      "desired_date": "2025-10-25"
    }
  ],
  "totals": { "requested": 10, "scheduled": 5 }
}
```

## 12.7 Admin — Aprovar/Rejeitar
PATCH `/api/admin/deliveries/{requestId}`

Approve
```json
{ "action": "approve" }
```
Reject
```json
{ "action": "reject", "reason": "Endereço fora da área" }
```

## 12.8 Admin — Propor data / Agendar / Progredir
Propor janela
```http
POST /api/admin/deliveries/{requestId}/propose-date
{
  "windowStart": "2025-10-26T09:00:00.000Z",
  "windowEnd": "2025-10-26T12:00:00.000Z"
}
```

Agendar
```http
PATCH /api/admin/deliveries/{requestId}
{ "action": "schedule", "windowStart": "2025-10-26T09:00:00.000Z", "windowEnd": "2025-10-26T12:00:00.000Z" }
```

Progredir status
```http
PATCH /api/admin/deliveries/{requestId}
{ "action": "mark_in_transit" }
```
```http
PATCH /api/admin/deliveries/{requestId}
{ "action": "mark_delivered" }
```

## 12.9 Segurança
- RLS: cliente só acessa seus `delivery_requests`/eventos/reschedules.
- Admin: service-role nas rotas de admin.
- Sanitizar notas; evitar PII em timeline.

