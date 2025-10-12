'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/modules/common/components/Loading/Loading';
import {
  translateFuelLevel,
  VEHICLE_CONSTANTS,
  translateServiceCategory,
} from '@/app/constants/messages';
import { formatDateBR } from '@/modules/client/utils/date';
import ImageViewerModal from '@/modules/client/components/ImageViewerModal';
import BudgetPhaseSection from './BudgetPhaseSection';
import { IconTextButton } from '@/modules/common/components/IconTextButton/IconTextButton';
import styles from './VehicleDetails.module.css'; // Importando o CSS Module
import { LuArrowLeft } from 'react-icons/lu';

// As interfaces permanecem as mesmas
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
  services: Array<{ category: string; required: boolean; notes: string }>;
  media: Array<{ storage_path: string; uploaded_by: string; created_at: string }>;
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <main className={styles.main}>
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Erro</h1>
          <p>{error || 'Veículo não encontrado'}</p>
          <button onClick={() => router.back()} className={styles.errorButton}>
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <IconTextButton
          onClick={() => router.back()}
          title="Voltar"
          icon={<LuArrowLeft size={20} />}
          className="mr-4"
        >
          Voltar
        </IconTextButton>
        <h1 className={styles.title}>Detalhes do Veículo</h1>
        <p className={styles.subtitle}>
          {vehicle.brand} {vehicle.model} • {vehicle.plate}
        </p>
      </div>

      <div className={styles.gridContainer}>
        {/* Informações Básicas */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Informações Básicas</h2>
            {inspection?.media && inspection.media.length > 0 && (
              <button onClick={() => setIsImageViewerOpen(true)} className={styles.evidenceButton}>
                Ver Evidências ({inspection.media.length})
              </button>
            )}
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Placa:</span>
              <span className={styles.infoValueMonospace}>{vehicle.plate}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Marca:</span>
              <span>{vehicle.brand}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Modelo:</span>
              <span>
                {vehicle.model} ({vehicle.year})
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Cor:</span>
              <span>{vehicle.color || 'N/A'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status:</span>
              <span className={styles.statusLabel}>{getStatusLabel(vehicle.status)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Valor FIPE:</span>
              <span>{formatCurrency(vehicle.fipe_value)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>KM Atual:</span>
              <span>{vehicle.current_odometer || 'N/A'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nível de Combustível:</span>
              <span>{translateFuelLevel(vehicle.fuel_level)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Cadastrado em:</span>
              <span>{formatDateBR(vehicle.created_at)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Previsão de Chegada:</span>
              <span>{formatDateBR(vehicle.estimated_arrival_date)}</span>
            </div>
          </div>
        </div>

        {/* Timeline (Nova seção substitui a legada) */}
        <BudgetPhaseSection
          vehicleId={vehicle.id}
          createdAt={vehicle.created_at}
          estimatedArrivalDate={vehicle.estimated_arrival_date}
          inspectionDate={inspection?.inspection_date}
          inspectionFinalized={inspection?.finalized}
        />

        {/* Serviços Necessários */}
        {inspection?.services && inspection.services.length > 0 && (
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Serviços Necessários</h2>
            </div>
            <div className={styles.servicesGrid}>
              {inspection.services.map((service, index) => (
                <div
                  key={index}
                  className={`${styles.serviceCard} ${service.required ? styles.serviceCardRequired : ''}`}
                >
                  <div className={styles.serviceHeader}>
                    <span className={styles.serviceCategory}>
                      {translateServiceCategory(service.category)}
                    </span>
                    <span
                      className={
                        service.required ? styles.serviceRequiredLabel : styles.serviceOptionalLabel
                      }
                    >
                      {service.required ? 'Necessário' : 'Opcional'}
                    </span>
                  </div>
                  {service.notes && (
                    <div className={styles.serviceNotes}>
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
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Evidências</h2>
            </div>
            <div className={styles.mediaGrid}>
              {inspection.media.map((media, index) => (
                <div key={index} className={styles.mediaItem}>
                  <img
                    src={
                      mediaUrls[media.storage_path] ||
                      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${media.storage_path}`
                    }
                    alt={`Foto ${index + 1}`}
                    className={styles.mediaImg}
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('public')) {
                        target.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-media/${media.storage_path}`;
                      }
                    }}
                  />
                  <div className={styles.mediaDate}>{formatDateBR(media.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações da Inspeção */}
        {inspection?.observations && (
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Observações do Especialista</h2>
            </div>
            <div className={styles.observationsContainer}>{inspection.observations}</div>
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
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>Nenhuma Imagem Disponível</h3>
              <p className={styles.modalText}>
                Este veículo ainda não possui imagens de inspeção cadastradas.
              </p>
              <button onClick={() => setIsImageViewerOpen(false)} className={styles.modalButton}>
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
