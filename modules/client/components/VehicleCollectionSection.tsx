'use client';

import React from 'react';
import { makeLocalIsoDate } from '@/modules/client/utils/date';
import { CollectionSummary, RescheduleFlow, CollectionCalendar } from './Collection';
import {
  useCollectionSummary,
  useCollectionApproval,
  useRescheduleModal,
  useIndividualApproval,
} from '../hooks/collection';

interface VehicleCollectionSectionProps {
  onLoadingChange?: (loading: boolean) => void;
}

const VehicleCollectionSection: React.FC<VehicleCollectionSectionProps> = ({ onLoadingChange }) => {
  const { data, loading, refetch } = useCollectionSummary(onLoadingChange);
  const { approveAllCollections } = useCollectionApproval();
  const { rescheduleOpenFor, toggleRescheduleModal, closeRescheduleModal } = useRescheduleModal();
  const { acceptProposal, rejectProposal } = useIndividualApproval();

  const minIso = makeLocalIsoDate();

  const handleApproveClick = async () => {
    const success = await approveAllCollections(data.groups);
    if (success) {
      await refetch();
    }
  };

  const handleAcceptProposal = async (addressId: string) => {
    const success = await acceptProposal(addressId);
    if (success) {
      await refetch();
    }
  };

  const handleRejectProposal = async (addressId: string) => {
    const success = await rejectProposal(addressId);
    if (success) {
      await refetch();
    }
  };

  const handleRescheduleSuccess = async () => {
    await refetch();
  };

  return (
    <div className="vehicle-counter">
      <div className="counter-header">
        <div className="counter-content" style={{ width: '100%' }}>
          <CollectionSummary
            data={data}
            loading={loading}
            onRescheduleClick={toggleRescheduleModal}
            onApproveClick={handleApproveClick}
            onAcceptProposal={handleAcceptProposal}
            onRejectProposal={handleRejectProposal}
          />

          <RescheduleFlow
            isOpen={!!rescheduleOpenFor}
            addressId={rescheduleOpenFor}
            onClose={closeRescheduleModal}
            onRescheduleSuccess={handleRescheduleSuccess}
            minIso={minIso}
          />
        </div>

        <div className="counter-actions" />
      </div>

      <CollectionCalendar highlightDates={data.highlightDates} />
    </div>
  );
};

export default VehicleCollectionSection;
