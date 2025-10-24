# Feature: Solicitação de Entrega/Retirada de Veículo (Cliente) e Aceite (Admin) com Notificação e Conclusão (Especialista)

Estado: Proposta de modelagem e consolidação — focada em DDD, DRY, KISS, SOLID

## Objetivo

- Permitir ao cliente solicitar:
  - Entrega em endereço cadastrado (delivery), ou
  - Retirada no pátio (pickup) informando uma data preferencial.
- Permitir ao administrador aceitar a retirada/entrega e (opcionalmente) propor nova data.
- Notificar o cliente quando a retirada for aprovada.
- O especialista será responsável por sinalizar a conclusão (retirada efetuada ou veículo entregue).
- Reaproveitar o fluxo de “mudança de data” do módulo de coleta.

## Princípios aplicados

- KISS: endpoints e casos de uso simples e objetivos; handlers HTTP finos.
- DRY: regras de janela, transições e escrita de timeline centralizadas em um serviço.
- SOLID:
  - SRP: separar responsabilidades entre controller/handler, serviço de domínio e repositórios.
  - DIP: rotas dependem de interfaces (ports) ao invés de implementação concreta de DB.
- DDD: linguagem ubíqua (DeliveryRequest, DeliveryStatus, DeliveryMethod, PickupWindow) e separação clara de domínio/infra/UI.

## Escopo atual vs pendências

Já implementado:
- Cliente solicita (delivery/pickup): `POST /api/client/deliveries` → insere em `delivery_requests` (status `requested`).
- Admin visualiza solicitações pendentes de retirada: `GET /api/admin/vehicles-awaiting-pickup` (ajustada para usar `delivery_requests`).
- Admin aceita retirada: `POST /api/admin/accept-vehicle-pickup-date` → agenda (status `scheduled`) e atualiza vehicle p/ “Aguardando Retirada”.

Pendências para finalizar a feature:
- Notificação ao cliente ao aceitar a retirada (email/Slack/push/in-app, via `NotificationPort`).
- Especialista concluir: endpoint e UI para marcar “retirada realizada” (ou “veículo entregue”) e refletir na timeline.
- Reaproveitar fluxo de mudança de data do módulo de coleta (regras e UI reutilizadas para pickup/delivery).
- Centralizar regras no domínio (serviço + repositórios) e remover duplicações.
- Flag persistente “retirada pendente” para desabilitar botão no cliente após reload.

## Modelagem de Domínio

Entidades e VO:
- DeliveryRequest (entidade)
  - id, vehicleId, clientId, serviceOrderId
  - method: `delivery` | `pickup`
  - addressId?: string (apenas para delivery)
  - status: `requested` | `approved` | `scheduled` | `in_transit` | `delivered` | `canceled` | `rejected`
  - desiredDate: ISO (YYYY-MM-DD)
  - windowStart?: ISODateTime, windowEnd?: ISODateTime, scheduledAt?: ISODateTime
  - createdBy
- PickupWindow (VO)
  - start: ISODateTime, end: ISODateTime, derivado de `desiredDate` + regra de janela (ex.: 09–18h UTC)

Serviço de Domínio: DeliveryService
- createRequest(input): cria pedido; valida propriedade do veículo e status finalizado.
- approvePickup(requestId): transita para `scheduled`, gera janela via `PickupWindow`, atualiza status do veículo quando aplicável; dispara notificação.
- schedule(requestId, window): atualiza janela; registra evento.
- markInTransit(requestId): status `in_transit` (para delivery com logística)
- markDelivered(requestId): status `delivered` e timeline “Veículo Entregue”.
- markPickedUp(requestId): status `delivered` e timeline “Veículo Retirado” (no caso pickup).
- proposeNewDate(requestId, newDate): reaproveita regra de reagendamento usada em coleta (controle de “proposed_by”, histórico e aprovação).

Repositórios (Ports)
- DeliveryRequestRepository: getById, create, updateStatus, setWindow, findPendingByClient, findByVehicleIds.
- VehicleRepository: getById, assertOwnership, isFinalized, setStatus.
- TimelineWriter: append(status, notes).
- NotificationPort: send(to, template, payload).

Infra
- Implementações Supabase: `SupabaseDeliveryRequestRepository`, `SupabaseVehicleRepository`, `SupabaseTimelineWriter`.
- Notificação: implementação inicial “no-op” + futura integração (email/Slack).

## Estados e Transições

- requested → scheduled (aceite admin; gera janela padrão via `PickupWindow`).
- scheduled → in_transit (opcional para delivery com logística).
- in_transit/scheduled → delivered (marcado pelo especialista: pickup realizado ou entregue).
- requested → rejected/canceled (quando aplicável).

Timeline sugerida
- “Entrega Solicitada” (delivery) ou “Retirada no Pátio Solicitada” (pickup).
- “Entrega Agendada” (delivery) — quando `scheduled`.
- “Saiu para Entrega” (delivery) — quando `in_transit`.
- “Veículo Entregue” (delivery) ou “Veículo Retirado” (pickup) — quando concluído.

## APIs (Handlers) — camadas finas delegando ao domínio

Cliente
- POST `/api/client/deliveries`
  - body: { vehicleId, desiredDate, method: 'delivery'|'pickup', addressId? }
  - caso de uso: `DeliveryService.createRequest`.

Admin
- POST `/api/admin/accept-vehicle-pickup-date`
  - body: { clientId, vehicleId }
  - caso de uso: `DeliveryService.approvePickup` (gera janela padrão e agenda).
- POST `/api/admin/propose-vehicle-pickup-date`
  - body: { requestId, proposedDate }
  - caso de uso: `DeliveryService.proposeNewDate` (reaproveita regra de reagendamento da coleta).
- GET `/api/admin/vehicles-awaiting-pickup?clientId=...`
  - consulta consolidada: `DeliveryRequestRepository.findPendingByClient(clientId, method='pickup')`.

Especialista
- PATCH `/api/specialist/deliveries/{requestId}`
  - body: { action: 'mark_delivered' | 'mark_in_transit' }
  - caso de uso: `DeliveryService.markPickedUp` (pickup) ou `markDelivered` (delivery).

Notificação (via domínio)
- `DeliveryService.approvePickup` → `NotificationPort.send(client, 'pickup_approved', { vehicle, date, window })`.

## Reuso do fluxo de mudança de data (módulo de coleta)

Regras/UX já existentes:
- Agrupamento por endereço, indicação de `proposed_by` (admin/client), aceitar/rejeitar proposta, feedback e recálculo.

Aplicação no subdomínio de entrega/retirada:
- Mesma UX para “propor nova data” de retirada/entrega.
- Mesma lógica de “proposed_by” e aceitação para consolidar a data final.
- Aproveitar componentes reutilizáveis (DatePickerBR, Modal, botões, mensagens).

## Correções pendentes (consolidadas)

1) DRY
- Mover `toWindowIso` para util do domínio; não duplicar em rotas.
- Centralizar escrita em `vehicle_history` via `TimelineWriter`.

2) SOLID / DDD
- Extrair `DeliveryService` e repositórios; rotas chamam apenas métodos do serviço.
- Substituir strings livres por enums/Value Objects (status, method, eventos de timeline).

3) UI/Estado
- Expor flag persistente “pickupPendingByVehicleId” na listagem do cliente (ou endpoint dedicado) para desabilitar o botão após reload.
- Garantir feedback ao cliente (MessageModal) após solicitar e após aceite (via notificação + badge/estado).

4) Notificação
- Implementar `NotificationPort` e versão básica (email/dev-log). Disparar no `approvePickup`.

## Plano de Implementação (incremental)

1. Domínio e Ports
- Criar `modules/delivery/domain`:
  - enums: `DeliveryMethod`, `DeliveryStatus`.
  - VO: `PickupWindow` + `makeWindowFromDate(desiredDate, startHour=9, endHour=18)`.
  - entidade: `DeliveryRequest` (somente tipos).
  - serviço: `DeliveryService`.
  - ports: `DeliveryRequestRepository`, `VehicleRepository`, `TimelineWriter`, `NotificationPort`.

2. Infra (Supabase)
- Implementar `SupabaseDeliveryRequestRepository` e `SupabaseVehicleRepository`.
- Adaptar `VehicleTimelineService` (ou criar `SupabaseTimelineWriter`) para escrita.
- Implementar `DevNotificationPort` (log) e esqueleto de Email/Slack.

3. Rotas
- Refatorar `/api/client/deliveries` e `/api/admin/accept-vehicle-pickup-date` para usar `DeliveryService`.
- Implementar `/api/admin/propose-vehicle-pickup-date` com reuso do fluxo de coleta.
- Criar `/api/specialist/deliveries/{requestId}` para `mark_delivered`/`mark_in_transit`.

4. UI
- Admin: manter `VehiclesAwaitingPickupSection` e modal de proposta; chamar rotas novas.
- Cliente: refletir “pickup pending” persistente e receber notificação.
- Especialista: ação para concluir retirada/entrega (tabela simples com filtro ou card na OS).

5. Testes
- Casos de uso de domínio unitários (approvePickup, proposeNewDate, markPickedUp/markDelivered).
- Integração básica de rotas (feliz + falhas).
- E2E leve: cliente solicita → admin aceita → especialista conclui; cliente notificado.

## Critérios de Aceite

- Cliente consegue solicitar entrega/retirada e ver o botão desabilitado após solicitar (inclusive após reload).
- Admin visualiza, aceita, e o cliente é notificado que a retirada foi aprovada (com data/janela).
- Especialista marca retirada como realizada; timeline reflete “Veículo Retirado” (pickup) ou “Veículo Entregue” (delivery).
- Reuso do fluxo de mudança de data da coleta para propostas de data de retirada/entrega.
- Código refatorado com serviço de domínio, repositórios e notificações via Port.

## Considerações de Segurança

- Autorização por perfil (client/admin/specialist) nas rotas.
- Validação de ownership do veículo pelo cliente.
- Sanitização/validação de inputs (UUIDs, datas ISO).

