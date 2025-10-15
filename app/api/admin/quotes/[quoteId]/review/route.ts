import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:quotes:review');

type ReviewAction = 'approve_full' | 'reject_full' | 'approve_partial';

interface ReviewRequest {
  action: ReviewAction;
  rejectedItemIds?: string[]; // IDs dos itens rejeitados (para approve_partial)
  rejectionReason?: string; // Motivo da rejeição (para reject_full ou approve_partial)
}

async function handler(req: AuthenticatedRequest, ctx: { params: Promise<{ quoteId: string }> }) {
  try {
    const { quoteId } = await ctx.params;
    const body: ReviewRequest = await req.json();
    const { action, rejectedItemIds = [], rejectionReason } = body;

    if (!action || !['approve_full', 'reject_full', 'approve_partial'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Ação inválida' }, { status: 400 });
    }

    if (action === 'approve_partial' && (!rejectedItemIds || rejectedItemIds.length === 0)) {
      return NextResponse.json(
        { ok: false, error: 'Para aprovação parcial, é necessário informar itens rejeitados' },
        { status: 400 }
      );
    }

    if (action === 'reject_full' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Motivo da rejeição é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();
    const adminId = req.user.id;

    // Verificar se o quote existe e está pendente de aprovação do admin
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, status, total_value, partner_id, service_order_id, sent_to_admin_at')
      .eq('id', quoteId)
      .in('status', ['pending_admin_approval', 'admin_review'])
      .single();

    if (quoteError || !quote) {
      logger.error('quote_not_found', { error: quoteError, quoteId });
      return NextResponse.json(
        { ok: false, error: 'Orçamento não encontrado ou não está pendente de aprovação' },
        { status: 404 }
      );
    }

    // Validar que o quote foi enviado pelo parceiro
    if (!quote.sent_to_admin_at) {
      logger.warn('attempt_review_unsent_quote', { quoteId });
      return NextResponse.json(
        { ok: false, error: 'Orçamento não foi enviado pelo parceiro' },
        { status: 400 }
      );
    }

    // Validar que o quote tem valor (exceto para rejeição total)
    if (action !== 'reject_full' && quote.total_value === 0) {
      logger.warn('attempt_review_zero_value_quote', { quoteId, action });
      return NextResponse.json(
        { ok: false, error: 'Orçamento não pode ser aprovado sem valor' },
        { status: 400 }
      );
    }

    // Buscar os itens do quote
    const { data: allItems, error: itemsError } = await supabase
      .from('quote_items')
      .select('id, description, quantity, unit_price, total_price')
      .eq('quote_id', quoteId);

    if (itemsError) {
      logger.error('failed_fetch_items', { error: itemsError, quoteId });
      return NextResponse.json(
        { ok: false, error: 'Erro ao buscar itens do orçamento' },
        { status: 500 }
      );
    }

    let newStatus: string;
    let isPartialApproval = false;
    let finalRejectedItems: string[] = [];
    let newTotalValue = quote.total_value;

    switch (action) {
      case 'approve_full':
        // Aprovar integralmente -> status pending_client_approval
        newStatus = 'pending_client_approval';
        break;

      case 'reject_full':
        // Reprovar integralmente -> status rejected
        newStatus = 'rejected';
        // Marcar todos os itens como rejeitados
        finalRejectedItems = (allItems || []).map((item: { id: string }) => item.id);
        break;

      case 'approve_partial':
        // Aprovar parcialmente -> manter como pending_admin_approval mas marcar revisão
        // Ou enviar para cliente com itens marcados como rejeitados
        newStatus = 'pending_client_approval';
        isPartialApproval = true;
        finalRejectedItems = rejectedItemIds;

        // Recalcular o valor total removendo os itens rejeitados
        const rejectedSet = new Set(rejectedItemIds);
        newTotalValue = (allItems || [])
          .filter((item: { id: string }) => !rejectedSet.has(item.id))
          .reduce(
            (sum: number, item: { total_price: number | null }) => sum + (item.total_price || 0),
            0
          );
        break;
    }

    // Atualizar o quote
    const updateData: Record<string, unknown> = {
      status: newStatus,
      admin_reviewed_at: new Date().toISOString(),
      admin_reviewed_by: adminId,
      is_partial_approval: isPartialApproval,
      rejected_items: finalRejectedItems,
      rejection_reason: rejectionReason || null,
      total_value: newTotalValue,
    };

    const { error: updateError } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId);

    if (updateError) {
      logger.error('failed_update_quote', { error: updateError, quoteId, action });
      return NextResponse.json(
        { ok: false, error: 'Erro ao atualizar orçamento' },
        { status: 500 }
      );
    }

    // Atualizar status do veículo e criar entrada no histórico quando aprovar
    if (action === 'approve_full' || action === 'approve_partial') {
      try {
        // Buscar vehicle_id através do service_order
        const { data: serviceOrder } = await supabase
          .from('service_orders')
          .select('vehicle_id')
          .eq('id', quote.service_order_id)
          .single();

        if (serviceOrder?.vehicle_id) {
          // Criar entrada no vehicle_history (não alterar vehicles.status aqui)
          const historyStatus =
            action === 'approve_full'
              ? 'Orçamento Aprovado Integralmente pelo Administrador'
              : `Orçamento Aprovado Parcialmente pelo Administrador (${(allItems || []).length - finalRejectedItems.length}/${(allItems || []).length} itens)`;

          await supabase.from('vehicle_history').insert({
            vehicle_id: serviceOrder.vehicle_id,
            status: historyStatus,
            notes: rejectionReason || null,
          });

          logger.info('vehicle_history_created_after_approval', {
            vehicleId: serviceOrder.vehicle_id,
            action,
            historyStatus,
          });
        } else {
          logger.warn('service_order_not_found_for_quote', {
            quoteId,
            serviceOrderId: quote.service_order_id,
          });
        }
      } catch (historyError) {
        logger.warn('failed_to_update_vehicle_status_or_history', {
          error: historyError,
          quoteId,
        });
        // Não falhar a requisição principal
      }
    }

    logger.info('quote_reviewed_successfully', {
      quoteId,
      action,
      adminId,
      newStatus,
      isPartialApproval,
      rejectedItemsCount: finalRejectedItems.length,
      newTotalValue,
    });

    return NextResponse.json({
      ok: true,
      action,
      newStatus,
      isPartialApproval,
      rejectedItemsCount: finalRejectedItems.length,
      newTotalValue,
    });
  } catch (error) {
    logger.error('review_quote_unexpected_error', { error });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withAdminAuth(handler);
