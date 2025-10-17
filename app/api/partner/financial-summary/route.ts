import { NextResponse } from 'next/server';
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

    // A RPC já retorna a estrutura completa em JSON
    // Apenas ajustamos o label do período para português
    const rpcResult = data as {
      period: { start_date: string; end_date: string; label: string };
      metrics: {
        total_revenue: { amount: number; formatted: string; currency: string };
        total_quotes: number;
        average_quote_value: { amount: number; formatted: string; currency: string };
        parts: {
          total_parts_requested: number;
          total_parts_value: { amount: number; formatted: string; currency: string };
        };
        projected_value: {
          pending_approval: { amount: number; formatted: string; currency: string };
          in_execution: { amount: number; formatted: string; currency: string };
          total_projected: { amount: number; formatted: string; currency: string };
        };
      };
    };

    // Ajustar o label do período para português
    rpcResult.period.label = getPeriodLabel(period, periodStart, periodEnd);

    // Formatar resposta
    const response = {
      success: true,
      data: rpcResult,
    };

    logger.info('✅ Resumo financeiro obtido com sucesso', {
      partnerId,
      period,
      totalRevenue: rpcResult.metrics.total_revenue.amount,
      totalQuotes: rpcResult.metrics.total_quotes,
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

export const GET = withPartnerAuth(getFinancialSummary);
