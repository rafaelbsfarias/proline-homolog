'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export type PartnerEvidence = {
  item_key: string;
  label: string;
  category: string;
  url: string;
};

export function usePartnerEvidences(vehicleId?: string, inspectionId?: string) {
  const { get } = useAuthenticatedFetch();
  const [data, setData] = useState<PartnerEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!vehicleId || !inspectionId) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await get<{ success: boolean; evidences?: PartnerEvidence[]; error?: string }>(
          `/api/vehicle-partner-evidences?vehicle_id=${vehicleId}&inspection_id=${inspectionId}`
        );
        if (!resp.ok || !resp.data?.success) {
          throw new Error(resp.data?.error || `Erro ao carregar evidências (${resp.status})`);
        }
        if (!active) return;
        setData(resp.data.evidences || []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Erro ao carregar evidências');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [vehicleId, inspectionId, get]);

  const grouped = useMemo(() => {
    return data.reduce(
      (acc, ev) => {
        if (!acc[ev.category]) acc[ev.category] = [];
        acc[ev.category].push(ev);
        return acc;
      },
      {} as Record<string, PartnerEvidence[]>
    );
  }, [data]);

  return { evidences: data, grouped, loading, error } as const;
}
