import { labelOf } from '../helpers';
import { mapAddressIdsToLabels, getFeeLookups } from '../groupUtils';
import type { ApprovedCollectionGroup } from '../types';

export async function buildApprovedGroups(
  admin: any,
  clientId: string
): Promise<{
  approvedGroups: ApprovedCollectionGroup[];
  approvedTotal: number;
}> {
  // Veículos considerados "aprovados" para exibição de coletas aprovadas
  // No ciclo atual, usamos 'AGUARDANDO COLETA' como status final pós-aceite
  const approvedStatusValues = ['AGUARDANDO COLETA', 'approved'];
  const { data: vehiclesApproved } = await admin
    .from('vehicles')
    .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
    .eq('client_id', clientId)
    .in('status', approvedStatusValues)
    .not('pickup_address_id', 'is', null);

  let approvedGroups: ApprovedCollectionGroup[] = [];
  let approvedTotal = 0;
  if (vehiclesApproved?.length) {
    const byAddressDate = new Map<string, number>();
    const addressIds = new Set<string>();
    (vehiclesApproved || []).forEach((v: any) => {
      const aid = String(v.pickup_address_id);
      addressIds.add(aid);
      const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
      const key = `${aid}|${d}`;
      byAddressDate.set(key, (byAddressDate.get(key) || 0) + 1);
    });

    const addrIdsArr = Array.from(addressIds);
    const addrLabelMap = await mapAddressIdsToLabels(admin, addrIdsArr);

    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    const { feeByAddrDate } = await getFeeLookups(admin, clientId, labels);

    approvedGroups = Array.from(byAddressDate.entries()).map(([key, count]) => {
      const [aid, d] = key.split('|');
      const lbl = addrLabelMap.get(aid) || '';
      const fee = feeByAddrDate.get(`${lbl}|${d}`) ?? null;
      if (typeof fee === 'number') approvedTotal += fee * count;
      const collection_date = d || null;
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: count,
        collection_fee: fee,
        collection_date,
      };
    });
  }

  return { approvedGroups, approvedTotal };
}
