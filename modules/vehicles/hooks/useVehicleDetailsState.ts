import { useState } from 'react';
import { AnomalyEvidence } from '../types/VehicleDetailsTypes';
import type { PartnerChecklistData } from '../hooks/usePartnerChecklist';

export const useVehicleDetailsState = () => {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDynamicChecklistModal, setShowDynamicChecklistModal] = useState(false);
  const [showPartnerChecklistModal, setShowPartnerChecklistModal] = useState(false);
  const [dynamicChecklistData, setDynamicChecklistData] = useState<{
    anomalies: AnomalyEvidence[];
    savedAt: string;
    category?: string;
    items?: Array<{ key: string; label: string; type: 'checkbox'; value?: boolean }>;
  } | null>(null);
  const [partnerChecklistData, setPartnerChecklistData] = useState<PartnerChecklistData | null>(
    null
  );

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
      open: (data: {
        anomalies: AnomalyEvidence[];
        savedAt: string;
        category?: string;
        items?: Array<{ key: string; label: string; type: 'checkbox'; value?: boolean }>;
      }) => {
        setDynamicChecklistData(data);
        setShowDynamicChecklistModal(true);
      },
      close: () => {
        setShowDynamicChecklistModal(false);
        setDynamicChecklistData(null);
      },
    },
    partnerChecklistModal: {
      isOpen: showPartnerChecklistModal,
      data: partnerChecklistData,
      open: (data: PartnerChecklistData) => {
        setPartnerChecklistData(data);
        setShowPartnerChecklistModal(true);
      },
      close: () => {
        setShowPartnerChecklistModal(false);
        setPartnerChecklistData(null);
      },
    },
  };
};
