import { labelOf } from '../helpers';
import { mapAddressIdsToLabels, getFeeLookups } from '../groupUtils';
import type { PendingApprovalGroup } from '../types';

export async function buildPendingApprovalGroups(
  admin: any,
  clientId: string,
  seedFeeMap?: Map<string, number>
): Promise<{
  approvalGroups: PendingApprovalGroup[];
  approvalTotal: number;
}> {
  const approvalStatuses = ['AGUARDANDO APROVAÇÃO DA COLETA', 'SOLICITAÇÃO DE MUDANÇA DE DATA'];
  const { data: vehiclesApproval } = await admin
    .from('vehicles')
    .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
    .eq('client_id', clientId)
    .in('status', approvalStatuses)
    .not('pickup_address_id', 'is', null);

  let approvalGroups: PendingApprovalGroup[] = [];
  let approvalTotal = 0;
  if (vehiclesApproval?.length) {
    const byAddressDate = new Map<string, number>();
    const addressIds2 = new Set<string>();
    const statusMap: Record<string, Record<string, number>> = {};
    (vehiclesApproval || []).forEach((v: any) => {
      const aid = String(v.pickup_address_id);
      addressIds2.add(aid);
      const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
      const key = `${aid}|${d}`;
      byAddressDate.set(key, (byAddressDate.get(key) || 0) + 1);
      const st = String(v.status || '').toUpperCase();
      statusMap[key] = statusMap[key] || {};
      statusMap[key][st] = (statusMap[key][st] || 0) + 1;
    });

    const addrIdsArr = Array.from(addressIds2);
    const addrLabelMap2 = await mapAddressIdsToLabels(admin, addrIdsArr);

    const labels2 = Array.from(addrLabelMap2.values()).filter(Boolean);
    const feeByAddrDate2 = new Map<string, number>(seedFeeMap);
    const lookups = await getFeeLookups(admin, clientId, labels2);
    // Mesclar lookups com seedFeeMap preservando semântica existente
    lookups.feeByAddrDate.forEach((v, k) => feeByAddrDate2.set(k, v));
    const approvedFeeByAddr = lookups.approvedFeeByAddr;
    const latestNonZeroFeeByAddr = lookups.latestNonZeroFeeByAddr;

    approvalGroups = Array.from(byAddressDate.entries()).map(([key, count]) => {
      const [aid, d] = key.split('|');
      const lbl = addrLabelMap2.get(aid) || '';
      // Regra: usar sempre o último valor APROVADO pelo cliente.
      // Fallbacks: tentar por data específica, depois qualquer fee mais recente > 0.
      const fee =
        approvedFeeByAddr.get(lbl) ??
        feeByAddrDate2.get(`${lbl}|${d}`) ??
        latestNonZeroFeeByAddr.get(lbl) ??
        feeByAddrDate2.get(`${lbl}|`) ??
        null;
      const statuses = Object.entries(statusMap[key] || {}).map(([status, count]) => ({
        status,
        count,
      }));
      if (typeof fee === 'number') approvalTotal += fee * count;
      const collection_date = d || null;
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: count,
        collection_fee: fee,
        statuses,
        collection_date,
      };
    });
  }

  return { approvalGroups, approvalTotal };
}
