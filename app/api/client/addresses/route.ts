import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:addresses');

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('missing-user-id');
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();
    const { data, error } = await admin
      .from('addresses')
      .select(
        'id, profile_id, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address, created_at'
      )
      .eq('profile_id', userId)
      .order('is_main_address', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('list-error', { userId: userId.slice(0, 8), error: error.message });
      return NextResponse.json({ success: false, error: 'Erro ao buscar endereços' }, { status: 500 });
    }

    return NextResponse.json({ success: true, addresses: data ?? [] });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
});

