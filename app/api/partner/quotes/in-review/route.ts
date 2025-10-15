import { NextResponse } from 'next/server';
import {
  withPartnerAuth,
  type AuthenticatedRequest,
} from '../../../../../modules/common/utils/authMiddleware';
import { SupabaseService } from '../../../../../modules/common/services/SupabaseService';

interface Quote {
  id: string;
  service_order_id: string;
  total_value: number;
  created_at: string;
  sent_to_admin_at?: string | null;
  status: string;
}

interface QuoteTimeReview {
  created_at: string;
  comments: string | null;
}

async function getQuotesInReviewHandler(req: AuthenticatedRequest) {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();
    const partnerId = req.user.id;

    // Buscar orçamentos em análise do admin para o parceiro
    // Considerar tanto 'admin_review' (após revisão de prazos) quanto 'pending_admin_approval' (enviados inicialmente)
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, service_order_id, total_value, created_at, sent_to_admin_at, status')
      .eq('partner_id', partnerId)
      .in('status', [
        'admin_review',
        'pending_admin_approval',
        'specialist_time_revision_requested',
      ])
      .order('created_at', { ascending: true });

    if (quotesError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar orçamentos' },
        { status: 500 }
      );
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Para cada orçamento, buscar informações detalhadas
    const quotesInReview = await Promise.all(
      quotes.map(async (quote: Quote) => {
        // Buscar service order e veículo
        const { data: serviceOrder } = await supabase
          .from('service_orders')
          .select('vehicle_id')
          .eq('id', quote.service_order_id)
          .single();

        if (!serviceOrder) return null;

        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('plate, model, client_id')
          .eq('id', serviceOrder.vehicle_id)
          .single();

        if (!vehicle) return null;

        // Buscar nome do cliente
        const { data: client } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', vehicle.client_id)
          .single();

        // Buscar última atualização do parceiro (partner_updated), se existir
        const { data: lastUpdate } = await supabase
          .from('quote_time_reviews')
          .select('created_at, comments')
          .eq('quote_id', quote.id)
          .eq('action', 'partner_updated')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Buscar última solicitação de revisão do especialista, se existir
        const { data: lastRevision } = await supabase
          .from('quote_time_reviews')
          .select('created_at, comments')
          .eq('quote_id', quote.id)
          .eq('action', 'revision_requested')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Contar total de itens do orçamento
        const { count: itemsCount } = await supabase
          .from('quote_items')
          .select('id', { count: 'exact', head: true })
          .eq('quote_id', quote.id);

        // Calcular data de submissão: para revisão solicitada, usar a data da revisão;
        // caso contrário: partner_updated -> sent_to_admin_at -> created_at
        const submittedAt =
          quote.status === 'specialist_time_revision_requested'
            ? lastRevision?.created_at || quote.created_at
            : lastUpdate?.created_at || quote.sent_to_admin_at || quote.created_at;
        const waitingDays = Math.floor(
          (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          quote_id: quote.id,
          quote_number: quote.id.substring(0, 8).toUpperCase(),
          client_name: client?.full_name || 'Cliente não identificado',
          vehicle_plate: vehicle.plate,
          vehicle_model: vehicle.model,
          submitted_at: submittedAt,
          partner_comments: (lastUpdate as QuoteTimeReview | null)?.comments || null,
          items_count: itemsCount || 0,
          total_value: quote.total_value,
          waiting_days: waitingDays,
          has_time_revision: quote.status === 'specialist_time_revision_requested',
          revision_comments: lastRevision?.comments || null,
        };
      })
    );

    // Filtrar nulls
    const validQuotes = quotesInReview.filter((q): q is NonNullable<typeof q> => q !== null);

    return NextResponse.json({
      success: true,
      data: validQuotes,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withPartnerAuth(getQuotesInReviewHandler);
