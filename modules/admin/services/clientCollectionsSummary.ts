import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { CollectionHistoryService } from '@/modules/common/services/CollectionHistoryService';
import { getLogger } from '@/modules/logger';
import { labelOf } from './client-collections/helpers';
import type {
  ClientCollectionsSummaryResult,
  ClientSummary,
  HistoryRow,
  CollectionPricingRequest,
  PendingApprovalGroup,
  ApprovedCollectionGroup,
} from './client-collections/types';
import { buildApprovedGroups } from './client-collections/groups/approved';
import { buildPricingRequests } from './client-collections/groups/pricing';
import { buildPendingApprovalGroups } from './client-collections/groups/pendingApproval';
import { getStatusTotals } from './client-collections/statusTotals';
import { enrichHistoryWithVehicleStatus } from './client-collections/history/enrich';
import { buildRescheduleGroups } from './client-collections/groups/reschedule';

const logger = getLogger('api:admin:client-collections-summary');

export async function getClientCollectionsSummary(
  clientId: string
): Promise<ClientCollectionsSummaryResult> {
  const admin = SupabaseService.getInstance().getAdminClient();

  // 1) Groups
  const { approvedGroups, approvedTotal } = await buildApprovedGroups(admin, clientId);
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

  // 4) History from immutable collection_history table
  let collectionHistory: HistoryRow[] = [];
  try {
    const historyService = CollectionHistoryService.getInstance();
    const immutableHistory = await historyService.getClientHistory(clientId);

    // Convert to HistoryRow format for compatibility
    collectionHistory = immutableHistory.map(record => ({
      collection_address: record.collection_address,
      collection_fee_per_vehicle: record.collection_fee_per_vehicle,
      collection_date: record.collection_date,
      // Nesta etapa não exibimos estados de pagamento; padronizamos como 'COLETA APROVADA'.
      status: 'COLETA APROVADA',
      vehicles: [],
    }));

    // Enrich with current vehicle status for display purposes
    collectionHistory = await enrichHistoryWithVehicleStatus(admin, clientId, collectionHistory);
  } catch (e: unknown) {
    const error = e as Error;
    logger.warn('history_enrich_failed', { error: error?.message });
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
