'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

export interface VehicleHistoryEntry {
  id: string;
  vehicle_id: string;
  status: string;
  prevision_date: string | null;
  end_date: string | null;
  created_at: string;
}

export function useVehicleHistory(
  role: 'client' | 'specialist' | 'admin' | 'partner',
  vehicleId?: string
) {
  const logger = getLogger(`${role}:useVehicleHistory`);
  const { get } = useAuthenticatedFetch();

  const [history, setHistory] = useState<VehicleHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!vehicleId) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await get<{
          success: boolean;
          history?: VehicleHistoryEntry[];
          error?: string;
        }>(`/api/${role}/vehicle-history?vehicleId=${vehicleId}`);
        if (!resp.ok || !resp.data?.success) {
          throw new Error(resp.data?.error || `Erro ao buscar histórico (${resp.status})`);
        }
        if (!active) return;
        const rows = resp.data.history || [];
        rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setHistory(rows);
      } catch (e) {
        logger.warn('history_load_failed', { e });
        if (active) setError(e instanceof Error ? e.message : 'Erro ao carregar histórico');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [vehicleId, get, role]);

  useEffect(() => {
    if (!vehicleId) return;
    const channel = supabase
      .channel(`vehicle_history:${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_history',
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        payload => {
          try {
            const newEntry = payload.new as unknown as VehicleHistoryEntry;
            if (!newEntry?.id) return;
            setHistory(prev => {
              if (prev.some(h => h.id === newEntry.id)) return prev;
              const next = [...prev, newEntry];
              next.sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              return next;
            });
          } catch (err) {
            logger.warn('realtime_parse_error', { err });
          }
        }
      )
      .subscribe(s => logger.info('realtime_sub_status', { s }));

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [vehicleId, role]);

  return { history, loading, error } as const;
}
