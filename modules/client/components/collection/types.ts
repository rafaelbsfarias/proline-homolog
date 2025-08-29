export interface CollectionGroup {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null; // ISO
}

export interface CollectionSummaryData {
  approvalTotal: number;
  count: number;
  groups: CollectionGroup[];
  highlightDates: string[];
}

export interface CollectionSummaryProps {
  data: CollectionSummaryData;
  loading: boolean;
  onRescheduleClick: (addressId: string) => void;
  onApproveClick: () => void;
}

export interface CollectionGroupsListProps {
  groups: CollectionGroup[];
  onRescheduleClick: (addressId: string) => void;
}

export interface CollectionGroupItemProps {
  group: CollectionGroup;
  onRescheduleClick: (addressId: string) => void;
}

export interface CollectionTotalProps {
  total: number;
  count: number;
}

// Tipos para RescheduleFlow
export interface RescheduleFlowProps {
  isOpen: boolean;
  addressId: string | null;
  onClose: () => void;
  onRescheduleSuccess: () => void;
  minIso: string;
}

export interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateIso: string) => void;
  minIso: string;
  loading?: boolean;
}
