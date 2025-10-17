import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError } from '@/lib/utils/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:partner:financial-summary');

async function getPartnerFinancialSummary(
  req: AuthenticatedRequest,
  { params }: { params: { partnerId: string } }
) {
  try {
    const partnerId = params.partnerId;
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    logger.info('🔍 [Admin] Buscando resumo financeiro para partner', {
      adminId: req.user.id,
      partnerId,
      startDate,
      endDate,
    });

    // Validar período
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'start_date e end_date são obrigatórios' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      return NextResponse.json(
        { success: false, error: 'Período máximo permitido é de 365 dias' },
        { status: 422 }
      );
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Buscar dados financeiros
    const { data, error } = await supabase.rpc('get_partner_financial_summary', {
      p_partner_id: partnerId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      logger.error('❌ Erro na função RPC:', { error });
      throw new DatabaseError(`Falha ao buscar dados financeiros: ${error.message}`);
    }

    // Formatar resposta
    const response = {
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate,
          label: `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`,
        },
        metrics: {
          total_revenue: {
            amount: data.total_revenue || 0,
            formatted: formatCurrency(data.total_revenue || 0),
            currency: 'BRL',
          },
          total_quotes: data.total_quotes || 0,
          average_quote_value: {
            amount: data.average_quote_value || 0,
            formatted: formatCurrency(data.average_quote_value || 0),
            currency: 'BRL',
          },
          parts: {
            total_parts_requested: data.total_parts_requested || 0,
            total_parts_value: {
              amount: data.total_parts_value || 0,
              formatted: formatCurrency(data.total_parts_value || 0),
              currency: 'BRL',
            },
          },
          projected_value: {
            pending_approval: {
              amount: data.pending_approval_value || 0,
              formatted: formatCurrency(data.pending_approval_value || 0),
              currency: 'BRL',
            },
            in_execution: {
              amount: data.in_execution_value || 0,
              formatted: formatCurrency(data.in_execution_value || 0),
              currency: 'BRL',
            },
            total_projected: {
              amount: (data.pending_approval_value || 0) + (data.in_execution_value || 0),
              formatted: formatCurrency(
                (data.pending_approval_value || 0) + (data.in_execution_value || 0)
              ),
              currency: 'BRL',
            },
          },
        },
        metadata: {
          generated_at: new Date().toISOString(),
          data_freshness: 'real-time',
          calculation_method: 'confirmed_quotes_only',
        },
      },
    };

    logger.info('✅ [Admin] Resumo financeiro obtido com sucesso', {
      adminId: req.user.id,
      partnerId,
      totalRevenue: data.total_revenue,
      totalQuotes: data.total_quotes,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('💥 Erro interno na API financial-summary:', { error });
    return handleApiError(error);
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export const GET = withAdminAuth(getPartnerFinancialSummary);
