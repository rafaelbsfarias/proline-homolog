'use client';
import React from 'react';
import AddressModalBase from '@/modules/common/components/AddressModalBase/AddressModalBase';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { AddressFormValues } from '@/modules/common/hooks/Address/useAddressForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ClientCollectPointModal({ isOpen, onClose, onSuccess }: Props) {
  const { post } = useAuthenticatedFetch();

  const handleSubmit = async (values: AddressFormValues) => {
    const response = await post<{ success: boolean; message?: string }>(
      '/api/client/create-address',
      {
        ...values,
        is_collect_point: true,
        is_main_address: false,
      }
    );

    if (response.ok && response.data?.success) {
      return { success: true, message: response.data.message };
    }

    return { success: false, message: response.error || 'Erro ao salvar endereço' };
  };

  return (
    <AddressModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Ponto de Coleta"
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
    />
  );
}
