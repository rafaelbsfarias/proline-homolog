import { useCallback, useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export type CollectionGroup = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null; // ISO
  original_date?: string | null;
  proposed_by?: 'client' | 'admin';
};

export function useClientCollectionSummary() {
  const { get, post } = useAuthenticatedFetch();

  const [loading, setLoading] = useState<boolean>(true);
  const [approvalTotal, setApprovalTotal] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [groups, setGroups] = useState<CollectionGroup[]>([]);
  const [highlightDates, setHighlightDates] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await get<{
        success: boolean;
        approvalTotal?: number;
        count?: number;
        dates?: string[];
        groups?: CollectionGroup[];
        error?: string;
      }>('/api/client/collection-summary');
      if (resp.ok && resp.data?.success) {
        setApprovalTotal(Number(resp.data.approvalTotal || 0));
        setCount(Number(resp.data.count || 0));
        setHighlightDates(Array.isArray(resp.data.dates) ? resp.data.dates : []);
        setGroups(Array.isArray(resp.data.groups) ? resp.data.groups : []);
      }
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    reload();
  }, [reload]);

  const approveAll = useCallback(
    async (targetGroups?: CollectionGroup[]) => {
      const list = targetGroups ?? groups;
      if (!list.length) return true;
      for (const g of list) {
        const r = await post('/api/client/collection-approve', { addressId: g.addressId });
        if (!r.ok) return false;
      }
      await reload();
      return true;
    },
    [groups, post, reload]
  );

  const reschedule = useCallback(
    async (addressId: string, newDateIso: string) => {
      const resp = await post('/api/client/collection-reschedule', {
        addressId,
        new_date: newDateIso,
      });
      if (resp.ok) await reload();
      return resp.ok;
    },
    [post, reload]
  );

  return {
    loading,
    approvalTotal,
    count,
    groups,
    highlightDates,
    reload,
    approveAll,
    reschedule,
  } as const;
}
