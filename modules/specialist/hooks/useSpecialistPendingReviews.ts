import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '../../common/hooks/useAuthenticatedFetch';

interface PendingReview {
  quote_id: string;
  quote_number: string;
  client_name: string;
  partner_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  updated_at: string;
  partner_comments: string | null;
  last_revision_comments: string | null;
  items_count: number;
  total_value: number;
  waiting_days: number;
  revision_count: number;
}

interface UsePendingReviewsReturn {
  pendingReviews: PendingReview[];
  loading: boolean;
  error: string | null;
  fetchPendingReviews: () => Promise<void>;
}

export function useSpecialistPendingReviews(): UsePendingReviewsReturn {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchPendingReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch.get<{ success: boolean; data: PendingReview[] }>(
        '/api/specialist/quotes/pending-review'
      );

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setPendingReviews(response.data.data);
      } else {
        setPendingReviews([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPendingReviews([]);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch.get<{ success: boolean; data: PendingReview[] }>(
          '/api/specialist/quotes/pending-review'
        );

        if (isMounted) {
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            setPendingReviews(response.data.data);
          } else {
            setPendingReviews([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
          setPendingReviews([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    pendingReviews,
    loading,
    error,
    fetchPendingReviews,
  };
}
