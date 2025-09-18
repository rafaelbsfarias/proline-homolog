import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { authorizeSpecialistForVehicle } from '@/modules/specialist/utils/authorization';

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId') || '';
    if (!validateUUID(vehicleId))
      return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });

    // Authorization: ensure this specialist is linked to the client that owns the vehicle
    const authResult = await authorizeSpecialistForVehicle(req.user.id, vehicleId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

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

    const { data: media } = await supabase
      .from('inspection_media')
      .select('storage_path')
      .eq('inspection_id', inspection.id);

    const mediaPaths = media
      ? media.map((item: { storage_path: string }) => item.storage_path)
      : [];

    const inspectionWithMedia = { ...inspection, mediaPaths };

    return NextResponse.json({
      success: true,
      inspection: inspectionWithMedia,
      services: services || [],
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
