# 05) Modelo de Dados e APIs (Rascunho)

## Modelo de Dados Proposto
Evitar quebrar entidades atuais. Adicionar tabelas pequenas e focadas:

### vehicle_release_requests
- id (uuid, pk)
- vehicle_id (uuid, fk vehicles)
- service_order_id (uuid, fk service_orders)
- client_id (uuid, fk clients/profiles)
- type (enum: pickup | delivery)
- address_id (uuid, fk addresses, nullable para pickup)
- status (enum: requested | approved | scheduled | in_transit | delivered | canceled | rejected | failed)
- fee_amount (numeric, nullable)
- scheduled_at (timestamptz, nullable)
- window_start/window_end (timestamptz, nullable)
- assigned_partner_id (uuid, fk partners, nullable)
- notes (text, nullable)
- created_at, updated_at

### vehicle_release_history (opcional, auditoria)
- id, request_id, status_from, status_to, changed_by (admin/parceiro/sistema), notes, created_at

## APIs (Rascunho)

### Cliente
- GET `/api/client/vehicles/ready`
  - Lista veículos do cliente com `ready: boolean` e CTAs habilitados.
- POST `/api/client/vehicles/{vehicleId}/schedule-pickup`
  - body: `{ date?, timeWindow?, notes? }`
- POST `/api/client/vehicles/{vehicleId}/request-delivery`
  - body: `{ addressId, notes?, acceptFee? }`
- GET `/api/client/vehicles/{vehicleId}/release-requests`
  - Acompanhar status.

### Admin/Ops
- GET `/api/admin/vehicle-releases?status=…`
  - Listagem/filtragem.
- PATCH `/api/admin/vehicle-releases/{id}`
  - actions: approve, reject, schedule, assign_partner, mark_in_transit, mark_delivered, cancel

### Parceiro (logística) — opcional v1
- POST `/api/partner/logistics/vehicle-releases/{id}/accept`
- PATCH `/api/partner/logistics/vehicle-releases/{id}/progress`
  - atualizações: in_transit/delivered

## Observações
- Todas as rotas devem respeitar RLS e ownership (cliente só acessa seus veículos/pedidos).
- Admin usa service-role para ações administrativas.

