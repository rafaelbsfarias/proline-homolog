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

    // Buscar o orçamento com informações básicas + revision_count
    const { data: quote, error: qError } = await supabase
      .from('quotes')
      .select('id, status, service_order_id, revision_count')
      .eq('id', quoteId)
      .single();

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
    // Aceita 'approved' (primeira análise) ou 'admin_review' (parceiro já atualizou)
    if (quote.status !== 'approved' && quote.status !== 'admin_review') {
      return NextResponse.json(
        { success: false, error: 'Orçamento não está aguardando aprovação de prazos' },
        { status: 400 }
      );
    }

    // Verificar se atingiu o limite de revisões (máximo 3)
    const currentRevisionCount = quote.revision_count || 0;
    if (body.action === 'revision_requested' && currentRevisionCount >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limite de revisões atingido',
          message:
            'Este orçamento já passou por 3 rodadas de revisão. Entre em contato diretamente com o parceiro para ajustes adicionais.',
        },
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

    // Se for revision_requested, incrementar revision_count
    const updateData: { status: string; revision_count?: number } = { status: newStatus };
    if (body.action === 'revision_requested') {
      updateData.revision_count = currentRevisionCount + 1;
    }

    const { error: uError } = await supabase.from('quotes').update(updateData).eq('id', quoteId);

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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const POST = withSpecialistAuth(reviewQuoteTimesHandler);
