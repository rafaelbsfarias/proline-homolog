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
  current_odometer?: number;
  fuel_level?: string;
  estimated_arrival_date?: string;
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

export function useClientVehicleDetails(vehicleId: string | undefined) {
  const { get } = useAuthenticatedFetch();
  const logger = getLogger('hooks:useClientVehicleDetails');

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
        }>(`/api/client/vehicles/${vehicleId}`);
        if (!vehicleResp.ok || !vehicleResp.data?.success || !vehicleResp.data.vehicle) {
          throw new Error(vehicleResp.data?.error || 'Erro ao carregar veículo');
        }
        if (!active) return;
        setVehicle(vehicleResp.data.vehicle);

        const inspectionResp = await get<InspectionResponse>(
          `/api/client/vehicle-inspection?vehicleId=${vehicleId}`
        );
        if (inspectionResp.ok && inspectionResp.data?.success) {
          const insp = inspectionResp.data.inspection || null;
          if (!active) return;
          setInspection(insp);
          if (insp?.media?.length) {
            console.log(
              `🖼️ [VehicleDetails] Carregando ${insp.media.length} imagens da inspeção...`
            );
            const urls: Record<string, string> = {};
            let successCount = 0;
            let errorCount = 0;

            for (const m of insp.media) {
              try {
                console.log(`  [VehicleDetails] Buscando URL para: ${m.storage_path}`);
                const urlResp = await get<{
                  success: boolean;
                  signedUrl?: string;
                  error?: string;
                  details?: string;
                }>(
                  `/api/client/get-media-url?path=${encodeURIComponent(m.storage_path)}&vehicleId=${vehicleId}`
                );
                if (urlResp.ok && urlResp.data?.success && urlResp.data.signedUrl) {
                  urls[m.storage_path] = urlResp.data.signedUrl;
                  successCount++;
                  console.log(`  ✅ [VehicleDetails] URL gerada para: ${m.storage_path}`);
                } else {
                  errorCount++;
                  console.error(
                    `  ❌ [VehicleDetails] Erro ao gerar URL para ${m.storage_path}:`,
                    urlResp.data?.error || urlResp.data?.details || 'Resposta inválida'
                  );
                }
              } catch (err) {
                errorCount++;
                console.error(
                  `  ❌ [VehicleDetails] Exceção ao buscar URL para ${m.storage_path}:`,
                  err
                );
                logger.warn('Erro ao buscar URL assinada', { path: m.storage_path, err });
              }
            }

            console.log(
              `📊 [VehicleDetails] URLs carregadas: ${successCount}/${insp.media.length} (${errorCount} erros)`
            );
            if (active) setMediaUrls(urls);
          } else {
            console.log('ℹ️ [VehicleDetails] Nenhuma mídia associada a esta inspeção');
            if (active) setMediaUrls({});
          }
        } else {
          if (active) setInspection(null);
        }
      } catch (e) {
        logger.error('Erro ao carregar detalhes do veículo (cliente)', e);
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
