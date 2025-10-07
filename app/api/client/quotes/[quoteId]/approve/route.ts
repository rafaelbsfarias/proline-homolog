import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:quotes:approve');

export const POST = withClientAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ quoteId: string }> }) => {
    try {
      const { quoteId } = await context.params;
      const clientId = req.user?.user_metadata?.profile_id;

      if (!clientId) {
        logger.error('client_id_not_found');
        return NextResponse.json({ error: 'ID do cliente não encontrado' }, { status: 400 });
      }

      if (!quoteId) {
        return NextResponse.json({ error: 'ID do orçamento não fornecido' }, { status: 400 });
      }

      const admin = SupabaseService.getInstance().getAdminClient();

      // Verificar se o orçamento pertence ao cliente e está pendente
      const { data: quote, error: quoteErr } = await admin
        .from('quotes')
        .select(
          `
        id,
        status,
        service_order_id,
        service_orders (
          vehicle_id,
          vehicles (
            client_id
          )
        )
      `
        )
        .eq('id', quoteId)
        .single();

      if (quoteErr || !quote) {
        logger.error('quote_not_found', { quoteId, error: quoteErr });
        return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
      }

      // Validar propriedade
      const serviceOrder = Array.isArray(quote.service_orders)
        ? quote.service_orders[0]
        : quote.service_orders;

      const vehicle = serviceOrder?.vehicles;

      if (vehicle?.client_id !== clientId) {
        logger.warn('unauthorized_access_attempt', { quoteId, clientId });
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      // Validar status
      if (quote.status !== 'pending_client_approval') {
        logger.warn('invalid_status', { quoteId, status: quote.status });
        return NextResponse.json(
          { error: 'Orçamento não está pendente de aprovação do cliente' },
          { status: 400 }
        );
      }

      // Atualizar status para approved
      const { error: updateErr } = await admin
        .from('quotes')
        .update({
          status: 'approved',
          client_approved_at: new Date().toISOString(),
          client_approved_by: clientId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

      if (updateErr) {
        logger.error('failed_update_quote', { error: updateErr });
        return NextResponse.json({ error: 'Erro ao aprovar orçamento' }, { status: 500 });
      }

      logger.info('quote_approved_by_client', { quoteId, clientId });

      return NextResponse.json({ success: true, message: 'Orçamento aprovado com sucesso' });
    } catch (error) {
      logger.error('unexpected_error', { error });
      return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
    }
  }
);
