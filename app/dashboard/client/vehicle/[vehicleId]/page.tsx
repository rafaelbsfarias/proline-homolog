'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { Loading } from '@/modules/common/components/Loading/Loading';

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
  services?: Array<{
    category: string;
    required: boolean;
    notes: string;
  }>;
  error?: string;
}

const VehicleDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.vehicleId as string;
  const logger = getLogger('client:VehicleDetailsPage');
  const { get } = useAuthenticatedFetch();

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);

        // Buscar dados básicos do veículo
        const vehicleResp = await get<{
          success: boolean;
          vehicle?: VehicleDetails;
          error?: string;
        }>(`/api/client/vehicles/${vehicleId}`);

        if (!vehicleResp.ok || !vehicleResp.data?.success) {
          throw new Error(vehicleResp.data?.error || 'Erro ao carregar veículo');
        }

        setVehicle(vehicleResp.data.vehicle || null);

        // Buscar dados da inspeção/checklist mais recente
        const inspectionResp = await get<InspectionResponse>(
          `/api/specialist/get-checklist?vehicleId=${vehicleId}`
        );

        if (inspectionResp.ok && inspectionResp.data?.success) {
          setInspection(inspectionResp.data.inspection || null);
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

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      aguardando_chegada: 'Aguardando Chegada',
      chegada_confirmada: 'Chegada Confirmada',
      em_analise: 'Em Análise',
      analise_finalizada: 'Análise Finalizada',
      definir_opcao_de_coleta: 'Definir Opção de Coleta',
      active: 'Ativo',
      ativo: 'Ativo',
      inativo: 'Inativo',
    };
    return statusMap[status] || status;
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
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              background: '#ecf0f1',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            ← Voltar
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Detalhes do Veículo
          </h1>
          <p style={{ color: '#666', fontSize: '1.15rem' }}>
            {vehicle.brand} {vehicle.model} • {vehicle.plate}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
          {/* Informações Básicas */}
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
              Informações Básicas
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Placa:</span>
                <span style={{ fontFamily: 'monospace' }}>{vehicle.plate}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Marca:</span>
                <span>{vehicle.brand}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Modelo:</span>
                <span>
                  {vehicle.model} ({vehicle.year})
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Cor:</span>
                <span>{vehicle.color || 'N/A'}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Status:</span>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    background: '#e8f5e8',
                    color: '#2e7d32',
                  }}
                >
                  {getStatusLabel(vehicle.status)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Valor FIPE:</span>
                <span>{formatCurrency(vehicle.fipe_value)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>KM Atual:</span>
                <span>{vehicle.current_odometer || 'N/A'}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Nível de Combustível:</span>
                <span>{vehicle.fuel_level || 'N/A'}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Cadastrado em:</span>
                <span>{formatDate(vehicle.created_at)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: 500 }}>Previsão de Chegada:</span>
                <span>{formatDate(vehicle.estimated_arrival_date)}</span>
              </div>
            </div>
          </div>

          {/* Timeline e Status */}
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
              Timeline do Veículo
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#3498db',
                  }}
                ></div>
                <div>
                  <div style={{ fontWeight: 500 }}>Veículo Cadastrado</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {formatDate(vehicle.created_at)}
                  </div>
                </div>
              </div>

              {vehicle.estimated_arrival_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#f39c12',
                    }}
                  ></div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Previsão de Chegada</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {formatDate(vehicle.estimated_arrival_date)}
                    </div>
                  </div>
                </div>
              )}

              {inspection && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#e74c3c',
                    }}
                  ></div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Análise Iniciada</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {formatDate(inspection.inspection_date)}
                    </div>
                  </div>
                </div>
              )}

              {inspection?.finalized && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#27ae60',
                    }}
                  ></div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Análise Finalizada</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {formatDate(inspection.inspection_date)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Serviços Necessários */}
          {inspection?.services && inspection.services.length > 0 && (
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: '24px',
                gridColumn: '1 / -1',
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
                Serviços Necessários
              </h2>
              <div
                style={{
                  display: 'grid',
                  gap: '16px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                }}
              >
                {inspection.services.map((service, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      background: service.required ? '#fff5f5' : '#f8f9fa',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                        {service.category.replace('_', ' ')}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          background: service.required ? '#e74c3c' : '#95a5a6',
                          color: 'white',
                        }}
                      >
                        {service.required ? 'Necessário' : 'Opcional'}
                      </span>
                    </div>
                    {service.notes && (
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '8px' }}>
                        <strong>Observações:</strong> {service.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fotos do Veículo */}
          {inspection?.media && inspection.media.length > 0 && (
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: '24px',
                gridColumn: '1 / -1',
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
                Fotos do Veículo
              </h2>
              <div
                style={{
                  display: 'grid',
                  gap: '16px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                }}
              >
                {inspection.media.map((media, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${media.storage_path}`}
                      alt={`Foto ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                      {formatDate(media.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações da Inspeção */}
          {inspection?.observations && (
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: '24px',
                gridColumn: '1 / -1',
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
                Observações do Especialista
              </h2>
              <div
                style={{
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db',
                }}
              >
                {inspection.observations}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VehicleDetailsPage;
