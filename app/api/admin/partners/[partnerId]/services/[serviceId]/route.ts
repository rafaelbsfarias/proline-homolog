import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:partner:service:update');

export const PATCH = withAdminAuth(
  async (
    req: AuthenticatedRequest,
    ctx: { params: Promise<{ partnerId: string; serviceId: string }> }
  ) => {
    try {
      const { partnerId, serviceId } = await ctx.params;
      const body = (await req.json()) as { is_active?: boolean };
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ error: 'Campo is_active é obrigatório' }, { status: 400 });
      }

      const admin = SupabaseService.getInstance().getAdminClient();
      const { error } = await admin
        .from('partner_services')
        .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
        .eq('id', serviceId)
        .eq('partner_id', partnerId);

      if (error) {
        logger.error('failed_update_service', {
          error,
          partnerId,
          serviceId,
          is_active: body.is_active,
        });
        return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('service_update_error', { error });
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }
);
