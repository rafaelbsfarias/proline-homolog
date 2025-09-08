'use client';

import { useState } from 'react';
import { PartnerService, UpdateServiceData } from '@/modules/partner/hooks/usePartnerServices';

interface UpdateServiceResult {
  success: boolean;
  message: string;
}

export const useEditServiceModal = () => {
  const [editingService, setEditingService] = useState<PartnerService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const openModal = (service: PartnerService) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSave = async (
    serviceId: string,
    data: UpdateServiceData,
    updateService: (id: string, data: UpdateServiceData) => Promise<UpdateServiceResult>
  ) => {
    setUpdateLoading(true);
    try {
      await updateService(serviceId, data);
      closeModal();
    } catch (error) {
      // Erro será tratado pelo componente que usa o hook
      throw error;
    } finally {
      setUpdateLoading(false);
    }
  };

  return {
    editingService,
    isModalOpen,
    updateLoading,
    openModal,
    closeModal,
    handleSave,
  };
};
