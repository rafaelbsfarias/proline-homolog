import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeliveryRequestRepository } from '@/modules/delivery/domain/ports';
import type { DeliveryRequest, UUID } from '@/modules/delivery/domain/types';
import { DeliveryStatus } from '@/modules/delivery/domain/types';

export class SupabaseDeliveryRequestRepository implements DeliveryRequestRepository {
  constructor(private readonly admin: SupabaseClient) {}

  async findLatestPickupRequested(clientId: UUID, vehicleId: UUID) {
    const { data, error } = await this.admin
      .from('delivery_requests')
      .select(
        'id, vehicle_id, client_id, service_order_id, address_id, status, desired_date, window_start, window_end, scheduled_at, created_by, fee_amount'
      )
      .eq('client_id', clientId)
      .eq('vehicle_id', vehicleId)
      .is('address_id', null)
      .eq('status', DeliveryStatus.Requested)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as DeliveryRequest) || null;
  }

  async findLatestPickupForClientVehicle(clientId: UUID, vehicleId: UUID) {
    const { data, error } = await this.admin
      .from('delivery_requests')
      .select(
        'id, vehicle_id, client_id, service_order_id, address_id, status, desired_date, window_start, window_end, scheduled_at, created_by, fee_amount'
      )
      .eq('client_id', clientId)
      .eq('vehicle_id', vehicleId)
      .is('address_id', null)
      .in('status', [DeliveryStatus.Requested, DeliveryStatus.Scheduled])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as DeliveryRequest) || null;
  }

  async schedulePickup(requestId: UUID, windowStart: string, windowEnd: string) {
    const { data, error } = await this.admin
      .from('delivery_requests')
      .update({
        status: DeliveryStatus.Scheduled,
        window_start: windowStart,
        window_end: windowEnd,
        scheduled_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('id, vehicle_id')
      .single();

    if (error) throw error;
    return data as { id: UUID; vehicle_id: UUID };
  }

  async updateStatus(requestId: UUID, nextStatus: string) {
    const { data, error } = await this.admin
      .from('delivery_requests')
      .update({ status: nextStatus })
      .eq('id', requestId)
      .select('vehicle_id')
      .single();
    if (error) throw error;
    return data as { vehicle_id: UUID };
  }

  async getById(requestId: UUID) {
    const { data, error } = await this.admin
      .from('delivery_requests')
      .select(
        'id, vehicle_id, client_id, service_order_id, address_id, status, desired_date, window_start, window_end, scheduled_at, created_by, fee_amount'
      )
      .eq('id', requestId)
      .single();
    if (error) throw error;
    return data as unknown as DeliveryRequest;
  }

  async addEvent(params: {
    requestId: UUID;
    eventType: string;
    statusFrom: string | null;
    statusTo: string;
    actorId: UUID;
    actorRole: 'admin' | 'client' | 'specialist';
    notes?: string | null;
  }) {
    const { error } = await this.admin.from('delivery_request_events').insert({
      request_id: params.requestId,
      event_type: params.eventType,
      status_from: params.statusFrom,
      status_to: params.statusTo,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      notes: params.notes ?? null,
    });

    if (error) throw error;
  }

  async proposePickupDate(requestId: UUID, newDateIso: string, actorId: UUID) {
    // Atualiza desired_date e troca created_by para refletir "proposedBy" sem migração de schema
    const { data, error } = await this.admin
      .from('delivery_requests')
      .update({ desired_date: newDateIso, created_by: actorId, status: DeliveryStatus.Requested })
      .eq('id', requestId)
      .select('status')
      .single();
    if (error) throw error;
  }
}
