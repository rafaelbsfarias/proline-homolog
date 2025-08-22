import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError } from '@/lib/utils/errors';

async function getDashboardData(req: AuthenticatedRequest) {
  try {
    const partnerId = req.user.id;
    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase.rpc('get_partner_dashboard_data', {
      p_partner_id: partnerId,
    });

    if (error) {
      throw new DatabaseError('Falha ao buscar dados do dashboard.', error);
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withPartnerAuth(getDashboardData);
