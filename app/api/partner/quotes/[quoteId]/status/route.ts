import { NextResponse } from 'next/server';
import {
  withPartnerAuth,
  type AuthenticatedRequest,
} from '../../../../../../modules/common/utils/authMiddleware';
import { SupabaseService } from '../../../../../../modules/common/services/SupabaseService';

async function getQuoteStatusHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const supabase = SupabaseService.getInstance().getAdminClient();
    const partnerId = req.user.id;

    // Buscar status do orçamento e verificar se pertence ao parceiro
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('status, partner_id')
      .eq('id', quoteId)
      .single();

    if (error || !quote) {
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

    return NextResponse.json({
      success: true,
      status: quote.status,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withPartnerAuth(getQuoteStatusHandler);
