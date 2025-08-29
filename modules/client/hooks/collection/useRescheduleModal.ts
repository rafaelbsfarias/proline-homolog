'use client';

import { useState } from 'react';

export interface UseRescheduleModalReturn {
  rescheduleOpenFor: string | null;
  openRescheduleModal: (addressId: string) => void;
  closeRescheduleModal: () => void;
  toggleRescheduleModal: (addressId: string) => void;
}

export const useRescheduleModal = (): UseRescheduleModalReturn => {
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null);

  const openRescheduleModal = (addressId: string) => {
    setRescheduleOpenFor(addressId);
  };

  const closeRescheduleModal = () => {
    setRescheduleOpenFor(null);
  };

  const toggleRescheduleModal = (addressId: string) => {
    setRescheduleOpenFor(rescheduleOpenFor === addressId ? null : addressId);
  };

  return {
    rescheduleOpenFor,
    openRescheduleModal,
    closeRescheduleModal,
    toggleRescheduleModal,
  };
};
