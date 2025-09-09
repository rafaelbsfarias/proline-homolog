import { labelOf } from '../helpers';
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
  // Priorizar último fee aprovado por endereço
  const approvedFeeByAddr = new Map<string, number>();
  // Fallback: último fee (>0) por endereço
  const latestNonZeroFeeByAddr = new Map<string, number>();
  if (labels.length) {
    const { data: feeRows } = await admin
      .from('vehicle_collections')
      .select(
        'collection_address, collection_fee_per_vehicle, collection_date, status, updated_at, created_at'
      )
      .eq('client_id', clientId)
      .in('status', ['requested', 'approved'])
      .in('collection_address', labels)
      .order('updated_at', { ascending: false });
    (feeRows || []).forEach((r: any) => {
      const addr = r?.collection_address;
      const fee = r?.collection_fee_per_vehicle;
      const date = r?.collection_date ? String(r.collection_date) : '';
      if (addr && typeof fee === 'number') {
        const nfee = Number(fee);
        feeByAddrDate.set(`${addr}|${date}`, nfee);
        if (!approvedFeeByAddr.has(addr) && String(r?.status) === 'approved' && nfee > 0) {
          approvedFeeByAddr.set(addr, nfee);
        }
        if (!latestNonZeroFeeByAddr.has(addr) && nfee > 0) {
          latestNonZeroFeeByAddr.set(addr, nfee);
        }
      }
    });
  }

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
