import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

interface TimeReviewRequest {
  action: 'approved' | 'revision_requested';
  comments?: string;
  reviewed_item_ids?: string[];
  revision_requests?: Record<string, { suggested_days: number; reason: string }>;
}

async function reviewQuoteTimesHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body: TimeReviewRequest = await req.json();

    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.action || !['approved', 'revision_requested'].includes(body.action)) {
      return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Buscar o orçamento com informações básicas
    const { data: quote, error: qError } = await supabase
      .from('quotes')
      .select('id, status, service_order_id')
      .eq('id', quoteId)
      .single();

    console.log('[review-times] Quote lookup:', { quote, qError });

    if (qError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Buscar a service order e veículo
    const { data: serviceOrder, error: soError } = await supabase
      .from('service_orders')
      .select('vehicle_id')
      .eq('id', quote.service_order_id)
      .single();

    console.log('[review-times] Service order lookup:', { serviceOrder, soError });

    if (soError || !serviceOrder) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Buscar o veículo e client_id
    const { data: vehicle, error: vError } = await supabase
      .from('vehicles')
      .select('client_id')
      .eq('id', serviceOrder.vehicle_id)
      .single();

    console.log('[review-times] Vehicle lookup:', { vehicle, vError });

    if (vError || !vehicle) {
      return NextResponse.json(
        { success: false, error: 'Veículo não encontrado' },
        { status: 404 }
      );
    }

    const clientId = vehicle.client_id;

    // Verificar se o especialista está associado ao cliente
    const { data: clientSpecialist, error: csError } = await supabase
      .from('client_specialists')
      .select('client_id, specialist_id')
      .eq('client_id', clientId)
      .eq('specialist_id', req.user.id)
      .single();

    console.log('[review-times] Client specialist lookup:', {
      clientId,
      specialistId: req.user.id,
      clientSpecialist,
      csError,
    });

    if (csError || !clientSpecialist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado a este orçamento',
          details: { clientId, specialistId: req.user.id },
        },
        { status: 403 }
      );
    }

    // Verificar se o orçamento está no status correto
    if (quote.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Orçamento não está aguardando aprovação de prazos' },
        { status: 400 }
      );
    }

    // Criar o registro de revisão
    const { data: review, error: rError } = await supabase
      .from('quote_time_reviews')
      .insert({
        quote_id: quoteId,
        specialist_id: req.user.id,
        action: body.action,
        comments: body.comments,
        reviewed_item_ids: body.reviewed_item_ids,
        revision_requests: body.revision_requests,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (rError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar revisão' },
        { status: 500 }
      );
    }

    // Atualizar o status do orçamento baseado na ação
    const newStatus =
      body.action === 'approved'
        ? 'specialist_time_approved'
        : 'specialist_time_revision_requested';

    const { error: uError } = await supabase
      .from('quotes')
      .update({ status: newStatus })
      .eq('id', quoteId);

    if (uError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar status do orçamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const POST = withSpecialistAuth(reviewQuoteTimesHandler);
