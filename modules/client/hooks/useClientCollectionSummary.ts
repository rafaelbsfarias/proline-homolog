import { useCallback, useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { CollectionGroup } from '@/modules/client/components/Collection/types';

type UseClientCollectionSummaryOptions = {
  onLoadingChange?: (loading: boolean) => void;
};

export function useClientCollectionSummary(options?: UseClientCollectionSummaryOptions) {
  const { get, post } = useAuthenticatedFetch();

  const [loading, setLoading] = useState<boolean>(true);
  const { onLoadingChange } = options || {};
  const [approvalTotal, setApprovalTotal] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [groups, setGroups] = useState<CollectionGroup[]>([]);
  const [highlightDates, setHighlightDates] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    onLoadingChange?.(true);
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
      onLoadingChange?.(false);
    }
  }, [get, onLoadingChange]);

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
