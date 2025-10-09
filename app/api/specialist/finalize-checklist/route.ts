import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { createVehicleActionHandler } from '@/modules/specialist/utils/apiUtils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:specialist:finalize-checklist');

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  // Get latest non-finalized inspection for this vehicle
  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, vehicle_id, specialist_id')
    .eq('vehicle_id', vehicleId)
    .eq('finalized', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inspection) {
    return { json: { error: 'Nenhuma análise em andamento' }, status: 404 };
  }

  // Mark as finalized with timestamp
  const { error: updErr } = await supabase
    .from('inspections')
    .update({
      finalized: true,
      finalized_at: new Date().toISOString(),
    })
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
