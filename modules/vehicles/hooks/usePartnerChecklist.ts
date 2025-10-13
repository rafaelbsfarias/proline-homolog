'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export type ChecklistType = 'mechanics' | 'anomalies';

interface ChecklistItem {
  id: string;
  item_key: string;
  item_status: string;
  item_notes: string | null;
  evidences: Array<{
    id: string;
    media_url: string;
    description: string;
  }>;
}

interface Anomaly {
  id: string;
  description: string;
  photos: string[];
  severity: string;
  status: string;
  created_at: string;
}

interface MechanicsChecklistData {
  type: 'mechanics';
  checklist: {
    id: string;
    vehicle_id: string;
    partner: {
      id: string;
      name: string;
      type: string;
    };
    status: string;
    notes: string;
    created_at: string;
  };
  itemsByCategory: Record<string, ChecklistItem[]>;
  stats: {
    totalItems: number;
  };
}

interface AnomaliesChecklistData {
  type: 'anomalies';
  checklist: {
    vehicle_id: string;
    partner: {
      id: string;
      name: string;
      type: string;
    };
  };
  anomalies: Anomaly[];
  stats: {
    totalAnomalies: number;
  };
}

export type PartnerChecklistData = MechanicsChecklistData | AnomaliesChecklistData;

export function usePartnerChecklist(vehicleId?: string) {
  const { get } = useAuthenticatedFetch();
  const [data, setData] = useState<PartnerChecklistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;

    let active = true;

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const response = await get<PartnerChecklistData>(
          `/api/partner-checklist?vehicleId=${vehicleId}`
        );

        if (!response.ok) {
          const errorData = response as unknown as { data?: { error?: string }; error?: string };
          const errorMessage =
            errorData.data?.error || errorData.error || 'Erro ao buscar checklist';
          throw new Error(errorMessage);
        }

        if (active && response.data) {
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      active = false;
    };
  }, [vehicleId, get]);

  return { data, loading, error };
}
