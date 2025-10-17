import { NextRequest, NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError } from '@/lib/utils/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:financial-summary');

interface FinancialSummaryRequest {
  period?: 'last_month' | 'last_3_months' | 'last_year' | 'custom';
  start_date?: string;
  end_date?: string;
}

async function getFinancialSummary(req: AuthenticatedRequest) {
  try {
    const partnerId = req.user.id;
    const url = new URL(req.url);
    const period =
      (url.searchParams.get('period') as FinancialSummaryRequest['period']) || 'last_month';
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    logger.info('🔍 Buscando resumo financeiro para partner', {
      partnerId,
      period,
      startDate,
      endDate,
    });

    // Validar período custom
    if (period === 'custom') {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'Período custom requer start_date e end_date' },
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
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Calcular período se não for custom
    let periodStart: string;
    let periodEnd: string;
    const now = new Date();

    switch (period) {
      case 'last_month':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split('T')[0];
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last_3_months':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          .toISOString()
          .split('T')[0];
        periodEnd = now.toISOString().split('T')[0];
        break;
      case 'last_year':
        periodStart = new Date(now.getFullYear() - 1, now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        periodEnd = now.toISOString().split('T')[0];
        break;
      case 'custom':
        periodStart = startDate!;
        periodEnd = endDate!;
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split('T')[0];
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    }

    // Buscar dados financeiros
    const { data, error } = await supabase.rpc('get_partner_financial_summary', {
      p_partner_id: partnerId,
      p_start_date: periodStart,
      p_end_date: periodEnd,
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
          start_date: periodStart,
          end_date: periodEnd,
          label: getPeriodLabel(period, periodStart, periodEnd),
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

    logger.info('✅ Resumo financeiro obtido com sucesso', {
      partnerId,
      period,
      totalRevenue: data.total_revenue,
      totalQuotes: data.total_quotes,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('💥 Erro interno na API financial-summary:', { error });
    return handleApiError(error);
  }
}

function getPeriodLabel(period: string, startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  switch (period) {
    case 'last_month':
      return `${start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    case 'last_3_months':
      return `Últimos 3 meses`;
    case 'last_year':
      return `Último ano`;
    case 'custom':
      return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
    default:
      return `${start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export const GET = withPartnerAuth(getFinancialSummary);
