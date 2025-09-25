import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:quotes:approve');

export const POST = withAdminAuth(
  async (_req: AuthenticatedRequest, ctx: { params: Promise<{ quoteId: string }> }) => {
    try {
      const { quoteId } = await ctx.params;
      const admin = SupabaseService.getInstance().getAdminClient();

      // Load current status
      const { data: current, error: loadErr } = await admin
        .from('quotes')
        .select('id, status')
        .eq('id', quoteId)
        .maybeSingle();
      if (loadErr) {
        logger.error('failed_load_quote', { error: loadErr, quoteId });
        return NextResponse.json({ error: 'Erro ao carregar orçamento' }, { status: 500 });
      }
      if (!current)
        return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });

      if (current.status !== 'pending_admin_approval') {
        return NextResponse.json(
          { error: 'Aprovação indisponível para o status atual' },
          { status: 400 }
        );
      }

      const { error: updErr } = await admin
        .from('quotes')
        .update({ status: 'pending_client_approval', updated_at: new Date().toISOString() })
        .eq('id', quoteId);
      if (updErr) {
        logger.error('failed_update_status', { error: updErr, quoteId });
        return NextResponse.json({ error: 'Erro ao aprovar orçamento' }, { status: 500 });
      }

      return NextResponse.json({ success: true, newStatus: 'pending_client_approval' });
    } catch (error) {
      logger.error('approve_error', { error });
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }
);
