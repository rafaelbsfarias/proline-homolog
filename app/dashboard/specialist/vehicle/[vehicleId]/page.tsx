'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import VehicleDetails from '@/modules/vehicles/components/VehicleDetails';

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

const SpecialistVehicleDetailsPage = () => {
  const params = useParams();
  const vehicleId = params.vehicleId as string;
  const logger = getLogger('specialist:VehicleDetailsPage');
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
          `/api/specialist/get-media-url?path=${encodeURIComponent(mediaItem.storage_path)}&vehicleId=${vehicleId}`
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
      try {
        setLoading(true);

        const vehicleResp = await get<{
          success: boolean;
          vehicle?: VehicleDetailsData;
          error?: string;
        }>(`/api/specialist/vehicles/${vehicleId}`);

        if (!vehicleResp.ok || !vehicleResp.data?.success) {
          throw new Error(vehicleResp.data?.error || 'Erro ao carregar veículo');
        }

        setVehicle(vehicleResp.data.vehicle || null);

        const inspectionResp = await get<InspectionResponse>(
          `/api/specialist/vehicle-inspection?vehicleId=${vehicleId}`
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

    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId, get]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <VehicleDetails
        vehicle={vehicle}
        inspection={inspection}
        mediaUrls={mediaUrls}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default SpecialistVehicleDetailsPage;
