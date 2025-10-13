'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';

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

interface InspectionResponse {
  success: boolean;
  inspection?: InspectionData;
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

  return { vehicle, inspection, mediaUrls, loading, error };
};
