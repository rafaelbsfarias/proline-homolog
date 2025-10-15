import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:start-service');

/**
 * POST /api/partner/start-service
 *
 * Marca um serviço específico como iniciado:
 * 1. Atualiza quote_items.started_at
 * 2. Adiciona entrada na timeline (vehicle_history) com tipo EXECUTION_STARTED
 * 3. Atualiza status do veículo para "Em Execução" se necessário
 *
 * Body:
 * {
 *   quote_id: string,
 *   quote_item_id: string
 * }
 */
async function startServiceHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { quote_id, quote_item_id } = body;

    if (!quote_id || !quote_item_id) {
      logger.warn('missing_required_fields', { quote_id, quote_item_id });
      return NextResponse.json(
        { ok: false, error: 'quote_id e quote_item_id são obrigatórios' },
        { status: 400 }
      );
    }

    logger.info('start_service_request', { quote_id, quote_item_id, partner_id: req.user.id });

    const supabase = SupabaseService.getInstance().getAdminClient();

    // 1. Buscar informações do serviço
    const { data: quoteItem, error: itemError } = await supabase
      .from('quote_items')
      .select('description, started_at, completed_at')
      .eq('id', quote_item_id)
      .eq('quote_id', quote_id)
      .single();

    if (itemError || !quoteItem) {
      logger.error('quote_item_not_found', { error: itemError, quote_item_id });
      return NextResponse.json({ ok: false, error: 'Serviço não encontrado' }, { status: 404 });
    }

    // 2. Verificar se já foi iniciado
    if (quoteItem.started_at) {
      logger.warn('service_already_started', { quote_item_id, started_at: quoteItem.started_at });
      return NextResponse.json({ ok: false, error: 'Serviço já foi iniciado' }, { status: 400 });
    }

    // 3. Verificar se já foi concluído (não pode iniciar algo concluído)
    if (quoteItem.completed_at) {
      logger.warn('service_already_completed', { quote_item_id });
      return NextResponse.json({ ok: false, error: 'Serviço já foi concluído' }, { status: 400 });
    }

    // 4. Buscar vehicle_id associado ao quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('service_order_id, partner_id')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      logger.error('quote_not_found', { error: quoteError, quote_id });
      return NextResponse.json({ ok: false, error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // 5. Verificar se o orçamento pertence ao parceiro
    if (quote.partner_id !== req.user.id) {
      logger.warn('unauthorized_access', {
        partner_id: req.user.id,
        quote_partner: quote.partner_id,
      });
      return NextResponse.json(
        { ok: false, error: 'Você não tem permissão para acessar este orçamento' },
        { status: 403 }
      );
    }

    const { data: serviceOrder, error: orderError } = await supabase
      .from('service_orders')
      .select('vehicle_id')
      .eq('id', quote.service_order_id)
      .single();

    if (orderError || !serviceOrder) {
      logger.error('service_order_not_found', { error: orderError, quote_id });
      return NextResponse.json(
        { ok: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    const { vehicle_id } = serviceOrder;

    // 6. Marcar serviço como iniciado
    const startedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('quote_items')
      .update({ started_at: startedAt })
      .eq('id', quote_item_id);

    if (updateError) {
      logger.error('failed_update_quote_item', { error: updateError, quote_item_id });
      return NextResponse.json({ ok: false, error: 'Erro ao iniciar serviço' }, { status: 500 });
    }

    logger.info('quote_item_started', { quote_item_id, started_at: startedAt });

    // 7. Buscar status atual do veículo
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicle_id)
      .single();

    // 8. Atualizar status do veículo para "Em Execução" se ainda não estiver
    if (vehicle && vehicle.status !== 'Em Execução') {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'Em Execução' })
        .eq('id', vehicle_id);

      if (vehicleError) {
        logger.warn('failed_update_vehicle_status', { error: vehicleError, vehicle_id });
      } else {
        logger.info('vehicle_status_updated', {
          vehicle_id,
          from: vehicle.status,
          to: 'Em Execução',
        });
      }
    }

    // 9. Adicionar entrada específica na timeline do veículo
    const timelineMessage = `${quoteItem.description} - Iniciado`;
    const { error: historyError } = await supabase.from('vehicle_history').insert({
      vehicle_id,
      status: 'Em Execução',
      partner_service: quoteItem.description,
      notes: timelineMessage,
      type: 'EXECUTION_STARTED',
      meta: {
        partner_service: quoteItem.description,
        quote_id,
        quote_item_id,
      },
      created_at: startedAt,
    });

    if (historyError) {
      logger.warn('failed_insert_vehicle_history', { error: historyError, vehicle_id });
      // Não retorna erro, apenas loga - a timeline é secundária
    } else {
      logger.info('vehicle_history_created', {
        vehicle_id,
        service: quoteItem.description,
        type: 'EXECUTION_STARTED',
      });
    }

    return NextResponse.json({
      ok: true,
      started_at: startedAt,
      message: `Execução de "${quoteItem.description}" iniciada com sucesso`,
    });
  } catch (error) {
    logger.error('start_service_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(startServiceHandler);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
