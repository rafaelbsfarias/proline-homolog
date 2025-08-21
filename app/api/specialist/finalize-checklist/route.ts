import { NextResponse } from 'next/server';
import { withSpecialistAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';

export const POST = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const vehicleId = String(body?.vehicleId || '');
    if (!validateUUID(vehicleId)) return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Authorization: ensure this specialist is linked to the client's vehicle
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('id, client_id')
      .eq('id', vehicleId)
      .maybeSingle();
    if (vehErr) return NextResponse.json({ error: 'Erro ao carregar veículo' }, { status: 500 });
    if (!veh) return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    const { data: link, error: linkErr } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('client_id', veh.client_id)
      .eq('specialist_id', req.user.id)
      .maybeSingle();
    if (linkErr) return NextResponse.json({ error: 'Erro de autorização' }, { status: 500 });
    if (!link) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    // Get latest non-finalized inspection for this vehicle
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('finalized', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!inspection) return NextResponse.json({ error: 'Nenhuma análise em andamento' }, { status: 404 });

    // Mark as finalized
    const { error: updErr } = await supabase
      .from('inspections')
      .update({ finalized: true })
      .eq('id', inspection.id);
    if (updErr) return NextResponse.json({ error: 'Erro ao finalizar análise' }, { status: 500 });

    // Update vehicle status
    await supabase
      .from('vehicles')
      .update({ status: 'Análise Finalizada' })
      .eq('id', vehicleId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
