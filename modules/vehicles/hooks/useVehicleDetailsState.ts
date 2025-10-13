import { useState } from 'react';
import { AnomalyEvidence } from '../types/VehicleDetailsTypes';

export const useVehicleDetailsState = () => {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDynamicChecklistModal, setShowDynamicChecklistModal] = useState(false);
  const [dynamicChecklistData, setDynamicChecklistData] = useState<{
    anomalies: AnomalyEvidence[];
    savedAt: string;
    category?: string;
  } | null>(null);

  return {
    imageViewer: {
      isOpen: isImageViewerOpen,
      open: () => setIsImageViewerOpen(true),
      close: () => setIsImageViewerOpen(false),
    },
    checklistModal: {
      isOpen: showChecklistModal,
      open: () => setShowChecklistModal(true),
      close: () => setShowChecklistModal(false),
    },
    dynamicChecklistModal: {
      isOpen: showDynamicChecklistModal,
      data: dynamicChecklistData,
      open: (data: { anomalies: AnomalyEvidence[]; savedAt: string; category?: string }) => {
        setDynamicChecklistData(data);
        setShowDynamicChecklistModal(true);
      },
      close: () => {
        setShowDynamicChecklistModal(false);
        setDynamicChecklistData(null);
      },
    },
  };
};
