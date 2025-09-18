'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';

export type VehicleDetails = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: string;
  created_at: string;
  fipe_value?: number;
  current_odometer?: number | null;
  fuel_level?: string | null;
  estimated_arrival_date?: string | null;
};

export type InspectionData = {
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
};

type InspectionResponse = {
  success: boolean;
  inspection?: InspectionData;
  error?: string;
};

export function useAdminVehicleDetails(vehicleId: string | undefined) {
  const { get } = useAuthenticatedFetch();
  const logger = getLogger('hooks:useAdminVehicleDetails');

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      if (!vehicleId) return;
      setLoading(true);
      setError(null);
      try {
        const vehicleResp = await get<{
          success: boolean;
          vehicle?: VehicleDetails;
          error?: string;
        }>(`/api/admin/vehicles/${vehicleId}`);
        if (!vehicleResp.ok || !vehicleResp.data?.success || !vehicleResp.data.vehicle) {
          throw new Error(vehicleResp.data?.error || 'Erro ao carregar veículo');
        }
        if (!active) return;
        setVehicle(vehicleResp.data.vehicle);

        const inspectionResp = await get<InspectionResponse>(
          `/api/admin/vehicle-inspection?vehicleId=${vehicleId}`
        );
        if (inspectionResp.ok && inspectionResp.data?.success) {
          const insp = inspectionResp.data.inspection || null;
          if (!active) return;
          setInspection(insp);
          if (insp?.media?.length) {
            const urls: Record<string, string> = {};
            for (const m of insp.media) {
              try {
                const urlResp = await get<{
                  success: boolean;
                  signedUrl?: string;
                  error?: string;
                }>(
                  `/api/admin/get-media-url?path=${encodeURIComponent(m.storage_path)}&vehicleId=${vehicleId}`
                );
                if (urlResp.ok && urlResp.data?.success && urlResp.data.signedUrl) {
                  urls[m.storage_path] = urlResp.data.signedUrl;
                }
              } catch (err) {
                logger.warn('Erro ao buscar URL assinada', { path: m.storage_path, err });
              }
            }
            if (active) setMediaUrls(urls);
          } else {
            if (active) setMediaUrls({});
          }
        } else {
          if (active) setInspection(null);
        }
      } catch (e) {
        logger.error('Erro ao carregar detalhes do veículo (admin)', e);
        if (active) setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [vehicleId, get]);

  return { vehicle, inspection, mediaUrls, loading, error } as const;
}
