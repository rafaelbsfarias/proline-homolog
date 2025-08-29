import type { HistoryRow } from '../types';

export async function loadHistory(admin: any, clientId: string): Promise<HistoryRow[]> {
  const { data: coll } = await admin
    .from('vehicle_collections')
    .select('collection_address, collection_fee_per_vehicle, collection_date, status')
    .eq('client_id', clientId)
    .order('collection_date', { ascending: false, nullsLast: true });

  // Agrupar por endereço mantendo apenas o registro mais recente (mais simples no momento)
  const byAddress = new Map<
    string,
    {
      collection_address: string;
      collection_fee_per_vehicle: number | null;
      collection_date: string | null;
      status?: string;
    }
  >();

  (coll || []).forEach((r: any) => {
    const addr = String(r.collection_address || '');
    const fee =
      typeof r.collection_fee_per_vehicle === 'number'
        ? Number(r.collection_fee_per_vehicle)
        : null;
    const date = r.collection_date ? String(r.collection_date) : null;
    const prev = byAddress.get(addr);
    if (!prev) {
      byAddress.set(addr, {
        collection_address: addr,
        collection_fee_per_vehicle: fee,
        collection_date: date,
        status: r.status || undefined,
      });
    } else {
      // Escolhe a data mais recente e preserva fee não-nulo quando possível
      const prevDate = prev.collection_date || '';
      const currDate = date || '';
      if (currDate > prevDate) {
        byAddress.set(addr, {
          collection_address: addr,
          collection_fee_per_vehicle: fee ?? prev.collection_fee_per_vehicle ?? null,
          collection_date: date,
          status: r.status || undefined,
        });
      } else if (fee != null && prev.collection_fee_per_vehicle == null) {
        // Atualiza fee se o atual tem fee e o mantido não tinha
        byAddress.set(addr, { ...prev, collection_fee_per_vehicle: fee });
      }
    }
  });

  const rows: HistoryRow[] = Array.from(byAddress.values()).map(r => ({
    collection_address: r.collection_address,
    collection_fee_per_vehicle: r.collection_fee_per_vehicle,
    collection_date: r.collection_date,
    status: r.status,
  }));
  // Ordena desc por data
  rows.sort((a, b) =>
    String(b.collection_date || '').localeCompare(String(a.collection_date || ''))
  );
  return rows;
}
