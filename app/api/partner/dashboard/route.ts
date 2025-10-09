import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError } from '@/lib/utils/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:dashboard');

async function getDashboardData(req: AuthenticatedRequest) {
  try {
    const partnerId = req.user.id;

    logger.info('🔍 Buscando dados do dashboard para partner', {
      partnerId,
      userEmail: req.user.email,
    });

    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase.rpc('get_partner_dashboard_data', {
      p_partner_id: partnerId,
    });

    if (error) {
      logger.error('❌ Erro na função RPC:', { error });
      throw new DatabaseError(`Falha ao buscar dados do dashboard: ${error.message}`);
    }

    logger.info('✅ Dados do dashboard obtidos com sucesso', {
      pendingQuotesCount: data?.pending_quotes?.count || 0,
      budgetCountersTotal: data?.budget_counters?.total || 0,
      hasData: !!data,
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('💥 Erro interno na API dashboard:', { error });
    return handleApiError(error);
  }
}

export const GET = withPartnerAuth(getDashboardData);
