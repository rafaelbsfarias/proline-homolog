import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger/index';

const logger = getLogger('api:partner:complete-service');

// Admin client para operações que precisam bypassar RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * POST /api/partner/complete-service
 *
 * Marca um serviço específico como concluído:
 * 1. Atualiza quote_items.completed_at
 * 2. Adiciona entrada na timeline (vehicle_history)
 * 3. Se all os serviços estiverem concluídos, atualiza vehicle.status para "Finalizado"
 *
 * Body:
 * {
 *   quote_id: string,
 *   quote_item_id: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('missing_auth_header');
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Obter dados do request
    const body = await request.json();
    const { quote_id, quote_item_id } = body;

    if (!quote_id || !quote_item_id) {
      logger.warn('missing_required_fields', { quote_id, quote_item_id });
      return NextResponse.json(
        { ok: false, error: 'quote_id e quote_item_id são obrigatórios' },
        { status: 400 }
      );
    }

    logger.info('complete_service_start', { quote_id, quote_item_id });

    // 3. Buscar informações do serviço e do veículo
    const { data: quoteItem, error: itemError } = await supabaseAdmin
      .from('quote_items')
      .select('description, completed_at')
      .eq('id', quote_item_id)
      .eq('quote_id', quote_id)
      .single();

    if (itemError || !quoteItem) {
      logger.error('quote_item_not_found', { error: itemError, quote_item_id });
      return NextResponse.json({ ok: false, error: 'Serviço não encontrado' }, { status: 404 });
    }

    // 4. Verificar se já está concluído
    if (quoteItem.completed_at) {
      logger.warn('service_already_completed', {
        quote_item_id,
        completed_at: quoteItem.completed_at,
      });
      return NextResponse.json(
        { ok: false, error: 'Serviço já foi marcado como concluído' },
        { status: 400 }
      );
    }

    // 5. Buscar vehicle_id associado ao quote
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select('service_order_id')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      logger.error('quote_not_found', { error: quoteError, quote_id });
      return NextResponse.json({ ok: false, error: 'Orçamento não encontrado' }, { status: 404 });
    }

    const { data: serviceOrder, error: orderError } = await supabaseAdmin
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

    // 6. Marcar serviço como concluído
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('quote_items')
      .update({ completed_at: completedAt })
      .eq('id', quote_item_id);

    if (updateError) {
      logger.error('failed_update_quote_item', { error: updateError, quote_item_id });
      return NextResponse.json(
        { ok: false, error: 'Erro ao marcar serviço como concluído' },
        { status: 500 }
      );
    }

    logger.info('quote_item_completed', { quote_item_id, completed_at: completedAt });

    // 7. Adicionar entrada na timeline do veículo
    const { error: historyError } = await supabaseAdmin.from('vehicle_history').insert({
      vehicle_id,
      status: `Serviço Concluído - ${quoteItem.description}`,
      partner_service: quoteItem.description,
      notes: `Serviço "${quoteItem.description}" marcado como concluído`,
      created_at: completedAt,
    });

    if (historyError) {
      logger.warn('failed_insert_vehicle_history', { error: historyError, vehicle_id });
      // Não retorna erro, apenas loga - a timeline é secundária
    } else {
      logger.info('vehicle_history_created', { vehicle_id, service: quoteItem.description });
    }

    // 8. Verificar se all os serviços foram concluídos
    const { data: allCompleted, error: checkError } = await supabaseAdmin.rpc(
      'all_services_completed',
      { p_quote_id: quote_id }
    );

    if (checkError) {
      logger.warn('failed_check_all_services', { error: checkError, quote_id });
    } else if (allCompleted === true) {
      // 9. all os serviços concluídos - atualizar status do veículo
      const { error: vehicleError } = await supabaseAdmin
        .from('vehicles')
        .update({ status: 'Finalizado' })
        .eq('id', vehicle_id);

      if (vehicleError) {
        logger.error('failed_update_vehicle_status', { error: vehicleError, vehicle_id });
      } else {
        logger.info('vehicle_status_updated_to_finalizado', { vehicle_id, quote_id });

        // 10. Adicionar entrada final na timeline (trigger vai criar automaticamente)
        // Mas vamos atualizar com informações específicas
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: latestHistory } = await supabaseAdmin
          .from('vehicle_history')
          .select('id')
          .eq('vehicle_id', vehicle_id)
          .eq('status', 'Finalizado')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestHistory?.id) {
          await supabaseAdmin
            .from('vehicle_history')
            .update({
              partner_service: 'Todos os Serviços',
              notes: 'Todos os serviços foram concluídos com sucesso',
            })
            .eq('id', latestHistory.id);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      completed_at: completedAt,
      all_services_completed: allCompleted === true,
    });
  } catch (error) {
    logger.error('complete_service_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
