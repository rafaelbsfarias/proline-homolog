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
    // Último fee aprovado por endereço (prioritário)
    const approvedFeeByAddr = new Map<string, number>();
    // Último fee (> 0) por endereço, independente de status (fallback)
    const latestNonZeroFeeByAddr = new Map<string, number>();
    if (labels2.length) {
      const { data: feeRows2 } = await admin
        .from('vehicle_collections')
        .select(
          'collection_address, collection_fee_per_vehicle, collection_date, status, updated_at, created_at'
        )
        .eq('client_id', clientId)
        .in('status', ['requested', 'approved'])
        .in('collection_address', labels2)
        .order('updated_at', { ascending: false });

      (feeRows2 || []).forEach((r: any) => {
        const addr = r?.collection_address;
        const fee = r?.collection_fee_per_vehicle;
        const date = r?.collection_date ? String(r.collection_date) : '';
        if (addr && typeof fee === 'number') {
          feeByAddrDate2.set(`${addr}|${date}`, Number(fee));
          // Preencher primeiro fee aprovado (mais recente, pois ordenado desc)
          if (!approvedFeeByAddr.has(addr) && String(r?.status) === 'approved' && Number(fee) > 0) {
            approvedFeeByAddr.set(addr, Number(fee));
          }
          // Preencher primeiro fee (>0) como fallback mais recente
          if (!latestNonZeroFeeByAddr.has(addr) && Number(fee) > 0) {
            latestNonZeroFeeByAddr.set(addr, Number(fee));
          }
        }
      });
    }

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
