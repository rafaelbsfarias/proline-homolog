import { NextResponse } from 'next/server';
import { withSpecialistAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId') || '';
    if (!validateUUID(vehicleId)) return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });

    const supabase = SupabaseService.getInstance().getAdminClient();
    // Authorization: ensure this specialist is linked to the client that owns the vehicle
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('id, client_id')
      .eq('id', vehicleId)
      .maybeSingle();
    if (vehErr) return NextResponse.json({ error: 'Erro ao buscar veículo' }, { status: 500 });
    if (!veh) return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    const { data: link, error: linkErr } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('client_id', veh.client_id)
      .eq('specialist_id', req.user.id)
      .maybeSingle();
    if (linkErr) return NextResponse.json({ error: 'Erro de autorização' }, { status: 500 });
    if (!link) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    // Find latest non-finalized inspection for vehicle
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, inspection_date, odometer, fuel_level, observations, finalized')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!inspection) return NextResponse.json({ success: true, inspection: null, services: [] });

    const { data: services } = await supabase
      .from('inspection_services')
      .select('category, required, notes')
      .eq('inspection_id', inspection.id);

    return NextResponse.json({ success: true, inspection, services: services || [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
