'use client';

import { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { CollectionGroup } from '@/modules/client/components/Collection/types';

export interface UseCollectionApprovalReturn {
  approveAllCollections: (groups: CollectionGroup[]) => Promise<boolean>;
  approving: boolean;
  error: string | null;
}

export const useCollectionApproval = (): UseCollectionApprovalReturn => {
  const { post } = useAuthenticatedFetch();
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveAllCollections = async (groups: CollectionGroup[]): Promise<boolean> => {
    if (!groups.length) return false;

    try {
      setApproving(true);
      setError(null);

      // Aprova por endereço
      for (const group of groups) {
        const resp = await post('/api/client/collection-approve', { addressId: group.addressId });
        if (!resp.ok) {
          throw new Error(`Erro ao aprovar coleta para ${group.address}`);
        }
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aprovar coletas';
      setError(errorMessage);
      return false;
    } finally {
      setApproving(false);
    }
  };

  return {
    approveAllCollections,
    approving,
    error,
  };
};
