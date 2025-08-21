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
    const vehicleId = (body?.vehicleId as string) || '';
    if (!validateUUID(vehicleId)) {
      return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });
    }

    // Authorization: ensure this specialist is linked to the client
    const authResult = await authorizeSpecialistForVehicle(req.user.id, vehicleId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Fetch vehicle to check current status (already fetched in auth, but need status)
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (vehErr || !veh) {
      return NextResponse.json({ error: 'Erro ao recarregar dados do veículo' }, { status: 500 });
    }

    // Validate current status before confirming arrival
    const allowedPrevious: string[] = [
      VehicleStatus.AGUARDANDO_COLETA,
      VehicleStatus.AGUARDANDO_CHEGADA,
    ];
    const currentStatus = String(veh.status || '').toUpperCase();
    if (!allowedPrevious.includes(currentStatus)) {
      return NextResponse.json(
        {
          error: `Chegada só pode ser confirmada se o veículo estiver ${VehicleStatus.AGUARDANDO_COLETA} ou ${VehicleStatus.AGUARDANDO_CHEGADA}`,
        },
        { status: 400 }
      );
    }

    // Update vehicle status
    const { error: updErr } = await supabase
      .from('vehicles')
      .update({ status: VehicleStatus.CHEGADA_CONFIRMADA })
      .eq('id', vehicleId);
    if (updErr) {
      return NextResponse.json({ error: 'Erro ao confirmar chegada' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
