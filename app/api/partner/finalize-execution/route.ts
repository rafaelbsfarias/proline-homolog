import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { DelegationQueueService } from '@/modules/partner/services/DelegationQueueService';

const logger = getLogger('api:partner:finalize-execution');

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
 * POST /api/partner/finalize-execution
 *
 * Finaliza a execução de um orçamento:
 * 1. Verifica se todos os serviços estão concluídos
 * 2. Atualiza execution_checklists para 'completed'
 * 3. Atualiza vehicle.status para 'Execução Finalizada'
 * 4. Adiciona entrada na timeline
 *
 * Body:
 * {
 *   quote_id: string
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
    const { quote_id } = body;

    if (!quote_id) {
      logger.warn('missing_quote_id');
      return NextResponse.json({ ok: false, error: 'quote_id é obrigatório' }, { status: 400 });
    }

    logger.info('finalize_execution_start', { quote_id });

    // 3. Verificar se todos os serviços estão concluídos
    const { data: allCompleted, error: checkError } = await supabaseAdmin.rpc(
      'all_services_completed',
      { p_quote_id: quote_id }
    );

    if (checkError) {
      logger.error('failed_check_all_services', { error: checkError, quote_id });
      return NextResponse.json(
        { ok: false, error: 'Erro ao verificar conclusão dos serviços' },
        { status: 500 }
      );
    }

    if (!allCompleted) {
      logger.warn('not_all_services_completed', { quote_id });
      return NextResponse.json(
        { ok: false, error: 'Nem todos os serviços foram concluídos' },
        { status: 400 }
      );
    }

    // 4. Buscar vehicle_id associado ao quote
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

    // 5. Atualizar execution_checklists
    const completedAt = new Date().toISOString();
    const { error: checklistError } = await supabaseAdmin.from('execution_checklists').upsert({
      quote_id,
      status: 'completed',
      completed_at: completedAt,
    });

    if (checklistError) {
      logger.error('failed_update_checklist', { error: checklistError, quote_id });
      return NextResponse.json(
        { ok: false, error: 'Erro ao finalizar checklist' },
        { status: 500 }
      );
    }

    logger.info('checklist_completed', { quote_id, completed_at: completedAt });

    // 6. Atualizar status do veículo para "Execução Finalizada"
    const { error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .update({ status: 'Execução Finalizada' })
      .eq('id', vehicle_id);

    if (vehicleError) {
      logger.error('failed_update_vehicle_status', { error: vehicleError, vehicle_id });
      return NextResponse.json(
        { ok: false, error: 'Erro ao atualizar status do veículo' },
        { status: 500 }
      );
    }

    logger.info('vehicle_status_updated', { vehicle_id, status: 'Execução Finalizada' });

    // 7. Aguardar um pouco para o trigger criar a entrada
    await new Promise(resolve => setTimeout(resolve, 100));

    // 8. Atualizar entrada da timeline criada pelo trigger
    const { data: latestHistory } = await supabaseAdmin
      .from('vehicle_history')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .eq('status', 'Execução Finalizada')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestHistory?.id) {
      await supabaseAdmin
        .from('vehicle_history')
        .update({
          partner_service: 'Todos os Serviços',
          notes: 'Execução finalizada com sucesso. Todos os serviços foram concluídos.',
        })
        .eq('id', latestHistory.id);

      logger.info('timeline_updated', { vehicle_id, history_id: latestHistory.id });
    }

    // 9. Atualizar status do orçamento para 'finalized'
    const { error: quoteUpdateError } = await supabaseAdmin
      .from('quotes')
      .update({ status: 'finalized', updated_at: new Date().toISOString() })
      .eq('id', quote_id);

    if (quoteUpdateError) {
      logger.warn('failed_update_quote_status_to_finalized', {
        quote_id,
        error: quoteUpdateError,
      });
      // Não falhar a finalização por causa do status; apenas logar.
    } else {
      logger.info('quote_status_updated_to_finalized', { quote_id });
    }

    // 10. AVANÇAR FILA: Usar DelegationQueueService para processar próximo parceiro
    logger.info('processing_delegation_queue', { vehicle_id });

    // Buscar category_id do quote atual
    const { data: currentServiceOrder } = await supabaseAdmin
      .from('service_orders')
      .select('category_id')
      .eq('id', quote.service_order_id)
      .single();

    if (currentServiceOrder?.category_id) {
      const queueService = new DelegationQueueService(supabaseAdmin, logger);
      const queueResult = await queueService.processQueueOnCompletion(
        vehicle_id,
        currentServiceOrder.category_id
      );

      if (queueResult.success && queueResult.quote_id) {
        logger.info('next_partner_activated_via_delegation_queue', {
          activated_quote_id: queueResult.quote_id,
          partner_id: queueResult.partner_id,
          category_id: queueResult.category_id,
          vehicle_id,
        });
      } else if (!queueResult.success) {
        logger.warn('queue_processing_failed', {
          error: queueResult.error,
          vehicle_id,
          completed_category: currentServiceOrder.category_id,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      completed_at: completedAt,
      vehicle_status: 'Execução Finalizada',
    });
  } catch (error) {
    logger.error('finalize_execution_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
