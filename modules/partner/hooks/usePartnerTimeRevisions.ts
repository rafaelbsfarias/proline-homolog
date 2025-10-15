import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '../../common/hooks/useAuthenticatedFetch';

export interface PendingRevision {
  quote_id: string;
  quote_number: string;
  client_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  requested_at: string;
  specialist_name: string;
  specialist_comments: string;
  items_count: number;
  revision_items_count: number;
}

export interface QuoteInReview {
  quote_id: string;
  quote_number: string;
  client_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  submitted_at: string;
  partner_comments?: string;
  items_count: number;
  total_value: number;
  waiting_days: number;
  has_time_revision?: boolean;
  revision_comments?: string | null;
}

export interface RevisionDetails {
  quote: {
    id: string;
    quote_number: string;
    client_name: string;
    vehicle_plate: string;
    vehicle_model: string;
    created_at: string;
  };
  revision: {
    specialist_name: string;
    requested_at: string;
    comments: string;
    revision_requests: Record<
      string,
      {
        suggested_days: number;
        reason: string;
      }
    >;
  };
  items: Array<{
    id: string;
    description: string;
    estimated_days: number;
    has_suggestion: boolean;
    suggested_days?: number;
    suggestion_reason?: string;
  }>;
}

export interface UpdateTimesRequest {
  items: Array<{
    item_id: string;
    estimated_days: number;
  }>;
  comments?: string;
}

export const usePartnerTimeRevisions = () => {
  const { get, put } = useAuthenticatedFetch();
  const [pendingRevisions, setPendingRevisions] = useState<PendingRevision[]>([]);
  const [quotesInReview, setQuotesInReview] = useState<QuoteInReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInReview, setLoadingInReview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await get<{ success: boolean; data: PendingRevision[] }>(
        '/api/partner/quotes/pending-time-revisions'
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // A API retorna { success: true, data: [...] }
      // O useAuthenticatedFetch retorna { data: { success: true, data: [...] } }
      const apiData = response.data?.data;
      const data = Array.isArray(apiData) ? apiData : [];
      setPendingRevisions(data);
    } catch (err) {
      setError((err as Error).message);
      setPendingRevisions([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchQuotesInReview = useCallback(async () => {
    try {
      setLoadingInReview(true);
      setError(null);

      const response = await get<{ success: boolean; data: QuoteInReview[] }>(
        '/api/partner/quotes/in-review'
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const apiData = response.data?.data;
      const data = Array.isArray(apiData) ? apiData : [];
      setQuotesInReview(data);
    } catch (err) {
      setError((err as Error).message);
      setQuotesInReview([]);
    } finally {
      setLoadingInReview(false);
    }
  }, [get]);

  const fetchRevisionDetails = async (quoteId: string): Promise<RevisionDetails | null> => {
    try {
      const response = await get<{ success: boolean; data: RevisionDetails }>(
        `/api/partner/quotes/${quoteId}/revision-details`
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // A API retorna { success: true, data: {...} }
      return response.data?.data || null;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  const updateTimes = async (
    quoteId: string,
    request: UpdateTimesRequest
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await put<{ success: boolean; message: string }>(
        `/api/partner/quotes/${quoteId}/update-times`,
        request
      );

      if (response.error) {
        return { success: false, error: response.error };
      }

      // Recarregar ambas as listas após atualização
      await Promise.all([fetchPendingRevisions(), fetchQuotesInReview()]);

      return { success: true, message: response.data?.message || 'Prazos atualizados com sucesso' };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  useEffect(() => {
    fetchPendingRevisions();
    fetchQuotesInReview();
  }, [fetchPendingRevisions, fetchQuotesInReview]);

  return {
    pendingRevisions,
    quotesInReview,
    loading,
    loadingInReview,
    error,
    fetchPendingRevisions,
    fetchQuotesInReview,
    fetchRevisionDetails,
    updateTimes,
  };
};
