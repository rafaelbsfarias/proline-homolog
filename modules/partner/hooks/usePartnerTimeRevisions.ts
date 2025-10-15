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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await get<PendingRevision[]>('/api/partner/quotes/pending-time-revisions');

      if (response.error) {
        throw new Error(response.error);
      }

      setPendingRevisions(response.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchRevisionDetails = async (quoteId: string): Promise<RevisionDetails | null> => {
    try {
      const response = await get<RevisionDetails>(
        `/api/partner/quotes/${quoteId}/revision-details`
      );

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data || null;
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

      // Recarregar lista de revisões pendentes após atualização
      await fetchPendingRevisions();

      return { success: true, message: response.data?.message || 'Prazos atualizados com sucesso' };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  useEffect(() => {
    fetchPendingRevisions();
  }, [fetchPendingRevisions]);

  return {
    pendingRevisions,
    loading,
    error,
    fetchPendingRevisions,
    fetchRevisionDetails,
    updateTimes,
  };
};
