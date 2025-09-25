import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:quotes:get');

export const GET = withAdminAuth(
  async (req: AuthenticatedRequest, ctx: { params: Promise<{ quoteId: string }> }) => {
    try {
      const { quoteId } = await ctx.params;
      const admin = SupabaseService.getInstance().getAdminClient();

      const { data: quote, error: quoteError } = await admin
        .from('quotes')
        .select(
          `
        id,
        total_value,
        status,
        created_at,
        updated_at,
        supplier_delivery_date,
        service_order_id,
        service_orders (
          id,
          order_code,
          vehicle_id,
          vehicles (
            id,
            plate,
            brand,
            model,
            year,
            color
          ),
          client_id
        )
      `
        )
        .eq('id', quoteId)
        .maybeSingle();

      if (quoteError) {
        logger.error('failed_fetch_quote', { error: quoteError, quoteId });
        return NextResponse.json({ error: 'Erro ao buscar orçamento' }, { status: 500 });
      }
      if (!quote) {
        return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
      }

      const { data: items, error: itemsError } = await admin
        .from('quote_items')
        .select('id, service_id, description, quantity, unit_price, total_price, created_at')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (itemsError) {
        logger.error('failed_fetch_quote_items', { error: itemsError, quoteId });
        return NextResponse.json({ error: 'Erro ao buscar itens do orçamento' }, { status: 500 });
      }

      return NextResponse.json({ quote, items: items || [] });
    } catch (error) {
      logger.error('quote_get_error', { error });
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }
);
