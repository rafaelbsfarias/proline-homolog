'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface DeliveryPendingApproval {
  requestId: string;
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
  };
  address: {
    id: string;
    label: string;
  };
  deliveryDate: string;
  deliveryFee: number;
}

export interface UseDeliveriesPendingReturn {
  deliveries: DeliveryPendingApproval[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDeliveriesPending = (
  onLoadingChange?: (loading: boolean) => void
): UseDeliveriesPendingReturn => {
  const { get } = useAuthenticatedFetch();
  const [deliveries, setDeliveries] = useState<DeliveryPendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      onLoadingChange?.(true);
      setError(null);

      const response = await get<{
        success: boolean;
        deliveries: DeliveryPendingApproval[];
        total: number;
      }>('/api/client/deliveries-pending-approval');

      if (response.ok && response.data?.success) {
        setDeliveries(response.data.deliveries || []);
      } else {
        throw new Error(response.error || 'Erro ao buscar entregas pendentes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar entregas';
      setError(errorMessage);
      setDeliveries([]);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [get, onLoadingChange]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return {
    deliveries,
    loading,
    error,
    refetch: fetchDeliveries,
  };
};
