'use client';

import { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface UseIndividualApprovalReturn {
  acceptProposal: (addressId: string, proposedBy?: 'client' | 'admin') => Promise<boolean>;
  rejectProposal: (addressId: string, proposedBy?: 'client' | 'admin') => Promise<boolean>;
  accepting: boolean;
  rejecting: boolean;
  error: string | null;
  canAcceptProposal: (proposedBy?: 'client' | 'admin') => boolean;
  canRejectProposal: (proposedBy?: 'client' | 'admin') => boolean;
}

export const useIndividualApproval = (): UseIndividualApprovalReturn => {
  const { post } = useAuthenticatedFetch();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validação: cliente só pode aceitar propostas do admin
  const canAcceptProposal = (proposedBy?: 'client' | 'admin'): boolean => {
    return proposedBy === 'admin';
  };

  // Validação: cliente só pode rejeitar propostas do admin
  const canRejectProposal = (proposedBy?: 'client' | 'admin'): boolean => {
    return proposedBy === 'admin';
  };

  const acceptProposal = async (
    addressId: string,
    proposedBy?: 'client' | 'admin'
  ): Promise<boolean> => {
    // Validação antes de tentar aceitar
    if (!canAcceptProposal(proposedBy)) {
      setError('Você só pode aceitar propostas sugeridas pelo administrador');
      return false;
    }

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

  const rejectProposal = async (
    addressId: string,
    proposedBy?: 'client' | 'admin'
  ): Promise<boolean> => {
    // Validação antes de tentar rejeitar
    if (!canRejectProposal(proposedBy)) {
      setError('Você só pode rejeitar propostas sugeridas pelo administrador');
      return false;
    }

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
    canAcceptProposal,
    canRejectProposal,
  };
};
