import { labelOf } from '../helpers';
import type { ApprovedCollectionGroup } from '../types';

export async function buildApprovedGroups(
  admin: any,
  clientId: string
): Promise<{
  approvedGroups: ApprovedCollectionGroup[];
  approvedTotal: number;
}> {
  const approvedStatusValues = ['COLETA APROVADA', 'approved', 'paid'];
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
    const { data: addrs } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .in('id', addrIdsArr);
    const addrLabelMap = new Map<string, string>();
    addrIdsArr.forEach(aid => {
      const a = (addrs || []).find((x: any) => x.id === aid);
      addrLabelMap.set(aid, labelOf(a));
    });

    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    const feeByAddrDate = new Map<string, number>();
    if (labels.length) {
      const { data: feeRows3 } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', clientId)
        .in('status', ['requested', 'approved', 'paid'])
        .in('collection_address', labels);
      (feeRows3 || []).forEach((r: any) => {
        const addr = r?.collection_address;
        const fee = r?.collection_fee_per_vehicle;
        const date = r?.collection_date ? String(r.collection_date) : '';
        if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date}`, Number(fee));
      });
    }

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
