'use client';

import { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface UseIndividualApprovalReturn {
  acceptProposal: (addressId: string) => Promise<boolean>;
  rejectProposal: (addressId: string) => Promise<boolean>;
  accepting: boolean;
  rejecting: boolean;
  error: string | null;
}

export const useIndividualApproval = (): UseIndividualApprovalReturn => {
  const { post } = useAuthenticatedFetch();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptProposal = async (addressId: string): Promise<boolean> => {
    try {
      setAccepting(true);
      setError(null);

      const resp = await post('/api/client/collection-accept-proposal', { addressId });
      if (!resp.ok) {
        const errorData = resp.data as { error?: string };
        throw new Error(errorData?.error || 'Erro ao aceitar proposta');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aceitar proposta';
      setError(errorMessage);
      return false;
    } finally {
      setAccepting(false);
    }
  };

  const rejectProposal = async (addressId: string): Promise<boolean> => {
    try {
      setRejecting(true);
      setError(null);

      const resp = await post('/api/client/collection-reject-proposal', { addressId });
      if (!resp.ok) {
        const errorData = resp.data as { error?: string };
        throw new Error(errorData?.error || 'Erro ao rejeitar proposta');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao rejeitar proposta';
      setError(errorMessage);
      return false;
    } finally {
      setRejecting(false);
    }
  };

  return {
    acceptProposal,
    rejectProposal,
    accepting,
    rejecting,
    error,
  };
};
