import type { ISODate, ISODateTime, UUID, DeliveryRequest } from './types';

export interface DeliveryRequestRepository {
  findLatestPickupRequested(clientId: UUID, vehicleId: UUID): Promise<DeliveryRequest | null>;
  findLatestPickupForClientVehicle(
    clientId: UUID,
    vehicleId: UUID
  ): Promise<DeliveryRequest | null>;
  schedulePickup(
    requestId: UUID,
    windowStart: ISODateTime,
    windowEnd: ISODateTime
  ): Promise<{ id: UUID; vehicle_id: UUID } | null>;
  updateStatus(requestId: UUID, nextStatus: string): Promise<{ vehicle_id: UUID } | null>;
  getById(requestId: UUID): Promise<DeliveryRequest | null>;
  addEvent(params: {
    requestId: UUID;
    eventType: string;
    statusFrom: string | null;
    statusTo: string;
    actorId: UUID;
    actorRole: 'admin' | 'client' | 'specialist' | 'partner' | 'system';
    notes?: string | null;
  }): Promise<void>;
  proposePickupDate(requestId: UUID, newDateIso: ISODate, actorId: UUID): Promise<void>;
}

export interface VehicleRepository {
  setStatus(vehicleId: UUID, status: string): Promise<void>;
}

export interface TimelineWriter {
  append(vehicleId: UUID, status: string, notes?: string | null): Promise<void>;
}

export interface NotificationPort {
  send(toProfileId: UUID, template: string, payload: Record<string, unknown>): Promise<void>;
}
