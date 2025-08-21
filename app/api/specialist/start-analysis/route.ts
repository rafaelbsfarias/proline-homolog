import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { authorizeSpecialistForVehicle } from '@/modules/specialist/utils/authorization';

export const POST = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const vehicleId = String(body?.vehicleId || '');
    if (!validateUUID(vehicleId))
      return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });

    // Authorization: ensure this specialist is linked to the client's vehicle
    const authResult = await authorizeSpecialistForVehicle(req.user.id, vehicleId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Fetch vehicle to check current status
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (vehErr || !veh) {
      return NextResponse.json({ error: 'Erro ao carregar dados do veículo' }, { status: 500 });
    }

    const current = String(veh.status || '').toUpperCase();
    const allowedPrev =
      current === VehicleStatus.CHEGADA_CONFIRMADA || current === VehicleStatus.EM_ANALISE;
    if (!allowedPrev) {
      return NextResponse.json(
        { error: 'Início de análise permitido apenas após Chegada Confirmada' },
        { status: 400 }
      );
    }

    // Set status to EM ANÁLISE
    const { error: updErr } = await supabase
      .from('vehicles')
      .update({ status: VehicleStatus.EM_ANALISE })
      .eq('id', vehicleId);
    if (updErr) return NextResponse.json({ error: 'Erro ao iniciar análise' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
