import { labelOf } from '../helpers';
import type { CollectionPricingRequest } from '../types';

export async function buildPricingRequests(
  admin: any,
  clientId: string
): Promise<CollectionPricingRequest[]> {
  const { data: vehiclesForPricing, error: vehErr } = await admin
    .from('vehicles')
    .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
    .eq('client_id', clientId)
    .eq('status', 'PONTO DE COLETA SELECIONADO')
    .not('pickup_address_id', 'is', null);
  if (vehErr) throw new Error('Erro ao buscar veículos');

  const byAddress = new Map<string, number>();
  const dateByAddress = new Map<string, string | null>();
  (vehiclesForPricing || []).forEach((v: any) => {
    const aid = String(v.pickup_address_id);
    byAddress.set(aid, (byAddress.get(aid) || 0) + 1);
    const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
    const prev = dateByAddress.get(aid);
    if (prev === undefined) dateByAddress.set(aid, d || null);
    else if ((prev || '') !== (d || '')) dateByAddress.set(aid, null);
  });

  const addressIds = Array.from(byAddress.keys());
  const addrLabelMap = new Map<string, string>();
  if (addressIds.length > 0) {
    const { data } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .in('id', addressIds);
    addressIds.forEach(aid => {
      const a = (data || []).find((x: any) => x.id === aid);
      addrLabelMap.set(aid, labelOf(a));
    });
  }

  const feeByAddrDate = new Map<string, number>();
  const proposedByAddr = new Map<string, string>();
  const latestRowByAddr = new Map<string, { id: number; fee: number | null; date: string }>();
  if (addressIds.length > 0) {
    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    if (labels.length) {
      const { data: feeRows } = await admin
        .from('vehicle_collections')
        .select('id, collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', clientId)
        .eq('status', 'requested')
        .in('collection_address', labels);
      const latestIdByAddr = new Map<string, { id: number; date: string }>();
      (feeRows || []).forEach((r: any) => {
        const addr = r?.collection_address;
        const fee = r?.collection_fee_per_vehicle;
        const date = r?.collection_date ? String(r.collection_date) : '';
        if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date}`, Number(fee));
        if (addr && date) {
          const idNum = typeof r?.id === 'number' ? r.id : Number(r?.id || 0);
          const prev = latestIdByAddr.get(addr);
          if (!prev || idNum > prev.id) latestIdByAddr.set(addr, { id: idNum, date });
          const prevRow = latestRowByAddr.get(addr);
          if (!prevRow || idNum > prevRow.id)
            latestRowByAddr.set(addr, {
              id: idNum,
              fee: typeof fee === 'number' ? Number(fee) : null,
              date,
            });
        } else if (addr) {
          // even without date, maintain latest fee if available
          const idNum = typeof r?.id === 'number' ? r.id : Number(r?.id || 0);
          const prevRow = latestRowByAddr.get(addr);
          if (!prevRow || idNum > prevRow.id)
            latestRowByAddr.set(addr, {
              id: idNum,
              fee: typeof fee === 'number' ? Number(fee) : null,
              date: '',
            });
        }
      });
      latestIdByAddr.forEach((v, addr) => proposedByAddr.set(addr, v.date));
    }
  }

  return addressIds.map(aid => {
    const lbl = addrLabelMap.get(aid) || '';
    const clientDate = dateByAddress.get(aid) || '';
    const feeKey = `${lbl}|${clientDate}`;
    const lastFee = latestRowByAddr.get(lbl)?.fee ?? null;
    const fee = lastFee ?? feeByAddrDate.get(feeKey) ?? feeByAddrDate.get(`${lbl}|`) ?? null;
    return {
      addressId: aid,
      address: lbl,
      vehicle_count: byAddress.get(aid) || 0,
      collection_fee: fee,
      collection_date: clientDate || null,
      proposed_date: proposedByAddr.get(lbl) || null,
    };
  });
}
