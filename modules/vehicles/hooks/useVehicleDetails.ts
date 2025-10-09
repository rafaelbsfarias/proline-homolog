'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { supabase } from '@/modules/common/services/supabaseClient';

interface VehicleDetailsData {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: string;
  created_at: string;
  fipe_value?: number;
  current_odometer?: number;
  fuel_level?: string;
  estimated_arrival_date?: string;
  preparacao?: boolean;
  comercializacao?: boolean;
}

interface InspectionData {
  id: string;
  inspection_date: string;
  odometer: number;
  fuel_level: string;
  observations: string;
  finalized: boolean;
  services: Array<{
    category: string;
    required: boolean;
    notes: string;
  }>;
  media: Array<{
    storage_path: string;
    uploaded_by: string;
    created_at: string;
  }>;
}

interface VehicleHistoryEntry {
  id: string;
  vehicle_id: string;
  status: string;
  prevision_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface InspectionResponse {
  success: boolean;
  inspection?: InspectionData;
  error?: string;
}

interface VehicleHistoryResponse {
  success: boolean;
  history?: VehicleHistoryEntry[];
  error?: string;
}

export const useVehicleDetails = (
  role: 'client' | 'specialist' | 'admin' | 'partner',
  vehicleId: string
) => {
  const logger = getLogger(`${role}:useVehicleDetails`);
  const { get } = useAuthenticatedFetch();

  const [vehicle, setVehicle] = useState<VehicleDetailsData | null>(null);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistoryEntry[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediaUrls = async (
    media: Array<{ storage_path: string; uploaded_by: string; created_at: string }>
  ) => {
    const urls: Record<string, string> = {};

    for (const mediaItem of media) {
      try {
        const urlResp = await get<{ success: boolean; signedUrl?: string; error?: string }>(
          `/api/${role}/get-media-url?path=${encodeURIComponent(mediaItem.storage_path)}&vehicleId=${vehicleId}`
        );

        if (urlResp.ok && urlResp.data?.success && urlResp.data.signedUrl) {
          urls[mediaItem.storage_path] = urlResp.data.signedUrl;
        } else {
          logger.warn('Failed to get signed URL for media:', {
            storagePath: mediaItem.storage_path.slice(0, 20),
            error: urlResp.data?.error,
          });
        }
      } catch (err) {
        logger.error('Error fetching signed URL:', {
          storagePath: mediaItem.storage_path.slice(0, 20),
          error: err,
        });
      }
    }

    setMediaUrls(urls);
  };

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      if (!role) {
        setError('User role is not defined.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const vehicleResp = await get<{
          success: boolean;
          vehicle?: VehicleDetailsData;
          error?: string;
        }>(`/api/${role}/vehicles/${vehicleId}`);

        logger.info('Vehicle response received', {
          ok: vehicleResp.ok,
          status: vehicleResp.status,
          success: vehicleResp.data?.success,
          hasVehicle: !!vehicleResp.data?.vehicle,
          error: vehicleResp.data?.error,
        });

        if (!vehicleResp.ok) {
          throw new Error(
            vehicleResp.error ||
              `Erro HTTP ${vehicleResp.status}: ${vehicleResp.data?.error || 'Erro desconhecido'}`
          );
        }

        if (!vehicleResp.data?.success) {
          throw new Error(vehicleResp.data?.error || 'Resposta inválida da API');
        }

        setVehicle(vehicleResp.data.vehicle || null);

        const inspectionResp = await get<InspectionResponse>(
          `/api/${role}/vehicle-inspection?vehicleId=${vehicleId}`
        );

        if (inspectionResp.ok && inspectionResp.data?.success) {
          const inspectionData = inspectionResp.data.inspection || null;
          setInspection(inspectionData);

          if (inspectionData?.media && inspectionData.media.length > 0) {
            fetchMediaUrls(inspectionData.media);
          }
        }

        // Buscar histórico do veículo (não falhar se der erro)
        try {
          const historyResp = await get<VehicleHistoryResponse>(
            `/api/${role}/vehicle-history?vehicleId=${vehicleId}`
          );

          if (historyResp.ok && historyResp.data?.success && historyResp.data.history) {
            setVehicleHistory(historyResp.data.history);
          }
        } catch (historyError) {
          // Log mas não falhar a request principal
          logger.warn('Failed to fetch vehicle history:', historyError);
        }
      } catch (err) {
        logger.error('Error fetching vehicle details:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do veículo');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId && role) {
      fetchVehicleDetails();
    }
  }, [vehicleId, get, role]);

  // Realtime: atualizar timeline quando houver INSERT em vehicle_history para este veículo
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
            setVehicleHistory(prev => {
              // evitar duplicação
              if (prev.some(h => h.id === newEntry.id)) return prev;
              const next = [...prev, newEntry];
              // ordenar por created_at asc
              next.sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              return next;
            });
          } catch (err) {
            logger.warn('realtime_payload_parse_error', { err });
          }
        }
      )
      .subscribe(status => {
        logger.info('realtime_sub_status', { channel: 'vehicle_history', status });
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [vehicleId]);

  return { vehicle, inspection, vehicleHistory, mediaUrls, loading, error };
};
