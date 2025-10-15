import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

interface UpdateTimesRequest {
  items: Array<{
    item_id: string;
    estimated_days: number;
  }>;
  comments?: string;
}

async function updateQuoteTimesHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body: UpdateTimesRequest = await req.json();

    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Itens para atualização são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Verificar se o orçamento pertence ao parceiro e está aguardando revisão
    const { data: quote, error: qError } = await supabase
      .from('quotes')
      .select('id, partner_id, status')
      .eq('id', quoteId)
      .eq('partner_id', req.user.id)
      .eq('status', 'specialist_time_revision_requested')
      .single();

    if (qError || !quote) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Orçamento não encontrado, não pertence ao parceiro ou não está aguardando revisão',
        },
        { status: 404 }
      );
    }

    // Validar prazos
    const invalidItems = body.items.filter(item => item.estimated_days <= 0);
    if (invalidItems.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Todos os prazos devem ser números positivos' },
        { status: 400 }
      );
    }

    // Atualizar os prazos dos itens
    const updatePromises = body.items.map(item =>
      supabase
        .from('quote_items')
        .update({ estimated_days: item.estimated_days })
        .eq('id', item.item_id)
        .eq('quote_id', quoteId)
    );

    const results = await Promise.all(updatePromises);

    // Verificar se todas as atualizações foram bem-sucedidas
    const hasErrors = results.some(result => result.error);
    if (hasErrors) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar alguns prazos' },
        { status: 500 }
      );
    }

    // Criar registro de revisão do parceiro
    const { error: reviewError } = await supabase.from('quote_time_reviews').insert({
      quote_id: quoteId,
      specialist_id: null,
      action: 'partner_updated',
      comments: body.comments || 'Prazos atualizados pelo parceiro',
      created_by: req.user.id,
    });

    if (reviewError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao registrar revisão',
          details: reviewError.message,
          code: reviewError.code,
        },
        { status: 500 }
      );
    }

    // Atualizar o status do orçamento de volta para admin_review
    const { error: sError } = await supabase
      .from('quotes')
      .update({ status: 'admin_review' })
      .eq('id', quoteId);

    if (sError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar status do orçamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prazos atualizados com sucesso. Orçamento reenviado para revisão do admin.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const PUT = withPartnerAuth(updateQuoteTimesHandler);
