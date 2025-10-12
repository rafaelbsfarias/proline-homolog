import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { authorizeClientForVehicle } from '@/modules/client/utils/authorization';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:vehicle-inspection');

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId') || '';

    if (!validateUUID(vehicleId)) {
      return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });
    }

    // Authorization: ensure this client owns the vehicle
    const authResult = await authorizeClientForVehicle(req.user.id, vehicleId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Find latest inspection for vehicle (can be finalized or not)
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, inspection_date, odometer, fuel_level, observations, finalized')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!inspection) {
      return NextResponse.json({ success: true, inspection: null, services: [], media: [] });
    }

    // Get services for the inspection
    const { data: services } = await supabase
      .from('inspection_services')
      .select('category, required, notes')
      .eq('inspection_id', inspection.id);

    // Get media for the inspection (somente especialista)
    let media: { storage_path: string; uploaded_by: string; created_at: string }[] | null = null;
    const { data: mediaWithRole, error: mediaRoleError } = await supabase
      .from('inspection_media')
      .select('storage_path, uploaded_by, created_at, profiles!inner(role)')
      .eq('inspection_id', inspection.id)
      .eq('profiles.role', 'specialist')
      .order('created_at', { ascending: false });
    if (mediaRoleError) {
      const { data: fallback } = await supabase
        .from('inspection_media')
        .select('storage_path, uploaded_by, created_at')
        .eq('inspection_id', inspection.id)
        .order('created_at', { ascending: false });
      media = fallback as any;
    } else {
      media = (mediaWithRole || []).map(m => ({
        storage_path: (m as any).storage_path,
        uploaded_by: (m as any).uploaded_by,
        created_at: (m as any).created_at,
      }));
    }

    return NextResponse.json({
      success: true,
      inspection: {
        ...inspection,
        services: services || [],
        media: media || [],
      },
    });
  } catch (error) {
    logger.error('Error fetching vehicle inspection:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
