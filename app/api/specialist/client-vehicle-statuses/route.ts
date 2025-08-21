import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { checkSpecialistClientLink } from '@/modules/specialist/utils/authorization';

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || '';

    if (!validateUUID(clientId)) {
      return NextResponse.json({ error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Authorization: ensure this specialist is linked to the client
    const authResult = await checkSpecialistClientLink(supabase, req.user.id, clientId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Fetch distinct statuses for vehicles of this client
    const { data, error } = (await supabase.from('vehicles').select('status')) as {
      data: { status: string }[] | null;
      error: any;
    };

    if (error) {
      console.error('Error fetching distinct statuses:', error);
      return NextResponse.json({ error: 'Erro ao buscar status de veículos' }, { status: 500 });
    }

    const statuses = (data || []).map(row => String(row.status).toLowerCase());

    return NextResponse.json({ success: true, statuses });
  } catch (e) {
    console.error('GET client-vehicle-statuses error:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
