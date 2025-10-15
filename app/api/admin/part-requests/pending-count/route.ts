import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:part-requests:pending-count');

async function getPendingPartRequestsCountHandler(req: AuthenticatedRequest) {
  try {
    logger.info('getting_pending_part_requests_count', {
      user_id: req.user.id,
      user_role: req.user.role,
    });

    const supabase = createApiClient();

    // Contar part requests pendentes (status diferente de 'approved' e 'rejected')
    const { count, error } = await supabase
      .from('part_requests')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'approved')
      .neq('status', 'rejected');

    if (error) {
      logger.error('count_part_requests_error', {
        error: error.message,
        code: error.code,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao contar solicitações de peças' },
        { status: 500 }
      );
    }

    logger.info('pending_part_requests_count_success', {
      count: count || 0,
    });

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (e) {
    const error = e as Error;
    logger.error('get_pending_part_requests_count_unexpected_error', {
      error: error.message || String(e),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getPendingPartRequestsCountHandler);
