import { useCallback, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';
import type { AnomalyEvidence } from '@/modules/partner/types/checklist';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

const logger = getLogger('hooks:useChecklistAnomalies');

export function useChecklistAnomalies(
  vehicleId?: string,
  inspectionId?: string,
  quoteId?: string | null
) {
  const { get } = useAuthenticatedFetch();
  const [anomalies, setAnomalies] = useState<AnomalyEvidence[]>([{ id: '1', description: '', photos: [] }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!vehicleId || !inspectionId) return;
    setLoading(true);
    setError(null);
    try {
      const url =
        `/api/partner/checklist/load-anomalies?inspection_id=${inspectionId}&vehicle_id=${vehicleId}` +
        (quoteId ? `&quote_id=${quoteId}` : '');
      const res = await get<{ success: boolean; data: AnomalyEvidence[]; error?: string }>(url);
      if (!res.ok || !res.data?.success) throw new Error(res.data?.error || 'Erro ao carregar anomalias');
      const loaded = res.data.data || [];
      setAnomalies(loaded.length > 0 ? loaded : [{ id: '1', description: '', photos: [] }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar anomalias');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, inspectionId, quoteId, get]);

  const save = useCallback(
    async (incoming: AnomalyEvidence[]) => {
      if (!vehicleId || !inspectionId) throw new Error('Veículo ou inspeção não encontrados');

      setSaving(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('inspection_id', inspectionId);
        if (quoteId) formData.append('quote_id', quoteId);
        formData.append('vehicle_id', vehicleId);

        const anomaliesData = incoming.map((anomaly, i) => {
          const photoRefs: string[] = [];
          anomaly.photos.forEach((photo, j) => {
            if (photo instanceof File) {
              const key = `anomaly-${i}-photo-${j}`;
              formData.append(key, photo);
              photoRefs.push(key);
            } else if (typeof photo === 'string') {
              let path = photo;
              if (photo.includes('/storage/v1/object/sign/vehicle-media/')) {
                const parts = photo.split('/storage/v1/object/sign/vehicle-media/');
                if (parts[1]) path = parts[1].split('?')[0];
              } else if (photo.includes('/storage/v1/object/public/vehicle-media/')) {
                const parts = photo.split('/storage/v1/object/public/vehicle-media/');
                if (parts[1]) path = parts[1];
              }
              try { path = decodeURIComponent(path); } catch {}
              photoRefs.push(path);
            }
          });
          return { description: anomaly.description, photos: photoRefs, partRequest: anomaly.partRequest };
        });

        formData.append('anomalies', JSON.stringify(anomaliesData));

        const { data: sessionRes } = await supabase.auth.getSession();
        const accessToken = sessionRes.session?.access_token;
        const resp = await fetch('/api/partner/checklist/save-anomalies', {
          method: 'POST',
          headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' },
          body: formData,
        });
        const body = await resp.json();
        if (!resp.ok || !body.success) throw new Error(body.error || 'Erro ao salvar anomalias');
        setAnomalies(incoming);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erro ao salvar anomalias';
        setError(message);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [vehicleId, inspectionId, quoteId]
  );

  return { anomalies, setAnomalies, load, save, loading, saving, error };
}

