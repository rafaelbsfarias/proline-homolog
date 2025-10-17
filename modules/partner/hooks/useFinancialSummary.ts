import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// --- Tipos de Dados ---
export interface FinancialSummaryData {
  period: {
    start_date: string | null;
    end_date: string | null;
    label: string;
  };
  metrics: {
    total_revenue: {
      amount: number;
      formatted: string;
      currency: string;
    };
    total_quotes: number;
    average_quote_value: {
      amount: number;
      formatted: string;
      currency: string;
    };
    parts: {
      total_parts_requested: number;
      total_parts_value: {
        amount: number;
        formatted: string;
        currency: string;
      };
    };
    projected_value: {
      pending_approval: {
        amount: number;
        formatted: string;
        currency: string;
      };
      in_execution: {
        amount: number;
        formatted: string;
        currency: string;
      };
      total_projected: {
        amount: number;
        formatted: string;
        currency: string;
      };
    };
  };
}

export interface FinancialSummaryPeriod {
  start_date?: string;
  end_date?: string;
}

// --- Hook ---
export function useFinancialSummary(period?: FinancialSummaryPeriod) {
  const [data, setData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();

  const fetchFinancialSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (period?.start_date) params.append('start_date', period.start_date);
      if (period?.end_date) params.append('end_date', period.end_date);

      const queryString = params.toString();
      const url = `/api/partner/financial-summary${queryString ? `?${queryString}` : ''}`;

      const response = await authenticatedFetch(url);

      if (response.ok && response.data) {
        const apiResponse = response.data as {
          success: boolean;
          data: FinancialSummaryData;
          error?: string;
        };

        if (apiResponse.success && apiResponse.data) {
          setData(apiResponse.data);
        } else {
          setError(apiResponse.error || 'Erro ao buscar dados financeiros');
          setData(null);
        }
      } else {
        setError(response.error || 'Erro ao buscar dados financeiros');
        setData(null);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, period]);

  useEffect(() => {
    fetchFinancialSummary();
  }, [fetchFinancialSummary]);

  return {
    data,
    loading,
    error,
    refetch: fetchFinancialSummary,
  };
}
