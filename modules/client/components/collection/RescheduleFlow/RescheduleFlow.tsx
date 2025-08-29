import React, { useState } from 'react';
import { RescheduleFlowProps } from '../types';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import RescheduleModal from './RescheduleModal';

const RescheduleFlow: React.FC<RescheduleFlowProps> = ({
  isOpen,
  addressId,
  onClose,
  onRescheduleSuccess,
  minIso,
}) => {
  const { post } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(false);

  const handleReschedule = async (dateIso: string) => {
    if (!addressId || !dateIso) return;

    setLoading(true);
    try {
      const response = await post('/api/client/collection-reschedule', {
        addressId,
        new_date: dateIso,
      });

      if (response.ok) {
        onRescheduleSuccess();
        onClose();
      }
    } catch {
      // Error handling could be improved with user feedback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !addressId) {
    return null;
  }

  return (
    <RescheduleModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleReschedule}
      minIso={minIso}
      loading={loading}
    />
  );
};

export default RescheduleFlow;
