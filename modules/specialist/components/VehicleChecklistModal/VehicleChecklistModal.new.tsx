'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/modules/common/components/Modal/Modal';
import { useToast } from '@/modules/common/components/ToastProvider';
import { VehicleInfo } from '../../../checklist/types';
import { useChecklistForm } from '../../../checklist/useChecklistForm';
import { useImageUploader } from '../../../checklist/useImageUploader';
import { useChecklistSubmission } from '../../hooks/useChecklistSubmission';
import { useChecklistFinalization } from '../../hooks/useChecklistFinalization';
import { useChecklistData } from '../../hooks/useChecklistData';
import VehicleChecklistHeader from './components/VehicleChecklistHeader';
import VehicleChecklistForm from './components/VehicleChecklistForm';
import VehicleChecklistImageSection from './components/VehicleChecklistImageSection';
import VehicleChecklistActions from './components/VehicleChecklistActions';

interface VehicleChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: (VehicleInfo & { comercializacao?: boolean; preparacao?: boolean }) | null;
  onSaved?: () => void;
  onFinalized?: () => void;
}

/**
 * Componente principal do modal de checklist de veículo
 * Usa composition pattern para coordenar hooks e sub-componentes
 * Segue o princípio da responsabilidade única como coordinator/container
 */
const VehicleChecklistModal: React.FC<VehicleChecklistModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSaved,
  onFinalized,
}) => {
  const { showToast } = useToast();

  // Hooks de negócio
  const { form, setField, setServiceFlag, setServiceNotes, resetForm } = useChecklistForm();
  const {
    files,
    previews,
    handleFiles: handleFilesHook,
    removeFile,
    reset: resetImages,
  } = useImageUploader();

  // Estado local mínimo
  const [existingImages, setExistingImages] = useState<{ path: string; url: string }[]>([]);
  const [isFinalized, setIsFinalized] = useState(false);

  // Hook de dados
  const { state: dataState, loadData } = useChecklistData();

  // Hooks de submissão
  const submission = useChecklistSubmission();
  const finalization = useChecklistFinalization();

  // Carregar dados quando modal abre
  useEffect(() => {
    if (isOpen && vehicle) {
      loadData(vehicle);
    }
  }, [isOpen, vehicle, loadData]);

  // Sincronizar dados carregados com estado local
  useEffect(() => {
    if (dataState.checklistData) {
      const checklist = dataState.checklistData;

      // Preencher formulário
      setField('date', checklist.inspection.inspection_date);
      setField('odometer', String(checklist.inspection.odometer ?? ''));
      setField('fuelLevel', checklist.inspection.fuel_level || 'half');
      setField('observations', checklist.inspection.observations || '');

      // Preencher serviços
      (checklist.services || []).forEach(
        (s: { category: string; required: boolean; notes: string }) => {
          const map: Record<string, keyof typeof form.services> = {
            mechanics: 'mechanics',
            bodyPaint: 'bodyPaint',
            washing: 'washing',
            tires: 'tires',
            loja: 'loja',
            patio_atacado: 'patioAtacado',
          };
          const key = map[s.category];
          if (key) {
            setServiceFlag(key, !!s.required);
            setServiceNotes(key, s.notes || '');
          }
        }
      );

      // Definir status de finalização
      setIsFinalized(!!checklist.inspection.finalized);

      // Carregar imagens existentes
      setExistingImages(dataState.existingImages);
    }
  }, [
    dataState.checklistData,
    dataState.existingImages,
    setField,
    setServiceFlag,
    setServiceNotes,
    form.services,
  ]);

  // Handlers
  const handleClose = () => {
    resetForm();
    resetImages();
    setExistingImages([]);
    setIsFinalized(false);
    onClose();
  };

  const handleFiles = (list: FileList | null) =>
    handleFilesHook(list, (msg: string) => showToast('warning', msg), existingImages.length);

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinalized) return;

    try {
      await submission.submitChecklist(
        form,
        vehicle!,
        files,
        existingImages.map(img => img.path)
      );
      showToast('success', 'Checklist salvo com sucesso.');
      resetImages();
      onSaved?.();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao salvar checklist.');
    }
  };

  const handleFinalize = async () => {
    if (!vehicle || isFinalized) return;

    try {
      await finalization.finalizeChecklist(
        form,
        vehicle,
        files,
        existingImages.map(img => img.path),
        () => {
          onSaved?.();
          onFinalized?.();
          handleClose();
        }
      );
      showToast('success', 'Checklist salvo e finalizado com sucesso.');
      resetImages();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao finalizar checklist.');
    }
  };

  // Callbacks para os componentes
  const handleFieldChange = (field: keyof typeof form, value: string | typeof form.fuelLevel) => {
    setField(field, value);
  };

  const handleServiceFlagChange = (serviceKey: keyof typeof form.services, value: boolean) => {
    setServiceFlag(serviceKey, value);
  };

  const handleServiceNotesChange = (serviceKey: keyof typeof form.services, value: string) => {
    setServiceNotes(serviceKey, value);
  };

  if (!isOpen || !vehicle) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Checklist do Veículo" size="lg">
      <form className="vehicle-checklist-modal" onSubmit={handleSubmit}>
        {/* Área de conteúdo que vai rolar */}
        <div className="vehicle-checklist-content">
          <VehicleChecklistHeader vehicle={vehicle} isFinalized={isFinalized} />

          <VehicleChecklistForm
            form={form}
            vehicle={vehicle}
            serviceCategories={dataState.serviceCategories}
            isFinalized={isFinalized}
            onFieldChange={handleFieldChange}
            onServiceFlagChange={handleServiceFlagChange}
            onServiceNotesChange={handleServiceNotesChange}
          />

          <VehicleChecklistImageSection
            previews={previews}
            existingImages={existingImages}
            isFinalized={isFinalized}
            onFilesSelect={handleFiles}
            onRemoveExistingImage={handleRemoveExistingImage}
            onRemovePreview={removeFile}
          />
        </div>

        <VehicleChecklistActions
          isSubmitting={submission.state.isSubmitting}
          isFinalizing={finalization.state.isFinalizing}
          error={submission.state.error || finalization.state.error}
          success={submission.state.success || finalization.state.success}
          isFinalized={isFinalized}
          onSubmit={handleSubmit}
          onFinalize={handleFinalize}
        />
      </form>
    </Modal>
  );
};

export default VehicleChecklistModal;
