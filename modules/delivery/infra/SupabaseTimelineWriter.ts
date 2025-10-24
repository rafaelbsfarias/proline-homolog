import type { SupabaseClient } from '@supabase/supabase-js';
import type { TimelineWriter } from '@/modules/delivery/domain/ports';
import type { UUID } from '@/modules/delivery/domain/types';

export class SupabaseTimelineWriter implements TimelineWriter {
  constructor(private readonly admin: SupabaseClient) {}

  async append(vehicleId: UUID, status: string, notes?: string | null) {
    const { error } = await this.admin.from('vehicle_history').insert({
      vehicle_id: vehicleId,
      status,
      partner_service: null,
      notes: notes ?? null,
    });
    if (error) throw error;
  }
}
