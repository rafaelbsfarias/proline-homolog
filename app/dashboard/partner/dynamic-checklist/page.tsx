'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePartnerChecklist } from '@/modules/partner/hooks/usePartnerChecklist';
import InspectionData from '@/modules/partner/components/InspectionData';

// Hooks
import { useAnomaliesManager } from './hooks/useAnomaliesManager';
import { usePartRequestModal } from './hooks/usePartRequestModal';
import { useDynamicChecklistSave } from './hooks/useDynamicChecklistSave';

// Components
import { LoadingState } from './components/LoadingState';
import { DynamicChecklistHeader } from './components/DynamicChecklistHeader';
import { VehicleInfoCard } from './components/VehicleInfoCard';
import { AnomaliesSection } from './components/AnomaliesSection';
import { PartRequestModal } from './components/PartRequestModal';
import { MessageBanner } from './components/MessageBanner';
import { ActionButtons } from './components/ActionButtons';

import styles from './page.module.css';

const DynamicChecklistPage = () => {
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    form,
    vehicle,
    inspection,
    loading,
    error,
    success,
    saving,
    saveChecklist,
    anomalies: initialAnomalies,
    saveAnomalies,
  } = usePartnerChecklist();

  // Hooks customizados
  const {
    anomalies,
    addAnomaly,
    removeAnomaly,
    updateDescription,
    addPhotos,
    removePhoto,
    updatePartRequest,
    removePartRequest,
  } = useAnomaliesManager({ initialAnomalies, loading });

  const { modalState, open, close, updateField, buildPartRequest } = usePartRequestModal();

  const { save } = useDynamicChecklistSave({ saveChecklist, saveAnomalies });

  // Handlers
  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleOpenPartRequestModal = (anomalyId: string) => {
    const anomaly = anomalies.find(a => a.id === anomalyId);
    open(anomalyId, anomaly?.partRequest);
  };

  const handleSavePartRequest = () => {
    const partRequest = buildPartRequest();
    if (partRequest && modalState.anomalyId) {
      updatePartRequest(modalState.anomalyId, partRequest);
      close();
    }
  };

  const handleSave = async () => {
    try {
      // Regra: só salvar se houver pelo menos UMA imagem em qualquer anomalia
      const hasAnyImage =
        Array.isArray(anomalies) &&
        anomalies.some(a => Array.isArray(a.photos) && a.photos.length > 0);

      if (!hasAnyImage) {
        setLocalError('É obrigatório anexar pelo menos uma imagem para salvar.');
        return;
      }

      setLocalError(null);
      await save(anomalies);
    } catch {
      // Erro já é tratado pelo hook
    }
  };

  // Loading State
  if (loading) {
    return <LoadingState />;
  }

  // Error State - Vehicle not found
  if (!vehicle) {
    return (
      <div className={styles.errorContainer}>
        <h1 className={styles.errorTitle}>Veículo não encontrado</h1>
        <p className={styles.errorMessage}>
          Não foi possível encontrar o veículo para este orçamento.
        </p>
        <button onClick={handleBack} className={styles.errorButton}>
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  // Main Render
  return (
    <div className={styles.page}>
      <DynamicChecklistHeader onBack={handleBack} />

      <div className={styles.container}>
        <VehicleInfoCard vehicle={vehicle} />

        <InspectionData
          inspectionDate={form.date}
          odometer={form.odometer}
          fuelLevel={form.fuelLevel}
          observations={form.observations}
          partnerServiceNotes={inspection?.partnerServiceNotes}
        />

        <AnomaliesSection
          anomalies={anomalies}
          onAddAnomaly={addAnomaly}
          onRemoveAnomaly={removeAnomaly}
          onUpdateDescription={updateDescription}
          onAddPhotos={addPhotos}
          onRemovePhoto={removePhoto}
          onOpenPartRequestModal={handleOpenPartRequestModal}
          onRemovePartRequest={removePartRequest}
        />

        {localError && <MessageBanner type="error" message={localError} />}
        {error && <MessageBanner type="error" message={error} />}
        {success && <MessageBanner type="success" message={success} />}

        <ActionButtons onCancel={handleBack} onSave={handleSave} saving={saving} />
      </div>

      <PartRequestModal
        modalState={modalState}
        onClose={close}
        onSave={handleSavePartRequest}
        onUpdateField={updateField}
      />
    </div>
  );
};

export default DynamicChecklistPage;
