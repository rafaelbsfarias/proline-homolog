import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError } from '@/lib/utils/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:financial-summary');

async function getFinancialSummary(req: AuthenticatedRequest) {
  try {
    const partnerId = req.user.id;
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    logger.info('🔍 Buscando resumo financeiro para partner', {
      partnerId,
      startDate,
      endDate,
    });

    // Validar que ambos os parâmetros foram fornecidos
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'start_date e end_date são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar período máximo
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
    rpcResult.period.label = `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;

    // Formatar resposta
    const response = {
      success: true,
      data: rpcResult,
    };

    logger.info('✅ Resumo financeiro obtido com sucesso', {
      partnerId,
      startDate,
      endDate,
      totalRevenue: rpcResult.metrics.total_revenue.amount,
      totalQuotes: rpcResult.metrics.total_quotes,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('💥 Erro interno na API financial-summary:', { error });
    return handleApiError(error);
  }
}

export const GET = withPartnerAuth(getFinancialSummary);
