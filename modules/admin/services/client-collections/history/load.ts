import type { HistoryRow } from '../types';

export async function loadHistory(admin: any, clientId: string): Promise<HistoryRow[]> {
  const { data: coll } = await admin
    .from('vehicle_collections')
    .select(
      'collection_address, collection_fee_per_vehicle, collection_date, status, payment_received, payment_received_at'
    )
    .eq('client_id', clientId)
    .order('collection_date', { ascending: false, nullsLast: true });

  return (coll || []).map((r: any) => ({
    collection_address: r.collection_address,
    collection_fee_per_vehicle:
      typeof r.collection_fee_per_vehicle === 'number'
        ? Number(r.collection_fee_per_vehicle)
        : null,
    collection_date: r.collection_date ? String(r.collection_date) : null,
    status: r.status || undefined,
    payment_received: !!r.payment_received,
    payment_received_at: r.payment_received_at ? String(r.payment_received_at) : null,
  }));
}
