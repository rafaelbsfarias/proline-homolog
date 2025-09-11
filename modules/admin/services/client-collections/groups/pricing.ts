import { labelOf } from '../helpers';
import type { CollectionPricingRequest } from '../types';
import { getLogger } from '@/modules/logger';

const logger = getLogger('svc:admin:collections:pricing');

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
  try {
    logger.info('vehicles_for_pricing', {
      count: (vehiclesForPricing || []).length,
      sample: (vehiclesForPricing || []).slice(0, 3).map((v: any) => ({
        id: v.id,
        pickup_address_id: v.pickup_address_id,
        estimated_arrival_date: v.estimated_arrival_date,
      })),
    });
  } catch {}

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
    try {
      logger.info('address_labels', {
        total: addressIds.length,
        mappings: addressIds.slice(0, 5).map(aid => ({ id: aid, label: addrLabelMap.get(aid) })),
      });
    } catch {}
  }

  const feeByAddrDate = new Map<string, number>();
  const proposedByAddr = new Map<string, string>();
  const latestRowByAddr = new Map<string, { id: number; fee: number | null; date: string }>();
  if (addressIds.length > 0) {
    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    if (labels.length) {
      const { data: feeRows } = await admin
        .from('vehicle_collections')
        .select(
          'id, collection_address, collection_fee_per_vehicle, collection_date, updated_at, created_at, status'
        )
        .eq('client_id', clientId)
        .in('status', ['requested', 'approved'])
        .in('collection_address', labels);
      try {
        logger.info('fee_rows_loaded', {
          count: (feeRows || []).length,
          sample: (feeRows || []).slice(0, 5).map((r: any) => ({
            id: r.id,
            address: r.collection_address,
            fee: r.collection_fee_per_vehicle,
            date: r.collection_date,
          })),
        });
      } catch {}
      // Ordenar por updated_at/created_at desc e pegar o mais recente por endereço,
      // priorizando o último fee > 0 quando existir
      const sorted = (feeRows || [])
        .map((r: any) => ({
          ...r,
          _ts:
            (r?.updated_at ? Date.parse(String(r.updated_at)) : NaN) ||
            (r?.created_at ? Date.parse(String(r.created_at)) : NaN) ||
            0,
        }))
        .sort((a: any, b: any) => (b._ts || 0) - (a._ts || 0));

      const firstRowByAddr = new Map<string, { fee: number | null; date: string | null }>();
      const nonZeroFeeByAddr = new Map<string, number>();

      for (const r of sorted) {
        const addr = r?.collection_address as string | undefined;
        if (!addr) continue;
        const fee =
          typeof r?.collection_fee_per_vehicle === 'number'
            ? Number(r.collection_fee_per_vehicle)
            : null;
        const date = r?.collection_date ? String(r.collection_date) : null;
        if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date || ''}`, fee);
        if (!firstRowByAddr.has(addr)) firstRowByAddr.set(addr, { fee, date });
        if (!proposedByAddr.has(addr) && date) proposedByAddr.set(addr, date);
        if (typeof fee === 'number' && fee > 0 && !nonZeroFeeByAddr.has(addr))
          nonZeroFeeByAddr.set(addr, fee);
      }

      firstRowByAddr.forEach((v, addr) => {
        latestRowByAddr.set(addr, {
          id: 0,
          fee: nonZeroFeeByAddr.get(addr) ?? v.fee ?? null,
          date: v.date || '',
        });
      });
      try {
        logger.info('latest_row_by_addr', {
          sample: Array.from(latestRowByAddr.entries())
            .slice(0, 5)
            .map(([addr, v]) => ({ addr, ...v })),
        });
      } catch {}
    }
  }

  const result = addressIds.map(aid => {
    const lbl = addrLabelMap.get(aid) || '';
    const clientDate = dateByAddress.get(aid) || '';
    const feeKey = `${lbl}|${clientDate}`;
    const lastFee = latestRowByAddr.get(lbl)?.fee ?? null;
    const fee = lastFee ?? feeByAddrDate.get(feeKey) ?? feeByAddrDate.get(`${lbl}|`) ?? null;
    const row = {
      addressId: aid,
      address: lbl,
      vehicle_count: byAddress.get(aid) || 0,
      collection_fee: fee,
      collection_date: clientDate || null,
      // Se já existe data escolhida pelo cliente para o pedido atual,
      // não expomos uma proposed_date antiga para não mascarar a informação.
      proposed_date: clientDate ? null : proposedByAddr.get(lbl) || null,
    };
    try {
      logger.debug('pricing_row', {
        ...row,
        fee_source:
          lastFee != null
            ? 'lastFee'
            : feeByAddrDate.get(feeKey) != null
              ? 'feeKey'
              : feeByAddrDate.get(`${lbl}|`) != null
                ? 'addrNoDate'
                : 'none',
      });
    } catch {}
    return row;
  });
  try {
    logger.info('pricing_result_summary', {
      total_addresses: result.length,
      empty_fees: result.filter(r => r.collection_fee == null).length,
    });
  } catch {}
  return result;
}
