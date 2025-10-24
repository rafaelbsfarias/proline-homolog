import type {
  DeliveryRequestRepository,
  VehicleRepository,
  TimelineWriter,
  NotificationPort,
} from './ports';
import { DeliveryStatus, type UUID, makeWindowFromDate } from './types';

export class DeliveryService {
  constructor(
    private readonly requests: DeliveryRequestRepository,
    private readonly vehicles: VehicleRepository,
    private readonly timeline: TimelineWriter,
    private readonly notify: NotificationPort
  ) {}

  /**
   * Aprova/agenda uma retirada (pickup) para um cliente/veículo, gerando janela padrão e
   * atualizando status do veículo. Notifica o cliente.
   */
  async approvePickup(params: {
    clientId: UUID;
    vehicleId: UUID;
    actorId: UUID; // admin id
  }): Promise<{ requestId: UUID }> {
    const { clientId, vehicleId, actorId } = params;

    const req = await this.requests.findLatestPickupRequested(clientId, vehicleId);
    if (!req) {
      throw new Error('Solicitação de retirada não encontrada');
    }
    const desiredDate = (req.desired_date || '').toString().slice(0, 10);
    if (!desiredDate) {
      throw new Error('Solicitação sem data desejada para retirada');
    }

    const window = makeWindowFromDate(desiredDate);

    const updated = await this.requests.schedulePickup(req.id, window.start, window.end);
    if (!updated) {
      throw new Error('Falha ao agendar retirada');
    }

    await this.requests.addEvent({
      requestId: req.id,
      eventType: 'scheduled',
      statusFrom: req.status,
      statusTo: DeliveryStatus.Scheduled,
      actorId,
      actorRole: 'admin',
      notes: null,
    });

    // Atualiza status do veículo em casos de pickup (address_id null)
    await this.vehicles.setStatus(updated.vehicle_id, 'Finalizado: Aguardando Retirada');

    // Não escrever manualmente na timeline para pickup (mantém comportamento atual)
    // Notificar cliente sobre aceite/agendamento
    await this.notify.send(clientId, 'pickup_approved', {
      vehicleId,
      requestId: updated.id,
      windowStart: window.start,
      windowEnd: window.end,
    });

    return { requestId: req.id };
  }

  async approvePickupByRequestId(params: {
    requestId: UUID;
    actorId: UUID;
  }): Promise<{ requestId: UUID }> {
    const { requestId, actorId } = params;
    const req = await this.requests.getById(requestId);
    if (!req) throw new Error('Solicitação de retirada não encontrada');
    if (req.address_id) throw new Error('Pedido não é de retirada no pátio');

    const desiredDate = (req.desired_date || '').toString().slice(0, 10);
    if (!desiredDate) throw new Error('Solicitação sem data desejada para retirada');

    const window = makeWindowFromDate(desiredDate);
    const updated = await this.requests.schedulePickup(req.id, window.start, window.end);
    if (!updated) throw new Error('Falha ao agendar retirada');

    await this.requests.addEvent({
      requestId: req.id,
      eventType: 'scheduled',
      statusFrom: req.status,
      statusTo: DeliveryStatus.Scheduled,
      actorId,
      actorRole: 'admin',
      notes: null,
    });

    await this.vehicles.setStatus(updated.vehicle_id, 'Finalizado: Aguardando Retirada');

    await this.notify.send(req.client_id, 'pickup_approved', {
      vehicleId: updated.vehicle_id,
      requestId: updated.id,
      windowStart: window.start,
      windowEnd: window.end,
    });

    return { requestId: req.id };
  }

  async approveDeliveryByRequestId(params: {
    requestId: UUID;
    actorId: UUID;
  }): Promise<{ requestId: UUID }> {
    const { requestId, actorId } = params;
    const req = await this.requests.getById(requestId);
    if (!req) throw new Error('Solicitação de entrega não encontrada');
    if (!req.address_id) throw new Error('Pedido não é de entrega em endereço');
    if (!req.fee_amount || req.fee_amount <= 0) {
      throw new Error('Valor da entrega deve ser definido antes de aprovar');
    }

    const desiredDate = (req.desired_date || '').toString().slice(0, 10);
    if (!desiredDate) throw new Error('Solicitação sem data desejada para entrega');

    // Atualizar status para 'approved' - aguardando aprovação do cliente
    await this.requests.updateStatus(requestId, DeliveryStatus.Approved);

    await this.requests.addEvent({
      requestId: req.id,
      eventType: 'approved',
      statusFrom: req.status,
      statusTo: DeliveryStatus.Approved,
      actorId,
      actorRole: 'admin',
      notes: `Data: ${desiredDate}, Valor: R$ ${req.fee_amount}`,
    });

    await this.vehicles.setStatus(req.vehicle_id, 'Finalizado: Aguardando Aprovação de Entrega');

    await this.notify.send(req.client_id, 'delivery_pending_approval', {
      vehicleId: req.vehicle_id,
      requestId: req.id,
      deliveryDate: desiredDate,
      deliveryFee: req.fee_amount,
    });

    return { requestId: req.id };
  }

  async markInTransit(params: { requestId: UUID; actorId: UUID }): Promise<void> {
    const { requestId, actorId } = params;
    const req = await this.requests.getById(requestId);
    if (!req) throw new Error('Pedido não encontrado');

    // Apenas faz sentido para delivery com address_id
    if (!req.address_id) return; // pickup: ignorar transição in_transit

    await this.requests.updateStatus(requestId, DeliveryStatus.InTransit);
    await this.requests.addEvent({
      requestId,
      eventType: 'in_transit',
      statusFrom: req.status,
      statusTo: DeliveryStatus.InTransit,
      actorId,
      actorRole: 'partner',
      notes: null,
    });

    await this.timeline.append(req.vehicle_id, 'Saiu para Entrega', null);
  }

  async markDelivered(params: { requestId: UUID; actorId: UUID }): Promise<void> {
    const { requestId, actorId } = params;
    const req = await this.requests.getById(requestId);
    if (!req) throw new Error('Pedido não encontrado');

    await this.requests.updateStatus(requestId, DeliveryStatus.Delivered);
    await this.requests.addEvent({
      requestId,
      eventType: 'delivered',
      statusFrom: req.status,
      statusTo: DeliveryStatus.Delivered,
      actorId,
      actorRole: 'partner',
      notes: null,
    });

    const status = req.address_id ? 'Entregue ao Cliente' : 'Veículo Retirado';
    await this.timeline.append(req.vehicle_id, status, null);
    await this.vehicles.setStatus(req.vehicle_id, status);
  }

  async proposePickupNewDate(params: {
    clientId: UUID;
    vehicleId: UUID;
    proposedDate: string; // ISODate YYYY-MM-DD
    actorId: UUID; // admin id
  }): Promise<{ requestId: UUID }> {
    const { clientId, vehicleId, proposedDate, actorId } = params;
    const req = await this.requests.findLatestPickupForClientVehicle(clientId, vehicleId);
    if (!req) throw new Error('Solicitação de retirada não encontrada');

    const prev = req.desired_date || null;
    await this.requests.proposePickupDate(req.id, proposedDate, actorId);
    await this.requests.addEvent({
      requestId: req.id,
      eventType: 'reschedule_proposed',
      statusFrom: req.status,
      statusTo: DeliveryStatus.Requested,
      actorId,
      actorRole: 'admin',
      notes: prev ? `Data anterior: ${prev}` : null,
    });
    return { requestId: req.id };
  }
}
