import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface PendingApprovalGroup {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
  original_date?: string | null;
  proposed_by?: 'client' | 'admin';
}

export const usePendingApprovalVehicles = () => {
  const { get, post } = useAuthenticatedFetch();
  const [groups, setGroups] = useState<PendingApprovalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ groups: PendingApprovalGroup[] }>(
        '/api/client/collection-summary'
      );
      if (response.ok && response.data) {
        setGroups(response.data.groups || []);
      } else {
        throw new Error(response.error || 'Falha ao buscar propostas de coleta.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleApprove = async (addressId: string) => {
    const response = await post('/api/client/collection-approve', { addressId });
    await fetchGroups();
    return response.ok;
  };

  const handleReject = async (addressId: string, reason?: string) => {
    const response = await post('/api/client/collection-reject', { addressId, reason }); // Endpoint hipotético
    await fetchGroups();
    return response.ok;
  };

  const handleReschedule = async (addressId: string, newDate: string) => {
    const response = await post('/api/client/collection-reschedule', {
      addressId,
      new_date: newDate,
    });
    await fetchGroups();
    return response.ok;
  };

  return { groups, loading, error, fetchGroups, handleApprove, handleReject, handleReschedule };
};
