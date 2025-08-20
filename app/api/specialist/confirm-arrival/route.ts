import { NextResponse } from 'next/server';
import { withSpecialistAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';

export const POST = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const vehicleId = (body?.vehicleId as string) || '';
    if (!validateUUID(vehicleId)) {
      return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Fetch vehicle and check ownership
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('id, client_id')
      .eq('id', vehicleId)
      .maybeSingle();
    if (vehErr) {
      return NextResponse.json({ error: 'Erro ao carregar veículo' }, { status: 500 });
    }
    if (!veh) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    // Check specialist linkage to client
    const { data: link, error: linkErr } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('client_id', veh.client_id)
      .eq('specialist_id', req.user.id)
      .maybeSingle();
    if (linkErr) {
      return NextResponse.json({ error: 'Erro de autorização' }, { status: 500 });
    }
    if (!link) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Update vehicle status
    const { error: updErr } = await supabase
      .from('vehicles')
      .update({ status: 'Chegada confirmada' })
      .eq('id', vehicleId);
    if (updErr) {
      return NextResponse.json({ error: 'Erro ao confirmar chegada' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

