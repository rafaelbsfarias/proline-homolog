import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { createVehicleActionHandler } from '@/modules/specialist/utils/apiUtils';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:specialist:start-analysis');

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase, req }) => {
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

  // Check if there's already an active (non-finalized) inspection
  const { data: existingInspection } = await supabase
    .from('inspections')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('finalized', false)
    .maybeSingle();

  // If no active inspection exists, create one
  if (!existingInspection) {
    const { data: inspection, error: inspectionErr } = await supabase
      .from('inspections')
      .insert({
        vehicle_id: vehicleId,
        specialist_id: req.user.id,
        finalized: false,
        inspection_date: new Date().toISOString().split('T')[0],
        odometer: 0, // Will be updated by specialist
        fuel_level: 'empty', // Will be updated by specialist
        observations: null,
      })
      .select('id')
      .single();

    if (inspectionErr || !inspection) {
      logger.error('Erro ao criar inspection:', {
        error: inspectionErr,
        vehicleId,
        userId: req.user.id,
      });
      return { json: { error: 'Erro ao criar registro de inspeção' }, status: 500 };
    }

    logger.info(`Inspection criada: ${inspection.id} para veículo ${vehicleId}`);
  } else {
    logger.info(`Inspection ativa já existe: ${existingInspection.id} para veículo ${vehicleId}`);
  }

  // Update vehicle status
  const { error: updErr } = await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.EM_ANALISE })
    .eq('id', vehicleId);

  if (updErr) {
    return { json: { error: 'Erro ao iniciar análise' }, status: 500 };
  }

  return { json: { success: true }, status: 200 };
});
