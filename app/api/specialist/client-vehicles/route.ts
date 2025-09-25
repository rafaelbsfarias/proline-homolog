import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { checkSpecialistClientLink } from '@/modules/specialist/utils/authorization';

const DEFAULT_PAGE_SIZE = 10;

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || `${DEFAULT_PAGE_SIZE}`, 10);
    const plateFilter = url.searchParams.get('plate') || '';
    const statusFilter = url.searchParams.get('status') || '';

    if (!validateUUID(clientId)) {
      return NextResponse.json({ error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Authorization: ensure this specialist is linked to the client
    const authResult = await checkSpecialistClientLink(supabase, req.user.id, clientId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { data, error } = await supabase.from('vehicles').select('*').eq('client_id', clientId);

    if (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, vehicles: data });
  } catch (e) {
    console.error('GET client-vehicles error:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
