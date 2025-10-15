import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

async function getQuoteTimeReviewsHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;

    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Verificar se o orçamento pertence ao parceiro
    const { data: quote, error: qError } = await supabase
      .from('quotes')
      .select('id, partner_id')
      .eq('id', quoteId)
      .eq('partner_id', req.user.id)
      .single();

    if (qError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Orçamento não encontrado ou não pertence ao parceiro' },
        { status: 404 }
      );
    }

    // Buscar as revisões de prazos
    const { data: reviews, error: rError } = await supabase
      .from('quote_time_reviews')
      .select(
        `
        id,
        action,
        comments,
        reviewed_item_ids,
        revision_requests,
        created_at,
        specialists!inner (
          profile_id,
          profiles!inner (
            full_name
          )
        )
      `
      )
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false });

    if (rError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar revisões' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reviews || [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withPartnerAuth(getQuoteTimeReviewsHandler);
