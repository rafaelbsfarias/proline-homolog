import { NextResponse } from 'next/server';
import {
  withPartnerAuth,
  type AuthenticatedRequest,
} from '../../../../../../modules/common/utils/authMiddleware';
import { SupabaseService } from '../../../../../../modules/common/services/SupabaseService';

interface RevisionRequest {
  suggested_days: number;
  reason: string;
}

interface Profile {
  full_name: string;
}

interface QuoteItem {
  id: string;
  description: string;
  estimated_days: number;
}

async function getRevisionDetailsHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const supabase = SupabaseService.getInstance().getAdminClient();
    const partnerId = req.user.id;

    // Verificar se o orçamento pertence ao parceiro e se está no status correto
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, partner_id, service_order_id, created_at, status')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    if (quote.partner_id !== partnerId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado a este orçamento' },
        { status: 403 }
      );
    }

    if (quote.status !== 'specialist_time_revision_requested') {
      return NextResponse.json(
        {
          success: false,
          error: 'Orçamento não está aguardando revisão de prazo.',
        },
        { status: 400 }
      );
    }

    // Buscar informações do veículo e cliente
    const { data: serviceOrder } = await supabase
      .from('service_orders')
      .select('vehicle_id')
      .eq('id', quote.service_order_id)
      .single();

    if (!serviceOrder) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('plate, model, client_id')
      .eq('id', serviceOrder.vehicle_id)
      .single();

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Veículo não encontrado' },
        { status: 404 }
      );
    }

    const { data: client } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', vehicle.client_id)
      .single();

    // Buscar última revisão solicitada
    const { data: revision } = await supabase
      .from('quote_time_reviews')
      .select(
        `
        created_at,
        comments,
        revision_requests,
        specialist_id,
        profiles!quote_time_reviews_specialist_id_fkey (
          full_name
        )
      `
      )
      .eq('quote_id', quoteId)
      .eq('action', 'revision_requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!revision) {
      return NextResponse.json(
        { success: false, error: 'Revisão não encontrada' },
        { status: 404 }
      );
    }

    // Buscar itens do orçamento
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select('id, description, estimated_days')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });

    if (itemsError || !quoteItems) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar itens do orçamento' },
        { status: 500 }
      );
    }

    // Processar revision_requests
    const revisionRequests = (revision.revision_requests as Record<string, RevisionRequest>) || {};

    // Mapear itens com sugestões
    const items = quoteItems.map((item: QuoteItem) => {
      const suggestion = revisionRequests[item.id];
      return {
        id: item.id,
        description: item.description,
        estimated_days: item.estimated_days,
        has_suggestion: !!suggestion,
        suggested_days: suggestion?.suggested_days,
        suggestion_reason: suggestion?.reason,
      };
    });

    const specialistProfile = revision.profiles as Profile | null;

    const response = {
      quote: {
        id: quote.id,
        quote_number: quote.id.substring(0, 8).toUpperCase(),
        client_name: client?.full_name || 'Cliente não identificado',
        vehicle_plate: vehicle.plate,
        vehicle_model: vehicle.model,
        created_at: quote.created_at,
      },
      revision: {
        specialist_name: specialistProfile?.full_name || 'Especialista não identificado',
        requested_at: revision.created_at,
        comments: revision.comments || '',
        revision_requests: revisionRequests,
      },
      items,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withPartnerAuth(getRevisionDetailsHandler);
