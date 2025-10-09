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

      // Load current status and service_order_id
      const { data: current, error: loadErr } = await admin
        .from('quotes')
        .select('id, status, service_order_id')
        .eq('id', quoteId)
        .maybeSingle();
      if (loadErr) {
        logger.error('failed_load_quote', { error: loadErr, quoteId });
        return NextResponse.json({ error: 'Erro ao carregar orçamento' }, { status: 500 });
      }
      if (!current)
        return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });

      const validStatuses = ['pending_admin_approval', 'admin_review'];
      if (!validStatuses.includes(current.status)) {
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

      // Atualizar status do veículo e criar entrada no histórico
      try {
        const { data: serviceOrder } = await admin
          .from('service_orders')
          .select('vehicle_id')
          .eq('id', current.service_order_id)
          .single();

        if (serviceOrder?.vehicle_id) {
          // Atualizar status do veículo
          await admin
            .from('vehicles')
            .update({ status: 'Fase Orçamentaria' })
            .eq('id', serviceOrder.vehicle_id);

          // Criar entrada no vehicle_history
          await admin.from('vehicle_history').insert({
            vehicle_id: serviceOrder.vehicle_id,
            status: 'Orçamento Aprovado pelo Administrador',
            notes: 'Aprovação integral via rota simplificada',
          });

          logger.info('vehicle_status_updated_after_approval', {
            vehicleId: serviceOrder.vehicle_id,
            quoteId,
          });
        }
      } catch (historyError) {
        logger.warn('failed_to_update_vehicle_status_or_history', {
          error: historyError,
          quoteId,
        });
        // Não falhar a requisição principal
      }

      return NextResponse.json({ success: true, newStatus: 'pending_client_approval' });
    } catch (error) {
      logger.error('approve_error', { error });
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }
);
