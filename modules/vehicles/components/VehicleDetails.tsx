'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/modules/common/components/Loading/Loading';
import ImageViewerModal from '@/modules/client/components/ImageViewerModal';
import { ChecklistViewer } from './modals/ChecklistViewer';
import ChecklistReadOnlyViewer from './modals/ChecklistReadOnlyViewer';
import BudgetPhaseSection from './BudgetPhaseSection';
import { IconTextButton } from '@/modules/common/components/IconTextButton/IconTextButton';
import { LuArrowLeft } from 'react-icons/lu';

// Hooks
import { usePartnerEvidences } from '@/modules/vehicles/hooks/usePartnerEvidences';
import { usePartnerChecklist } from '@/modules/vehicles/hooks/usePartnerChecklist';
import { usePartnerChecklistCategories } from '@/modules/vehicles/hooks/usePartnerChecklistCategories';
import { useExecutionEvidences } from '@/modules/vehicles/hooks/useExecutionEvidences';
import { useVehicleDetailsState } from '@/modules/vehicles/hooks/useVehicleDetailsState';
import { useDynamicChecklistLoader } from '@/modules/vehicles/hooks/useDynamicChecklistLoader';

// Sections
import { VehicleBasicInfo } from './sections/VehicleBasicInfo';
import { VehicleServicesSection } from './sections/VehicleServicesSection';
import { VehicleMediaSection } from './sections/VehicleMediaSection';
import { PartnerEvidencesSection } from './sections/PartnerEvidencesSection';
import { ExecutionEvidencesSection } from './sections/ExecutionEvidencesSection';
import { InspectionObservationsSection } from './sections/InspectionObservationsSection';

// Types
import { VehicleDetailsProps } from '../types/VehicleDetailsTypes';

import styles from './VehicleDetails.module.css';

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  inspection,
  mediaUrls,
  loading,
  error,
}) => {
  const router = useRouter();
  const modalState = useVehicleDetailsState();
  const { loadChecklist, loading: loadingDynamicChecklist } = useDynamicChecklistLoader();

  // Data Hooks
  const { grouped: partnerEvidenceByCategory } = usePartnerEvidences(vehicle?.id, inspection?.id);
  const { data: checklistData, loading: checklistLoading } = usePartnerChecklist(vehicle?.id);
  const { evidences: executionEvidences, loading: executionLoading } = useExecutionEvidences(
    vehicle?.id
  );
  const { categories: checklistCategories, loading: categoriesLoading } =
    usePartnerChecklistCategories(vehicle?.id, inspection?.id);

  // Handlers
  const handleLoadDynamicChecklist = async (category: string) => {
    if (!vehicle?.id || !inspection?.id) return;

    const anomalies = await loadChecklist(vehicle.id, inspection.id, category);
    if (anomalies) {
      modalState.dynamicChecklistModal.open({
        anomalies,
        savedAt: new Date().toISOString(),
        category,
      });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading />
      </div>
    );
  }

  // Error State
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

  // Main Render
  return (
    <main className={styles.main}>
      {/* Header */}
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

      {/* Sections Grid */}
      <div className={styles.gridContainer}>
        <VehicleBasicInfo
          vehicle={vehicle}
          onViewEvidences={modalState.imageViewer.open}
          mediaCount={inspection?.media?.length || 0}
        />

        <BudgetPhaseSection
          vehicleId={vehicle.id}
          createdAt={vehicle.created_at}
          estimatedArrivalDate={vehicle.estimated_arrival_date}
          inspectionDate={inspection?.inspection_date}
          inspectionFinalized={inspection?.finalized}
        />

        <VehicleServicesSection services={inspection?.services || []} />

        <VehicleMediaSection media={inspection?.media || []} mediaUrls={mediaUrls} />

        <PartnerEvidencesSection
          evidenceByCategory={partnerEvidenceByCategory}
          checklistCategories={checklistCategories}
          checklistData={checklistData}
          checklistLoading={checklistLoading}
          categoriesLoading={categoriesLoading}
          loadingDynamicChecklist={loadingDynamicChecklist}
          onOpenStaticChecklist={modalState.checklistModal.open}
          onOpenDynamicChecklist={handleLoadDynamicChecklist}
        />

        <InspectionObservationsSection observations={inspection?.observations || ''} />

        <ExecutionEvidencesSection services={executionEvidences || []} loading={executionLoading} />
      </div>

      {/* Modals */}
      {inspection?.media && inspection.media.length > 0 && (
        <ImageViewerModal
          isOpen={modalState.imageViewer.isOpen}
          onClose={modalState.imageViewer.close}
          images={inspection.media}
          mediaUrls={mediaUrls}
          vehiclePlate={vehicle?.plate || ''}
        />
      )}

      {modalState.checklistModal.isOpen && checklistData && (
        <ChecklistViewer data={checklistData} onClose={modalState.checklistModal.close} />
      )}

      {modalState.dynamicChecklistModal.isOpen && modalState.dynamicChecklistModal.data && (
        <ChecklistReadOnlyViewer
          data={{
            items: [],
            anomalies: modalState.dynamicChecklistModal.data.anomalies,
            savedAt: modalState.dynamicChecklistModal.data.savedAt,
          }}
          partnerCategory={modalState.dynamicChecklistModal.data.category}
          onClose={modalState.dynamicChecklistModal.close}
        />
      )}
    </main>
  );
};

export default VehicleDetails;
