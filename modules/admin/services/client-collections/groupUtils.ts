import { labelOf } from './helpers';

export async function mapAddressIdsToLabels(
  admin: any,
  addressIds: string[]
): Promise<Map<string, string>> {
  if (!addressIds.length) return new Map();
  const { data: addrs } = await admin
    .from('addresses')
    .select('id, street, number, city')
    .in('id', addressIds);
  const addrLabelMap = new Map<string, string>();
  addressIds.forEach(aid => {
    const a = (addrs || []).find((x: any) => String(x.id) === String(aid));
    addrLabelMap.set(aid, labelOf(a));
  });
  return addrLabelMap;
}

/**
 * Retorna estruturas auxiliares de taxa a partir de vehicle_collections
 * - feeByAddrDate: chave `${addressLabel}|${date}` -> fee
 * - approvedFeeByAddr: último fee aprovado (>0) por endereço (ordenado por updated_at desc)
 * - latestNonZeroFeeByAddr: último fee (>0) por endereço independente de status
 */
export async function getFeeLookups(
  admin: any,
  clientId: string,
  addressLabels: string[]
): Promise<{
  feeByAddrDate: Map<string, number>;
  approvedFeeByAddr: Map<string, number>;
  latestNonZeroFeeByAddr: Map<string, number>;
}> {
  const feeByAddrDate = new Map<string, number>();
  const approvedFeeByAddr = new Map<string, number>();
  const latestNonZeroFeeByAddr = new Map<string, number>();

  if (!addressLabels.length) return { feeByAddrDate, approvedFeeByAddr, latestNonZeroFeeByAddr };

  const { data: feeRows } = await admin
    .from('vehicle_collections')
    .select('collection_address, collection_fee_per_vehicle, collection_date, status, updated_at')
    .eq('client_id', clientId)
    .in('status', ['requested', 'approved'])
    .in('collection_address', addressLabels)
    .order('updated_at', { ascending: false });

  (feeRows || []).forEach((r: any) => {
    const addr = r?.collection_address;
    const fee =
      typeof r?.collection_fee_per_vehicle === 'number'
        ? Number(r.collection_fee_per_vehicle)
        : NaN;
    const date = r?.collection_date ? String(r.collection_date) : '';
    if (!addr || !Number.isFinite(fee)) return;

    feeByAddrDate.set(`${addr}|${date}`, fee);

    if (!approvedFeeByAddr.has(addr) && String(r?.status) === 'approved' && fee > 0) {
      approvedFeeByAddr.set(addr, fee);
    }
    if (!latestNonZeroFeeByAddr.has(addr) && fee > 0) {
      latestNonZeroFeeByAddr.set(addr, fee);
    }
  });

  return { feeByAddrDate, approvedFeeByAddr, latestNonZeroFeeByAddr };
}
