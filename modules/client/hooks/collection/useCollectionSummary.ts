'use client';

import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface CollectionGroup {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null; // ISO
  original_date: string | null; // ISO
  proposed_by?: 'client' | 'admin'; // Quem propôs a data
  requires_approval?: boolean; // Se precisa de aprovação individual
}

export interface CollectionSummaryData {
  approvalTotal: number;
  count: number;
  groups: CollectionGroup[];
  highlightDates: string[];
}

export interface UseCollectionSummaryReturn {
  data: CollectionSummaryData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCollectionSummary = (
  onLoadingChange?: (loading: boolean) => void
): UseCollectionSummaryReturn => {
  const { get } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CollectionSummaryData>({
    approvalTotal: 0,
    count: 0,
    groups: [],
    highlightDates: [],
  });

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      onLoadingChange?.(true);

      const resp = await get<{
        success: boolean;
        approvalTotal?: number;
        count?: number;
        dates?: string[];
        groups?: CollectionGroup[];
        error?: string;
      }>('/api/client/collection-summary');

      if (resp.ok && resp.data?.success) {
        setData({
          approvalTotal: Number(resp.data.approvalTotal || 0),
          count: Number(resp.data.count || 0),
          highlightDates: Array.isArray(resp.data.dates) ? resp.data.dates : [],
          groups: Array.isArray(resp.data.groups) ? resp.data.groups : [],
        });
      } else {
        setError(resp.data?.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError(`Erro inesperado ao carregar dados: ${err}`);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: loadSummary,
  };
};
