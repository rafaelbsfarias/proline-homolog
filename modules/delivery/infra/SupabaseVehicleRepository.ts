import type { SupabaseClient } from '@supabase/supabase-js';
import type { VehicleRepository } from '@/modules/delivery/domain/ports';
import type { UUID } from '@/modules/delivery/domain/types';

export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(private readonly admin: SupabaseClient) {}

  async setStatus(vehicleId: UUID, status: string) {
    const { error } = await this.admin.from('vehicles').update({ status }).eq('id', vehicleId);
    if (error) throw error;
  }
}
