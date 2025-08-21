import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { createVehicleActionHandler } from '@/modules/specialist/utils/apiUtils';

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  const { data: veh, error: vehErr } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicleId)
    .single();

  if (vehErr || !veh) {
    return { json: { error: 'Erro ao carregar dados do veículo' }, status: 500 };
  }

  const current = String(veh.status || '').toUpperCase();
  const allowedPrev =
    current === VehicleStatus.CHEGADA_CONFIRMADA || current === VehicleStatus.EM_ANALISE;
  if (!allowedPrev) {
    return {
      json: { error: 'Início de análise permitido apenas após Chegada Confirmada' },
      status: 400,
    };
  }

  const { error: updErr } = await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.EM_ANALISE })
    .eq('id', vehicleId);

  if (updErr) {
    return { json: { error: 'Erro ao iniciar análise' }, status: 500 };
  }

  return { json: { success: true }, status: 200 };
});
