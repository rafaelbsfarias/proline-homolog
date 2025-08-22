import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface CollectionForApproval {
  id: string;
  address: string;
  fee: number;
  date: string;
  vehicles: { id: string; plate: string; brand: string; model: string }[];
}

export const useCollectionApprovals = () => {
  const { get } = useAuthenticatedFetch();
  const [collections, setCollections] = useState<CollectionForApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<{ success: boolean, collections: CollectionForApproval[] }>('/api/client/collection-approvals');
      if (res.ok && res.data?.success) {
        setCollections(res.data.collections || []);
      } else {
        setError(res.error || 'Failed to fetch collections for approval.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
  };
};
