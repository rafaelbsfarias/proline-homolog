import { VehicleRepository } from '@/modules/vehicles/infrastructure/VehicleRepository';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { checkSpecialistClientLink } from '@/modules/specialist/utils/authorization';

export async function GetVehicleInspection(
  vehicleId: string,
  context: { role: 'admin' | 'specialist' | 'client'; userId: string }
) {
  const record = await VehicleRepository.getById(vehicleId);
  if (!record) return null;

  if (context.role === 'client') {
    if (record.client_id !== context.userId) return null;
  } else if (context.role === 'specialist') {
    const supabase = SupabaseService.getInstance().getAdminClient();
    const auth = await checkSpecialistClientLink(supabase, context.userId, record.client_id);
    if (!auth.authorized) return null;
  }

  return VehicleRepository.getLatestInspection(vehicleId);
}
