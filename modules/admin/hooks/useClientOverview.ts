import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// ===== Tipos expostos para os componentes de composição =====
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

export interface OverviewData {
  pricingRequests: CollectionPricingRequest[];
  pendingApprovals: PendingApprovalGroup[];
  approvedCollections: ApprovedCollectionGroup[];
  approvalTotal: number;
  approvedTotal: number;
  clientSummary: ClientSummary | null;
  statusTotals: { status: string; count: number }[];
  history: HistoryRow[];
}

export const useClientOverview = (clientId: string) => {
  const { get } = useAuthenticatedFetch();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const summaryRes = await get<any>(`/api/admin/client-collections-summary/${clientId}`);
      if (!summaryRes.ok || summaryRes.data?.success === false) {
        throw new Error(summaryRes.error || summaryRes.data?.error || 'Falha ao buscar overview.');
      }

      const d = summaryRes.data || {};

      const pricingRequests: CollectionPricingRequest[] = (d.groups || []).map((g: any) => ({
        addressId: g.addressId,
        address: g.address,
        vehicle_count: g.vehicle_count ?? 0,
        collection_fee: typeof g.collection_fee === 'number' ? Number(g.collection_fee) : null,
        collection_date: g.collection_date || null,
        proposed_date: g.proposed_date || null,
      }));

      const pendingApprovals: PendingApprovalGroup[] = (d.approvalGroups || []).map((g: any) => ({
        addressId: g.addressId,
        address: g.address,
        vehicle_count: g.vehicle_count ?? 0,
        collection_fee: typeof g.collection_fee === 'number' ? Number(g.collection_fee) : null,
        collection_date: g.collection_date || null,
      }));

      const approvedCollections: ApprovedCollectionGroup[] = (d.approvedGroups || []).map(
        (g: any) => ({
          addressId: g.addressId,
          address: g.address,
          vehicle_count: g.vehicle_count ?? 0,
          collection_fee: typeof g.collection_fee === 'number' ? Number(g.collection_fee) : null,
          collection_date: g.collection_date || null,
          status: 'COLETA APROVADA',
        })
      );

      const payload: OverviewData = {
        pricingRequests,
        pendingApprovals,
        approvedCollections,
        approvalTotal: Number(d.approvalTotal || 0),
        approvedTotal: Number(d.approvedTotal || 0),
        clientSummary: d.clientSummary || null,
        statusTotals: Array.isArray(d.statusTotals) ? d.statusTotals : [],
        history: Array.isArray(d.collectionHistory) ? d.collectionHistory : [],
      };

      setData(payload);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, get]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...(data || {}), loading, error, refetchData: fetchData };
};
