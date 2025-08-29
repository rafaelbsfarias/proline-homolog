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
  if (addressIds.length > 0) {
    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    if (labels.length) {
      const { data: feeRows } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', clientId)
        .eq('status', 'requested')
        .in('collection_address', labels);
      (feeRows || []).forEach((r: any) => {
        const addr = r?.collection_address;
        const fee = r?.collection_fee_per_vehicle;
        const date = r?.collection_date ? String(r.collection_date) : '';
        if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date}`, Number(fee));
      });
    }
  }

  return addressIds.map(aid => {
    const lbl = addrLabelMap.get(aid) || '';
    const clientDate = dateByAddress.get(aid) || '';
    const feeKey = `${lbl}|${clientDate}`;
    const fee = feeByAddrDate.get(feeKey) ?? feeByAddrDate.get(`${lbl}|`) ?? null;
    return {
      addressId: aid,
      address: lbl,
      vehicle_count: byAddress.get(aid) || 0,
      collection_fee: fee,
      collection_date: clientDate || null,
    };
  });
}
