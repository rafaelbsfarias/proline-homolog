import { useState } from 'react';
import { PartRequestModalState, PartRequest } from '../types';

const INITIAL_MODAL_STATE: PartRequestModalState = {
  isOpen: false,
  anomalyId: null,
  partName: '',
  partDescription: '',
  quantity: 1,
  estimatedPrice: '',
};

export const usePartRequestModal = () => {
  const [modalState, setModalState] = useState<PartRequestModalState>(INITIAL_MODAL_STATE);

  const open = (anomalyId: string, existingRequest?: PartRequest) => {
    setModalState({
      isOpen: true,
      anomalyId,
      partName: existingRequest?.partName || '',
      partDescription: existingRequest?.partDescription || '',
      quantity: existingRequest?.quantity || 1,
      estimatedPrice: existingRequest?.estimatedPrice?.toString() || '',
    });
  };

  const close = () => {
    setModalState(INITIAL_MODAL_STATE);
  };

  const updateField = (field: keyof PartRequestModalState, value: string | number) => {
    setModalState(prev => ({ ...prev, [field]: value }));
  };

  const buildPartRequest = (): PartRequest | null => {
    if (!modalState.partName.trim()) return null;

    return {
      partName: modalState.partName,
      partDescription: modalState.partDescription,
      quantity: modalState.quantity,
      estimatedPrice: modalState.estimatedPrice ? parseFloat(modalState.estimatedPrice) : undefined,
    };
  };

  return {
    modalState,
    open,
    close,
    updateField,
    buildPartRequest,
  };
};
