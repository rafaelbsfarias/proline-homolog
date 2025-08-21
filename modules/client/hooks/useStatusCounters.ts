import { useMemo } from 'react';
import type { Vehicle } from '@/modules/client/types';
import { statusOrder } from '@/modules/client/utils/status';

export function useStatusCounters(vehicles: Vehicle[]) {
  const statusOptions = useMemo(() => {
    return Array.from(new Set((vehicles || []).map(v => (v.status || '').trim()).filter(Boolean)));
  }, [vehicles]);

  const statusCounts = useMemo(() => {
    return (vehicles || []).reduce<Record<string, number>>((acc, v) => {
      const key = (v.status || '').trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [vehicles]);

  const sorter = (a: [string, number], b: [string, number]) => {
    const [sa] = a; const [sb] = b;
    const ra = statusOrder(sa);
    const rb = statusOrder(sb);
    if (ra !== rb) return ra - rb;
    return sa.localeCompare(sb);
  };

  return { statusOptions, statusCounts, sorter };
}

