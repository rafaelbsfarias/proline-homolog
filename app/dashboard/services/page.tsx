'use client';

import React, { useState } from 'react';
import ServicesLayout from '@/modules/partner/components/ServicesLayout';
import ServicesContent from '@/modules/partner/components/ServicesContent';
import EditServiceModal from '@/modules/partner/components/EditServiceModal';
import {
  usePartnerServices,
  type PartnerService,
  type UpdateServiceData,
} from '@/modules/partner/hooks/usePartnerServices';
import { useEditServiceModal } from '@/modules/partner/hooks/useEditServiceModal';

const ServicesPage = () => {
  const { services, loading, error, updateService, deleteService } = usePartnerServices();
  const { editingService, isModalOpen, updateLoading, openModal, closeModal, handleSave } =
    useEditServiceModal();

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();

  const handleEdit = (service: PartnerService) => {
    openModal(service);
  };

  const handleDelete = async (service: PartnerService) => {
    try {
      await deleteService(service.id);
    } catch {
      // Erro já tratado no hook
    }
  };

  const onSave = async (serviceId: string, data: UpdateServiceData) => {
    await handleSave(serviceId, data, updateService);
  };

  const handleServiceSelect = (service: PartnerService) => {
    setSelectedServiceId(service.id);
    // Aqui você pode adicionar lógica adicional, como rolar para o serviço na tabela
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
