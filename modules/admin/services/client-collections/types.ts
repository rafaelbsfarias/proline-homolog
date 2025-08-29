export interface CollectionPricingRequest {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date?: string | null;
  proposed_date?: string | null;
}

export interface PendingApprovalGroup {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
  statuses?: { status: string; count: number }[];
}

export interface ApprovedCollectionGroup {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
  status?: string;
}

export interface ClientSummary {
  taxa_operacao?: number | null;
  percentual_fipe?: number | null;
  parqueamento?: number | null;
  quilometragem?: number | null;
}

export interface HistoryRow {
  collection_address: string;
  collection_fee_per_vehicle: number | null;
  collection_date: string | null;
  status?: string;
  vehicles?: { plate: string; status: string }[];
}

export interface ClientCollectionsSummaryResult {
  groups: CollectionPricingRequest[];
  approvalGroups: PendingApprovalGroup[];
  approvalTotal: number;
  approvedGroups: ApprovedCollectionGroup[];
  approvedTotal: number;
  clientSummary: ClientSummary | null;
  statusTotals: { status: string; count: number }[];
  collectionHistory: HistoryRow[];
}
