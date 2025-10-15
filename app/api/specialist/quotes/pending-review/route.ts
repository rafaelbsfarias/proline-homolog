import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '../../../../../modules/common/utils/authMiddleware';
import { SupabaseService } from '../../../../../modules/common/services/SupabaseService';

interface Quote {
  id: string;
  service_order_id: string;
  total_value: number;
  created_at: string;
  status: string;
  partner_id: string;
}

interface QuoteTimeReview {
  created_at: string;
  comments: string | null;
}

/**
 * API: GET /api/specialist/quotes/pending-review
 *
 * Retorna orçamentos que o parceiro atualizou e aguardam nova revisão do especialista.
 * Esses são orçamentos em status 'admin_review' que têm 'partner_updated' mais recente
 * que a última aprovação ou revisão do especialista.
 */
async function getPendingReviewHandler(req: AuthenticatedRequest) {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();
    const specialistId = req.user.id;

    // Buscar clientes do especialista
    const { data: clientSpecialists, error: csError } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('specialist_id', specialistId);

    if (csError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar clientes do especialista' },
        { status: 500 }
      );
    }

    if (!clientSpecialists || clientSpecialists.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const clientIds = clientSpecialists.map(cs => cs.client_id);

    // Buscar orçamentos em admin_review dos clientes do especialista
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, service_order_id, total_value, created_at, status, partner_id')
      .eq('status', 'admin_review')
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

    // Para cada orçamento, verificar se pertence aos clientes do especialista
    // e se tem partner_updated recente
    const pendingReviews = await Promise.all(
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

        // Verificar se o veículo pertence a um cliente do especialista
        if (!clientIds.includes(vehicle.client_id)) {
          return null;
        }

        // Buscar nome do cliente
        const { data: client } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', vehicle.client_id)
          .single();

        // Buscar última atualização do parceiro
        const { data: lastPartnerUpdate } = await supabase
          .from('quote_time_reviews')
          .select('created_at, comments')
          .eq('quote_id', quote.id)
          .eq('action', 'partner_updated')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Se não tem partner_updated, não é uma revisão pendente
        if (!lastPartnerUpdate) {
          return null;
        }

        // Buscar última revisão solicitada
        const { data: lastRevision } = await supabase
          .from('quote_time_reviews')
          .select('created_at, comments')
          .eq('quote_id', quote.id)
          .eq('action', 'revision_requested')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Buscar nome do parceiro
        const { data: partner } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', quote.partner_id)
          .single();

        // Contar total de itens do orçamento
        const { count: itemsCount } = await supabase
          .from('quote_items')
          .select('id', { count: 'exact', head: true })
          .eq('quote_id', quote.id);

        // Calcular tempo de espera desde a última atualização do parceiro
        const waitingDays = Math.floor(
          (new Date().getTime() - new Date(lastPartnerUpdate.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Contar quantas revisões já foram feitas
        const { data: allRevisions } = await supabase
          .from('quote_time_reviews')
          .select('action')
          .eq('quote_id', quote.id)
          .in('action', ['revision_requested', 'partner_updated']);

        const revisionCount = allRevisions
          ? allRevisions.filter(r => r.action === 'revision_requested').length
          : 0;

        return {
          quote_id: quote.id,
          quote_number: quote.id.substring(0, 8).toUpperCase(),
          client_name: client?.full_name || 'Cliente não identificado',
          partner_name: partner?.full_name || 'Parceiro não identificado',
          vehicle_plate: vehicle.plate,
          vehicle_model: vehicle.model,
          updated_at: lastPartnerUpdate.created_at,
          partner_comments: (lastPartnerUpdate as QuoteTimeReview).comments || null,
          last_revision_comments: lastRevision?.comments || null,
          items_count: itemsCount || 0,
          total_value: quote.total_value,
          waiting_days: waitingDays,
          revision_count: revisionCount,
        };
      })
    );

    // Filtrar nulls e ordenar por tempo de espera (mais antigos primeiro)
    const validReviews = pendingReviews
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.waiting_days - a.waiting_days);

    return NextResponse.json({
      success: true,
      data: validReviews,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withSpecialistAuth(getPendingReviewHandler);
