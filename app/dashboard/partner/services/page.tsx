'use client';

import React, { useState } from 'react';
import ServicesLayout from '@/modules/partner/components/services/ServicesLayout';
import ServicesContent from '@/modules/partner/components/services/ServicesContent';
import EditServiceModal from '@/modules/partner/components/services/EditServiceModal';
import {
  usePartnerServices,
  type PartnerService,
} from '@/modules/partner/hooks/usePartnerServices';
import { useEditServiceModal } from '@/modules/partner/hooks/useEditServiceModal';

const ServicesPage = () => {
  // Usar hook real para buscar dados do banco
  const { services, loading, error, updateService, deleteService } = usePartnerServices();

  const { editingService, isModalOpen, updateLoading, openModal, closeModal } =
    useEditServiceModal();

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [operationError, setOperationError] = useState<string | null>(null);

  const handleEdit = (service: PartnerService) => {
    openModal(service);
  };

  const handleDelete = async () => {
    if (editingService) {
      try {
        await deleteService(editingService.id);
        closeModal();
        setOperationError(null); // Limpar erro anterior
      } catch {
        setOperationError('Erro ao excluir serviço. Tente novamente.');
      }
    }
  };

  const onSave = async () => {
    if (editingService) {
      try {
        await updateService(editingService.id, {
          name: editingService.name,
          description: editingService.description,
          price: editingService.price,
          category: editingService.category || '',
        });
        closeModal();
        setOperationError(null); // Limpar erro anterior
      } catch {
        setOperationError('Erro ao salvar serviço. Tente novamente.');
      }
    }
  };

  const handleServiceSelect = (service: PartnerService) => {
    setSelectedServiceId(service.id);
  };

  return (
    <ServicesLayout
      services={services}
      onServiceSelect={handleServiceSelect}
      selectedServiceId={selectedServiceId}
    >
      <ServicesContent
        services={services}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {operationError && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {operationError}
        </div>
      )}

      <EditServiceModal
        service={editingService}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={onSave}
        loading={updateLoading}
      />
    </ServicesLayout>
  );
};

export default ServicesPage;
