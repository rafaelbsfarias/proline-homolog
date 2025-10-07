import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:quotes:details');

export const GET = withClientAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ quoteId: string }> }) => {
    try {
      const { quoteId } = await context.params;
      const clientId = req.user.id;

      if (!clientId) {
        logger.error('client_id_not_found');
        return NextResponse.json({ error: 'ID do cliente não encontrado' }, { status: 400 });
      }

      if (!quoteId) {
        return NextResponse.json({ error: 'ID do orçamento não fornecido' }, { status: 400 });
      }

      const admin = SupabaseService.getInstance().getAdminClient();

      // Verificar se o orçamento pertence ao cliente
      const { data: quote, error: quoteErr } = await admin
        .from('quotes')
        .select(
          `
        id,
        rejected_items,
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

      // Buscar itens do orçamento
      const { data: allItems, error: itemsErr } = await admin
        .from('quote_items')
        .select('id, description, quantity, unit_price, total_price')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (itemsErr) {
        logger.error('failed_fetch_items', { error: itemsErr });
        return NextResponse.json({ error: 'Erro ao buscar itens' }, { status: 500 });
      }

      // Filtrar itens rejeitados pelo admin (cliente não vê estes itens)
      const rejectedItemIds = new Set(
        Array.isArray(quote.rejected_items) ? quote.rejected_items : []
      );
      const items = (allItems || []).filter(
        (item: { id: string }) => !rejectedItemIds.has(item.id)
      );

      logger.info('quote_details_fetched', {
        quoteId,
        totalItems: allItems?.length || 0,
        visibleItems: items.length,
        rejectedItems: rejectedItemIds.size,
      });

      return NextResponse.json({ items });
    } catch (error) {
      logger.error('unexpected_error', { error });
      return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
    }
  }
);
