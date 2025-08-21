import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { createVehicleActionHandler } from '@/modules/specialist/utils/apiUtils';

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  // Get latest non-finalized inspection for this vehicle
  const { data: inspection } = await supabase
    .from('inspections')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('finalized', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inspection) {
    return { json: { error: 'Nenhuma análise em andamento' }, status: 404 };
  }

  // Mark as finalized
  const { error: updErr } = await supabase
    .from('inspections')
    .update({ finalized: true })
    .eq('id', inspection.id);

  if (updErr) {
    return { json: { error: 'Erro ao finalizar análise' }, status: 500 };
  }

  // Update vehicle status
  await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.ANALISE_FINALIZADA })
    .eq('id', vehicleId);

  return { json: { success: true }, status: 200 };
});
