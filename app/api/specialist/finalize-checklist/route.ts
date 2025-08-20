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

