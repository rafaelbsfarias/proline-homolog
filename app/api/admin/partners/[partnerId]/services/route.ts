import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:partner:services');

export const GET = withAdminAuth(
  async (_req: AuthenticatedRequest, ctx: { params: Promise<{ partnerId: string }> }) => {
    try {
      const { partnerId } = await ctx.params;
      const admin = SupabaseService.getInstance().getAdminClient();

      const { data, error } = await admin
        .from('partner_services')
        .select(
          'id, name, description, price, is_active, review_status, review_feedback, review_requested_at, created_at'
        )
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('failed_list_services', { error, partnerId });
        return NextResponse.json({ error: 'Erro ao buscar serviços do parceiro' }, { status: 500 });
      }

      return NextResponse.json({ services: data || [] });
    } catch (error) {
      logger.error('services_list_error', { error });
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }
);
