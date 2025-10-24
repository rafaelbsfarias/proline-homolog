'use client';

import { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface UseDeliveryApprovalReturn {
  approveDelivery: (requestId: string) => Promise<boolean>;
  rejectDelivery: (requestId: string) => Promise<boolean>;
  processing: boolean;
  error: string | null;
}

export const useDeliveryApproval = (): UseDeliveryApprovalReturn => {
  const { post } = useAuthenticatedFetch();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveDelivery = async (requestId: string): Promise<boolean> => {
    try {
      setProcessing(true);
      setError(null);

      const resp = await post('/api/client/delivery-approve', { requestId });
      if (!resp.ok) {
        throw new Error(resp.error || 'Erro ao aprovar entrega');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aprovar entrega';
      setError(errorMessage);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const rejectDelivery = async (requestId: string): Promise<boolean> => {
    try {
      setProcessing(true);
      setError(null);

      const resp = await post('/api/client/delivery-reject', { requestId });
      if (!resp.ok) {
        throw new Error(resp.error || 'Erro ao rejeitar entrega');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao rejeitar entrega';
      setError(errorMessage);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return {
    approveDelivery,
    rejectDelivery,
    processing,
    error,
  };
};
