'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/modules/common/components/Loading/Loading';
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
import { ImageLightbox } from './modals/ImageLightbox';

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
  const { grouped: partnerEvidenceByCategory, evidences: partnerEvidences } = usePartnerEvidences(
    vehicle?.id,
    inspection?.id
  );
  const { data: checklistData, loading: checklistLoading } = usePartnerChecklist(vehicle?.id);
  const { evidences: executionEvidences, loading: executionLoading } = useExecutionEvidences(
    vehicle?.id
  );
  const { categories: checklistCategories, loading: categoriesLoading } =
    usePartnerChecklistCategories(vehicle?.id, inspection?.id);

  // Aggregated evidences (specialist + partner + execution)
  const aggregatedEvidenceUrls = useMemo(() => {
    const urls: string[] = [];
    // 1) Specialist inspection media
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    (inspection?.media || []).forEach(img => {
      const url =
        (mediaUrls && mediaUrls[img.storage_path]) ||
        (supabaseUrl
          ? `${supabaseUrl}/storage/v1/object/public/vehicle-media/${img.storage_path}`
          : '');
      if (url) urls.push(url);
    });
    // 2) Partner evidences
    (partnerEvidences || []).forEach(ev => {
      if (ev.url) urls.push(ev.url);
    });
    // 3) Execution evidences
    (executionEvidences || []).forEach(group => {
      (group.evidences || []).forEach(e => {
        if (e.image_url) urls.push(e.image_url);
      });
    });
    // Deduplicate while preserving order
    const seen = new Set<string>();
    return urls.filter(u => (seen.has(u) ? false : (seen.add(u), true)));
  }, [inspection?.media, mediaUrls, partnerEvidences, executionEvidences]);

  const [aggLightboxOpen, setAggLightboxOpen] = useState(false);

  const openAggregatedEvidences = () => {
    if (aggregatedEvidenceUrls.length > 0) setAggLightboxOpen(true);
  };

  // Handlers
  const handleLoadDynamicChecklist = async (category: string) => {
    if (!vehicle?.id || !inspection?.id) return;

    const data = await loadChecklist(vehicle.id, inspection.id, category);
    if (data) {
      modalState.dynamicChecklistModal.open({
        anomalies: data.anomalies,
        savedAt: new Date().toISOString(),
        category,
        items: data.items,
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
        <div className={styles.headerTop}>
          <IconTextButton
            onClick={() => router.back()}
            title="Voltar"
            icon={<LuArrowLeft size={20} />}
            className="mr-4"
          >
            Voltar
          </IconTextButton>
        </div>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Detalhes do Veículo</h1>
            <p className={styles.subtitle}>
              {vehicle.brand} {vehicle.model} • {vehicle.plate}
            </p>
          </div>
          {aggregatedEvidenceUrls.length > 0 && (
            <button onClick={openAggregatedEvidences} className={styles.evidenceButton}>
              Ver Evidências ({aggregatedEvidenceUrls.length})
            </button>
          )}
        </div>
      </div>

      {/* Sections Grid */}
      <div className={styles.gridContainer}>
        <VehicleBasicInfo vehicle={vehicle} />

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
      {/* Aggregated evidences lightbox */}
      {aggLightboxOpen && aggregatedEvidenceUrls.length > 0 && (
        <ImageLightbox
          isOpen={aggLightboxOpen}
          images={aggregatedEvidenceUrls}
          startIndex={0}
          onClose={() => setAggLightboxOpen(false)}
        />
      )}

      {modalState.checklistModal.isOpen && checklistData && (
        <ChecklistViewer data={checklistData} onClose={modalState.checklistModal.close} />
      )}

      {modalState.dynamicChecklistModal.isOpen && modalState.dynamicChecklistModal.data && (
        <ChecklistReadOnlyViewer
          data={{
            items: modalState.dynamicChecklistModal.data.items || [],
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
