'use client';

import React from 'react';
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

  return (
    <ServicesLayout>
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
