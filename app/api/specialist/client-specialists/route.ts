import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { GetClientSpecialistsForClient } from '@/modules/vehicles/application/GetClientSpecialistsForClient';
import { checkSpecialistClientLink } from '@/modules/specialist/utils/authorization';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:specialist:client-specialists');

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || '';
    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();
    const authResult = await checkSpecialistClientLink(supabase, req.user.id, clientId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const data = await GetClientSpecialistsForClient(clientId);
    logger.info('success', { specialist: req.user.id.slice(0, 8), clientId: clientId.slice(0, 8) });
    return NextResponse.json({ success: true, ...data });
  } catch (e: any) {
    logger.error('error', e?.message || e);
    return NextResponse.json({ error: 'Erro ao buscar especialistas' }, { status: 500 });
  }
});
