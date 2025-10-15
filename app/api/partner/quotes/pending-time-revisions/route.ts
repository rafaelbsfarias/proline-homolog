import { NextResponse } from 'next/server';
import {
  withPartnerAuth,
  type AuthenticatedRequest,
} from '../../../../../modules/common/utils/authMiddleware';
import { SupabaseService } from '../../../../../modules/common/services/SupabaseService';

interface Quote {
  id: string;
  service_order_id: string;
  created_at: string;
}

interface Profile {
  full_name: string;
}

async function getPendingTimeRevisionsHandler(req: AuthenticatedRequest) {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();
    const partnerId = req.user.id;

    // Buscar orçamentos com status 'specialist_time_revision_requested' do parceiro
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, service_order_id, created_at')
      .eq('partner_id', partnerId)
      .eq('status', 'specialist_time_revision_requested')
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
    const pendingRevisions = await Promise.all(
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
          .eq('quote_id', quote.id)
          .eq('action', 'revision_requested')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!revision) return null;

        // Contar total de itens do orçamento
        const { count: itemsCount } = await supabase
          .from('quote_items')
          .select('id', { count: 'exact', head: true })
          .eq('quote_id', quote.id);

        // Contar itens com sugestão de revisão
        const revisionRequests = (revision.revision_requests as Record<string, unknown>) || {};
        const revisionItemsCount = Object.keys(revisionRequests).length;

        const specialistProfile = revision.profiles as Profile | null;

        return {
          quote_id: quote.id,
          quote_number: quote.id.substring(0, 8).toUpperCase(),
          client_name: client?.full_name || 'Cliente não identificado',
          vehicle_plate: vehicle.plate,
          vehicle_model: vehicle.model,
          requested_at: revision.created_at,
          specialist_name: specialistProfile?.full_name || 'Especialista não identificado',
          specialist_comments: revision.comments || '',
          items_count: itemsCount || 0,
          revision_items_count: revisionItemsCount,
        };
      })
    );

    // Filtrar nulls
    const validRevisions = pendingRevisions.filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json({
      success: true,
      data: validRevisions,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withPartnerAuth(getPendingTimeRevisionsHandler);
