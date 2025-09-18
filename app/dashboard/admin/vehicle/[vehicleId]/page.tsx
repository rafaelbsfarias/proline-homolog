'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { translateFuelLevel, VEHICLE_CONSTANTS } from '@/app/constants/messages';
import ImageViewerModal from '@/modules/client/components/ImageViewerModal/ImageViewerModal';

interface VehicleDetails {
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

const AdminVehicleDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.vehicleId as string;
  const logger = getLogger('admin:VehicleDetailsPage');
  const { get } = useAuthenticatedFetch();

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const fetchMediaUrls = async (
    media: Array<{ storage_path: string; uploaded_by: string; created_at: string }>
  ) => {
    const urls: Record<string, string> = {};
    for (const mediaItem of media) {
      try {
        const urlResp = await get<{ success: boolean; signedUrl?: string; error?: string }>(
          `/api/admin/get-media-url?path=${encodeURIComponent(mediaItem.storage_path)}&vehicleId=${vehicleId}`
        );
        if (urlResp.ok && urlResp.data?.success && urlResp.data.signedUrl) {
          urls[mediaItem.storage_path] = urlResp.data.signedUrl;
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
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados básicos do veículo (admin)
        const vehicleResp = await get<{
          success: boolean;
          vehicle?: VehicleDetails;
          error?: string;
        }>(`/api/admin/vehicles/${vehicleId}`);

        if (!vehicleResp.ok || !vehicleResp.data?.success) {
          throw new Error(vehicleResp.data?.error || 'Erro ao carregar veículo');
        }

        setVehicle(vehicleResp.data.vehicle || null);

        // Buscar dados da inspeção/checklist mais recente (admin)
        const inspectionResp = await get<InspectionResponse>(
          `/api/admin/vehicle-inspection?vehicleId=${vehicleId}`
        );

        if (inspectionResp.ok && inspectionResp.data?.success) {
          const inspectionData = inspectionResp.data.inspection || null;
          setInspection(inspectionData);

          // Buscar URLs assinadas das imagens se houver mídia
          if (inspectionData?.media && inspectionData.media.length > 0) {
            fetchMediaUrls(inspectionData.media);
          }
        }
      } catch (err) {
        logger.error('Error fetching vehicle details (admin):', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do veículo');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchData();
    }
  }, [vehicleId, get]);

  const getStatusLabel = (status: string) => {
    return (
      VEHICLE_CONSTANTS.VEHICLE_STATUS[status as keyof typeof VEHICLE_CONSTANTS.VEHICLE_STATUS] ||
      status
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
          }}
        >
          <Loading />
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <h1 style={{ color: '#e74c3c', marginBottom: '16px' }}>Erro</h1>
            <p>{error || 'Veículo não encontrado'}</p>
            <button
              onClick={() => router.back()}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Voltar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '16px' }}>
          {vehicle.brand} {vehicle.model} ({vehicle.year}) — {vehicle.plate}
        </h1>

        <section style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h2>Informações do Veículo</h2>
          <p>
            <strong>Status:</strong> {getStatusLabel(vehicle.status)}
          </p>
          <p>
            <strong>Cor:</strong> {vehicle.color || 'N/A'}
          </p>
          <p>
            <strong>Odômetro atual:</strong> {vehicle.current_odometer ?? 'N/A'}
          </p>
          <p>
            <strong>Nível de combustível:</strong> {translateFuelLevel(vehicle.fuel_level || '')}
          </p>
          <p>
            <strong>Previsão de chegada:</strong> {vehicle.estimated_arrival_date || 'N/A'}
          </p>
          <p>
            <strong>FIPE:</strong>{' '}
            {vehicle.fipe_value
              ? new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(vehicle.fipe_value)
              : 'N/A'}
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
          <h2>Inspeção/Checklist</h2>
          {!inspection ? (
            <p>Nenhuma inspeção encontrada</p>
          ) : (
            <div>
              <p>
                <strong>Data:</strong>{' '}
                {new Date(inspection.inspection_date).toLocaleDateString('pt-BR')}
              </p>
              <p>
                <strong>Odômetro:</strong> {inspection.odometer}
              </p>
              <p>
                <strong>Combustível:</strong> {translateFuelLevel(inspection.fuel_level)}
              </p>
              <p>
                <strong>Observações:</strong> {inspection.observations || '—'}
              </p>
              <p>
                <strong>Status:</strong> {inspection.finalized ? 'Finalizada' : 'Em andamento'}
              </p>

              {inspection.services?.length ? (
                <div>
                  <h3>Serviços</h3>
                  <ul>
                    {inspection.services.map((s, idx) => (
                      <li key={idx}>
                        {s.category} — {s.required ? 'Obrigatório' : 'Opcional'} — {s.notes || '—'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {inspection.media?.length ? (
                <div>
                  <h3>Mídias</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {inspection.media.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => setIsImageViewerOpen(true)}
                        style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6 }}
                      >
                        Ver imagem {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </main>

      {isImageViewerOpen && inspection?.media && (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          images={inspection.media}
          mediaUrls={mediaUrls}
          vehiclePlate={vehicle.plate}
        />
      )}
    </div>
  );
};

export default AdminVehicleDetailsPage;
