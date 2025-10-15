import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { CollectionHistoryService } from '@collections';
import { getLogger } from '@/modules/logger';
import { labelOf } from '../../collections/admin/helpers';
import type {
  ClientCollectionsSummaryResult,
  ClientSummary,
  HistoryRow,
  CollectionPricingRequest,
  PendingApprovalGroup,
  ApprovedCollectionGroup,
} from './client-collections/types';
import { buildPricingRequests } from './client-collections/groups/pricing';
import { buildPendingApprovalGroups } from '../../collections/admin/groups/pendingApproval';
import { getStatusTotals } from './client-collections/statusTotals';
import { buildRescheduleGroups } from '../../collections/admin/groups/reschedule';

const logger = getLogger('api:admin:client-collections-summary');

export async function getClientCollectionsSummary(
  clientId: string
): Promise<ClientCollectionsSummaryResult> {
  const admin = SupabaseService.getInstance().getAdminClient();

  // 1) Groups
  // Approved groups: prefer derivar do histórico detalhado (imutável) para convergir com a seção de histórico
  let approvedGroups: ApprovedCollectionGroup[] = [];
  let approvedTotal = 0;
  const groups: CollectionPricingRequest[] = await buildPricingRequests(admin, clientId);
  const { approvalGroups, approvalTotal } = await buildPendingApprovalGroups(admin, clientId);
  const rescheduleGroups = await buildRescheduleGroups(admin, clientId);

  // 2) Client contract summary
  let clientSummary: ClientSummary | null = null;
  try {
    const { data: clientRow } = await admin
      .from('clients')
      .select('taxa_operacao, percentual_fipe, parqueamento, quilometragem')
      .eq('profile_id', clientId)
      .maybeSingle();
    if (clientRow) clientSummary = clientRow;
  } catch {}

  // 3) Status totals
  const statusTotals = await getStatusTotals(admin, clientId);

  // 4) History from immutable collection_history (prefer detailed snapshot)
  let collectionHistory: HistoryRow[] = [];
  try {
    const historyService = CollectionHistoryService.getInstance();
    const detailed = await historyService.getClientHistoryDetailed(clientId);

    if (Array.isArray(detailed) && detailed.length) {
      // Helper: choose majority vehicle status and map to friendly PT-BR
      const friendlyVehicleStatus = (s: string): string => {
        const u = String(s || '')
          .trim()
          .toUpperCase();
        if (!u) return '-';
        if (u === 'AGUARDANDO COLETA') return 'Aguardando coleta';
        if (u === 'AGUARDANDO APROVAÇÃO DA COLETA') return 'Aguardando aprovação';
        if (u === 'SOLICITAÇÃO DE MUDANÇA DE DATA') return 'Solicitação de mudança de data';
        if (u === 'APROVAÇÃO NOVA DATA') return 'Aprovação nova data';
        if (u === 'PONTO DE COLETA SELECIONADO') return 'Ponto de coleta selecionado';
        return s;
      };

      const mapCollectionStatusPt = (s?: string): string => {
        const v = String(s || '')
          .trim()
          .toLowerCase();
        if (v === 'approved') return 'Aguardando coleta';
        if (v === 'requested') return 'Solicitado';
        return s || '-';
      };

      // Map detailed history to UI rows
      collectionHistory = detailed.map(record => {
        const vehicles = (record.vehicles || []).map(v => ({ plate: v.plate, status: v.status }));
        // Derive display status: prefer majority vehicle status; fallback to collection status mapped to PT
        let statusDisplay = '-';
        if (vehicles.length) {
          const counts = new Map<string, number>();
          vehicles.forEach(v => {
            const key = String(v.status || '')
              .trim()
              .toUpperCase();
            if (!key) return;
            counts.set(key, (counts.get(key) || 0) + 1);
          });
          let chosen = '';
          let max = -1;
          counts.forEach((n, k) => {
            if (n > max) {
              max = n;
              chosen = k;
            }
          });
          statusDisplay = friendlyVehicleStatus(chosen);
        } else {
          statusDisplay = mapCollectionStatusPt(record.current_status);
        }

        return {
          collection_id: record.collection_id,
          collection_address: record.collection_address,
          collection_fee_per_vehicle: record.collection_fee_per_vehicle,
          collection_date: record.collection_date,
          status: statusDisplay,
          vehicles,
        } as HistoryRow;
      });

      // Build approved groups from the same immutable source to avoid divergence
      // Resolve addressId via addresses table to keep UI keys stable
      const { data: addrRows } = await admin
        .from('addresses')
        .select('id, street, number, city, profile_id')
        .eq('profile_id', clientId);
      const idByLabel = new Map<string, string>();
      (addrRows || []).forEach((a: any) => {
        idByLabel.set(labelOf(a), String(a.id));
      });

      approvedGroups = detailed.map(record => {
        const address = record.collection_address;
        const addressId = idByLabel.get(address) || address; // fallback: use label as key
        const vehicle_count = Number(record.vehicle_count || (record.vehicles || []).length || 0);
        const collection_fee = Number(record.collection_fee_per_vehicle || 0);
        const collection_date = record.collection_date || null;
        if (collection_fee && vehicle_count) approvedTotal += collection_fee * vehicle_count;
        return {
          addressId,
          address,
          vehicle_count,
          collection_fee: isFinite(collection_fee) ? collection_fee : null,
          collection_date,
          status: 'Aguardando coleta',
        } as ApprovedCollectionGroup;
      });
    } else {
      // No detailed history: keep both approvedGroups and collectionHistory empty to avoid mixing live data
      approvedGroups = [];
      approvedTotal = 0;
      collectionHistory = [];
    }
  } catch (e: unknown) {
    const error = e as Error;
    logger.warn('history_load_failed', { error: error?.message });
  }

  return {
    groups,
    approvalGroups,
    approvalTotal,
    approvedGroups,
    approvedTotal,
    clientSummary,
    statusTotals,
    collectionHistory,
    rescheduleGroups,
  };
}
