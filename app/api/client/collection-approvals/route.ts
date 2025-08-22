import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:collection-approvals');

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const clientId = req.user.id;
    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase.rpc('get_collections_for_approval', {
      p_client_id: clientId,
    });

    if (error) {
      logger.error('rpc_error', { error: error.message });
      return NextResponse.json({ success: false, error: 'Erro ao buscar coletas para aprovação' }, { status: 500 });
    }

    return NextResponse.json({ success: true, collections: data || [] });

  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
});
