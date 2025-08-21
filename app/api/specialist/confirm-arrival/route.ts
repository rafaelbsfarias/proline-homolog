import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { createVehicleActionHandler } from '@/modules/specialist/utils/apiUtils';

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  const { data: veh, error: vehErr } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicleId)
    .single();

  if (vehErr || !veh) {
    return { json: { error: 'Erro ao recarregar dados do veículo' }, status: 500 };
  }

  const allowedPrevious: string[] = [
    VehicleStatus.AGUARDANDO_COLETA,
    VehicleStatus.AGUARDANDO_CHEGADA,
  ];
  const currentStatus = String(veh.status || '').toUpperCase();
  if (!allowedPrevious.includes(currentStatus)) {
    return {
      json: {
        error: `Chegada só pode ser confirmada se o veículo estiver ${VehicleStatus.AGUARDANDO_COLETA} ou ${VehicleStatus.AGUARDANDO_CHEGADA}`,
      },
      status: 400,
    };
  }

  const { error: updErr } = await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.CHEGADA_CONFIRMADA })
    .eq('id', vehicleId);

  if (updErr) {
    return { json: { error: 'Erro ao confirmar chegada' }, status: 500 };
  }

  return { json: { success: true }, status: 200 };
});
