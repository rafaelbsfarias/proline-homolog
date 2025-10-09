'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/modules/common/components/Loading/Loading';
import {
  translateFuelLevel,
  VEHICLE_CONSTANTS,
  translateServiceCategory,
} from '@/app/constants/messages';
import { formatDateBR } from '@/modules/client/utils/date';
import ImageViewerModal from '@/modules/client/components/ImageViewerModal';

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

interface VehicleHistoryEntry {
  id: string;
  vehicle_id: string;
  status: string;
  prevision_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface VehicleDetailsProps {
  vehicle: VehicleDetails | null;
  inspection: InspectionData | null;
  vehicleHistory: VehicleHistoryEntry[];
  mediaUrls: Record<string, string>;
  loading: boolean;
  error: string | null;
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  inspection,
  vehicleHistory,
  mediaUrls,
  loading,
  error,
}) => {
  const router = useRouter();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusLabel = (status: string) => {
    return (
      VEHICLE_CONSTANTS.VEHICLE_STATUS[status as keyof typeof VEHICLE_CONSTANTS.VEHICLE_STATUS] ||
      status
    );
  };

  // Construir timeline unificada (itens estáticos + histórico do DB)
  const timelineItems = useMemo(() => {
    type Item = { id: string; label: string; date: string; color: string };
    const items: Item[] = [];

    const colorFor = (label: string) => {
      if (label.includes('Orçament')) return '#f39c12';
      if (label.includes('Finalizada')) return '#27ae60';
      if (label.includes('Iniciad')) return '#3498db';
      return '#9b59b6';
    };

    if (vehicle?.created_at) {
      items.push({
        id: `static-created-${vehicle.id}`,
        label: 'Veículo Cadastrado',
        date: vehicle.created_at,
        color: '#3498db',
      });
    }

    if (vehicle?.estimated_arrival_date) {
      items.push({
        id: `static-prevision-${vehicle.id}`,
        label: 'Previsão de Chegada',
        date: vehicle.estimated_arrival_date,
        color: '#f39c12',
      });
    }

    if (inspection?.inspection_date) {
      items.push({
        id: `static-analysis-started-${inspection.id}`,
        label: 'Análise Iniciada',
        date: inspection.inspection_date,
        color: '#e74c3c',
      });

      if (inspection.finalized) {
        items.push({
          id: `static-analysis-finished-${inspection.id}`,
          label: 'Análise Finalizada',
          date: inspection.inspection_date,
          color: '#27ae60',
        });
      }
    }

    for (const h of vehicleHistory || []) {
      if (!h?.created_at) continue;
      items.push({
        id: `vh-${h.id}`,
        label: h.status,
        date: h.created_at,
        color: colorFor(h.status),
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [vehicle, inspection, vehicleHistory]);

  if (loading) {
    return (
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
    );
  }

  if (error || !vehicle) {
    return (
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
    );
  }

  // (hook moved above early returns to respect Rules of Hooks)

  return (
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: '#333' }}>
              Informações Básicas
            </h2>
            {inspection?.media && inspection.media.length > 0 && (
              <button
                onClick={() => setIsImageViewerOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: '#002E4C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#001F36';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = '#002E4C';
                }}
              >
                Ver Evidências ({inspection.media.length})
              </button>
            )}
          </div>
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
              <span>{translateFuelLevel(vehicle.fuel_level)}</span>
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
              <span>{formatDateBR(vehicle.created_at)}</span>
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
              <span>{formatDateBR(vehicle.estimated_arrival_date)}</span>
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
            {timelineItems.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: item.color,
                  }}
                ></div>
                <div>
                  <div style={{ fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>{formatDate(item.date)}</div>
                </div>
              </div>
            ))}
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
                      {translateServiceCategory(service.category)}
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
                    src={
                      mediaUrls[media.storage_path] ||
                      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${media.storage_path}`
                    }
                    alt={`Foto ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                    onError={e => {
                      // Fallback para URL pública se a assinada falhar
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('public')) {
                        target.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${media.storage_path}`;
                      }
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                    {formatDateBR(media.created_at)}
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

      {/* Modal de Visualização de Imagens */}
      {inspection?.media && inspection.media.length > 0 ? (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          images={inspection.media}
          mediaUrls={mediaUrls}
          vehiclePlate={vehicle?.plate || ''}
        />
      ) : (
        isImageViewerOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '32px',
                borderRadius: '12px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              <h3 style={{ marginBottom: '16px', color: '#333' }}>Nenhuma Imagem Disponível</h3>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                Este veículo ainda não possui imagens de inspeção cadastradas.
              </p>
              <button
                onClick={() => setIsImageViewerOpen(false)}
                style={{
                  padding: '8px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )
      )}
    </main>
  );
};

export default VehicleDetails;
