import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:commercialization-vehicles-count');

async function getCommercializationVehiclesCountHandler(req: AuthenticatedRequest) {
  try {
    logger.info('getting_commercialization_vehicles_count', {
      user_id: req.user.id,
      user_role: req.user.role,
    });

    const supabase = SupabaseService.getInstance().getAdminClient();

    const { count, error } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('comercializacao', true);

    if (error) {
      logger.error('count_commercialization_vehicles_error', {
        error: error.message,
        code: error.code,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao contar veículos em comercialização' },
        { status: 500 }
      );
    }

    logger.info('commercialization_vehicles_count_success', { count: count || 0 });

    return NextResponse.json({ success: true, count: count || 0 });
  } catch (e) {
    const err = e as Error;
    logger.error('get_commercialization_vehicles_count_unexpected_error', {
      error: err?.message || String(e),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getCommercializationVehiclesCountHandler);
