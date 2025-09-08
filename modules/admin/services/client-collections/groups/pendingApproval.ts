import { labelOf } from '../helpers';
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
    const { data: addrs2 } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .in('id', addrIdsArr);
    const addrLabelMap2 = new Map<string, string>();
    addrIdsArr.forEach(aid => {
      const a = (addrs2 || []).find((x: any) => x.id === aid);
      addrLabelMap2.set(aid, labelOf(a));
    });

    const labels2 = Array.from(addrLabelMap2.values()).filter(Boolean);
    const feeByAddrDate2 = new Map<string, number>(seedFeeMap);
    const feeByAddr2 = new Map<string, number>();
    if (labels2.length) {
      const { data: feeRows2 } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date, status')
        .eq('client_id', clientId)
        .in('status', ['requested', 'approved'])
        .in('collection_address', labels2);
      (feeRows2 || []).forEach((r: any) => {
        const addr = r?.collection_address;
        const fee = r?.collection_fee_per_vehicle;
        const date = r?.collection_date ? String(r.collection_date) : '';
        if (addr && typeof fee === 'number') {
          feeByAddrDate2.set(`${addr}|${date}`, Number(fee));
          if (!feeByAddr2.has(addr)) feeByAddr2.set(addr, Number(fee));
        }
      });
    }

    approvalGroups = Array.from(byAddressDate.entries()).map(([key, count]) => {
      const [aid, d] = key.split('|');
      const lbl = addrLabelMap2.get(aid) || '';
      const fee =
        feeByAddrDate2.get(`${lbl}|${d}`) ??
        feeByAddrDate2.get(`${lbl}|`) ??
        feeByAddr2.get(lbl) ??
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
