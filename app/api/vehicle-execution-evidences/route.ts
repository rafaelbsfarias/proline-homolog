import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:vehicle-execution-evidences');

/**
 * GET /api/vehicle-execution-evidences?vehicleId=...
 *
 * Retorna evidências de execução agrupadas por serviço
 * Usa admin client para evitar problemas com RLS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ ok: false, error: 'vehicleId é obrigatório' }, { status: 400 });
    }

    logger.info('fetch_execution_evidences_start', { vehicleId });

    const supabase = SupabaseService.getInstance().getAdminClient();

    // 1. Buscar service_orders do veículo
    const { data: serviceOrders, error: soError } = await supabase
      .from('service_orders')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (soError) {
      logger.error('fetch_service_orders_error', { error: soError });
      return NextResponse.json(
        { ok: false, error: 'Erro ao buscar ordens de serviço' },
        { status: 500 }
      );
    }

    if (!serviceOrders || serviceOrders.length === 0) {
      logger.info('no_service_orders_found', { vehicleId });
      return NextResponse.json({ ok: true, evidences: [] });
    }

    // 2. Buscar quotes associadas
    const serviceOrderIds = serviceOrders.map(so => so.id);
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .in('service_order_id', serviceOrderIds);

    if (quotesError) {
      logger.error('fetch_quotes_error', { error: quotesError });
      return NextResponse.json({ ok: false, error: 'Erro ao buscar orçamentos' }, { status: 500 });
    }

    if (!quotes || quotes.length === 0) {
      logger.info('no_quotes_found', { vehicleId });
      return NextResponse.json({ ok: true, evidences: [] });
    }

    const quoteIds = quotes.map(q => q.id);
    logger.info('quotes_found', { count: quoteIds.length });

    // 3. Buscar evidências de execução
    const { data: executionEvidences, error: evidencesError } = await supabase
      .from('execution_evidences')
      .select('id, quote_item_id, image_url, description, uploaded_at')
      .in('quote_id', quoteIds)
      .order('uploaded_at', { ascending: true });

    if (evidencesError) {
      logger.error('fetch_execution_evidences_error', { error: evidencesError });
      return NextResponse.json({ ok: false, error: 'Erro ao buscar evidências' }, { status: 500 });
    }

    logger.info('execution_evidences_loaded', { count: executionEvidences?.length || 0 });

    if (!executionEvidences || executionEvidences.length === 0) {
      return NextResponse.json({ ok: true, evidences: [] });
    }

    // 4. Buscar informações dos quote_items
    const quoteItemIds = [...new Set(executionEvidences.map(ev => ev.quote_item_id))];
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select('id, description, completed_at')
      .in('id', quoteItemIds);

    if (itemsError) {
      logger.error('fetch_quote_items_error', { error: itemsError });
      return NextResponse.json(
        { ok: false, error: 'Erro ao buscar itens do orçamento' },
        { status: 500 }
      );
    }

    // 5. Criar mapa de quote_items para fácil acesso
    type QuoteItem = {
      id: string;
      description: string | null;
      completed_at: string | null;
    };
    const itemsMap = new Map<string, QuoteItem>(
      quoteItems?.map((item: QuoteItem) => [item.id, item]) || []
    );

    // 6. Agrupar evidências por serviço
    const groupedMap = new Map<
      string,
      {
        serviceName: string;
        completed: boolean;
        completedAt: string | null;
        evidences: Array<{
          id: string;
          image_url: string;
          description: string | null;
          uploaded_at: string;
        }>;
      }
    >();

    executionEvidences.forEach(ev => {
      const item = itemsMap.get(ev.quote_item_id);
      if (!item) return;

      if (!groupedMap.has(ev.quote_item_id)) {
        groupedMap.set(ev.quote_item_id, {
          serviceName: item.description || 'Serviço sem nome',
          completed: !!item.completed_at,
          completedAt: item.completed_at,
          evidences: [],
        });
      }

      groupedMap.get(ev.quote_item_id)!.evidences.push({
        id: ev.id,
        image_url: ev.image_url,
        description: ev.description,
        uploaded_at: ev.uploaded_at,
      });
    });

    const grouped = Array.from(groupedMap.values());
    logger.info('evidences_grouped', { services: grouped.length });

    return NextResponse.json({ ok: true, evidences: grouped });
  } catch (error) {
    logger.error('fetch_execution_evidences_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
