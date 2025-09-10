'use client';

import React, { useState } from 'react';
import ServicesLayout from '@/modules/partner/components/ServicesLayout';
import ServicesContent from '@/modules/partner/components/services/ServicesContent';
import EditServiceModal from '@/modules/partner/components/EditServiceModal';
import { type PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import { useEditServiceModal } from '@/modules/partner/hooks/useEditServiceModal';

// Dados mock para teste
const mockServices: PartnerService[] = [
  {
    id: '1',
    name: 'Lavagem Completa',
    description: 'Lavagem externa e interna completa do veículo',
    price: 85.0,
    category: 'Lavagem',
  },
  {
    id: '2',
    name: 'Polimento de Faróis',
    description: 'Polimento e restauração de faróis',
    price: 45.0,
    category: 'Polimento',
  },
  {
    id: '3',
    name: 'Higienização de Ar-Condicionado',
    description: 'Limpeza completa do sistema de ar-condicionado',
    price: 120.0,
    category: 'Higienização',
  },
  {
    id: '4',
    name: 'Lavagem de Motor',
    description: 'Lavagem especializada do motor',
    price: 65.0,
    category: 'Lavagem',
  },
  {
    id: '5',
    name: 'Aplicação de Cera',
    description: 'Aplicação de cera protetora na pintura',
    price: 35.0,
    category: 'Polimento',
  },
  {
    id: '6',
    name: 'Limpeza de Estofados',
    description: 'Limpeza profunda dos estofados',
    price: 95.0,
    category: null,
  },
];

const ServicesPage = () => {
  // Usar dados mock para teste
  const services = mockServices;
  const loading = false;
  const error = null;

  const { editingService, isModalOpen, updateLoading, openModal, closeModal } =
    useEditServiceModal();

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();

  const handleEdit = (service: PartnerService) => {
    openModal(service);
  };

  const handleDelete = async () => {
    // Simular exclusão
  };

  const onSave = async () => {
    // Simular salvamento
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
