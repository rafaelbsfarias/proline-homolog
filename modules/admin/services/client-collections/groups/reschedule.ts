import { labelOf } from '../helpers';
import { mapAddressIdsToLabels, getFeeLookups } from '../groupUtils';
import type { DateChangeRequestGroup } from '../types';

export async function buildRescheduleGroups(
  admin: any,
  clientId: string
): Promise<DateChangeRequestGroup[]> {
  // Veículos onde o cliente solicitou nova data: 'APROVAÇÃO NOVA DATA'
  const { data: vehicles } = await admin
    .from('vehicles')
    .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
    .eq('client_id', clientId)
    .eq('status', 'APROVAÇÃO NOVA DATA')
    .not('pickup_address_id', 'is', null);

  if (!vehicles?.length) return [];

  const byAddressDate = new Map<string, number>();
  const addressIds = new Set<string>();
  (vehicles || []).forEach((v: any) => {
    const aid = String(v.pickup_address_id);
    addressIds.add(aid);
    const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
    const key = `${aid}|${d}`;
    byAddressDate.set(key, (byAddressDate.get(key) || 0) + 1);
  });

  const addrIdsArr = Array.from(addressIds);
  const addrLabelMap = await mapAddressIdsToLabels(admin, addrIdsArr);

  const labels = Array.from(addrLabelMap.values()).filter(Boolean);
  const { feeByAddrDate, approvedFeeByAddr, latestNonZeroFeeByAddr } = await getFeeLookups(
    admin,
    clientId,
    labels
  );

  const groups: DateChangeRequestGroup[] = Array.from(byAddressDate.entries()).map(
    ([key, count]) => {
      const [aid, d] = key.split('|');
      const lbl = addrLabelMap.get(aid) || '';
      const fee =
        approvedFeeByAddr.get(lbl) ??
        feeByAddrDate.get(`${lbl}|${d}`) ??
        latestNonZeroFeeByAddr.get(lbl) ??
        feeByAddrDate.get(`${lbl}|`) ??
        null;
      const collection_date = d || null;
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: count,
        collection_fee: fee,
        collection_date,
      };
    }
  );

  return groups;
}
