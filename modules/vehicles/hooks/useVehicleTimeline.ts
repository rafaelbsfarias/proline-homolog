'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import type { TimelineEvent } from '@/modules/vehicles/timeline/types';

export function useVehicleTimeline(vehicleId?: string) {
  const { get } = useAuthenticatedFetch();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!vehicleId) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await get<{ success: boolean; events?: TimelineEvent[]; error?: string }>(
          `/api/vehicle-timeline?vehicleId=${vehicleId}`
        );
        if (!resp.ok || !resp.data?.success) {
          throw new Error(resp.data?.error || `Erro ao carregar timeline (${resp.status})`);
        }
        if (!active) return;
        setEvents(resp.data.events || []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Erro ao carregar timeline');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [vehicleId, get]);

  return { events, loading, error } as const;
}
