import { labelOf } from '../helpers';
import type { HistoryRow } from '../types';

export async function enrichHistoryWithVehicleStatus(
  admin: any,
  clientId: string,
  history: HistoryRow[]
): Promise<HistoryRow[]> {
  if (!history.length) return history;

  const { data: addrsAll } = await admin
    .from('addresses')
    .select('id, street, number, city, profile_id')
    .eq('profile_id', clientId);
  const idByLabel = new Map<string, string>();
  (addrsAll || []).forEach((a: any) => {
    const lbl = labelOf(a);
    idByLabel.set(lbl, String(a.id));
  });

  const { data: vehAll } = await admin
    .from('vehicles')
    .select('pickup_address_id, status, estimated_arrival_date')
    .eq('client_id', clientId);
  const counts = new Map<string, Record<string, number>>();
  (vehAll || []).forEach((v: any) => {
    const aid = v?.pickup_address_id ? String(v.pickup_address_id) : '';
    if (!aid) return;
    const d = v?.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
    const key = `${aid}|${d}`;
    const st = String(v?.status || '')
      .toUpperCase()
      .trim();
    if (!st) return;
    const bucket = counts.get(key) || {};
    bucket[st] = (bucket[st] || 0) + 1;
    counts.set(key, bucket);
  });

  return history.map(row => {
    const aid = idByLabel.get(row.collection_address || '') || '';
    const d = row.collection_date ? String(row.collection_date) : '';
    const key = `${aid}|${d}`;
    const bucket = counts.get(key);
    if (!bucket || !Object.keys(bucket).length) return { ...row, status: '-' };
    let chosen = '';
    let max = -1;
    Object.entries(bucket).forEach(([st, n]) => {
      if ((n as number) > max) {
        max = n as number;
        chosen = st;
      }
    });
    const others = Object.entries(bucket)
      .filter(([st]) => st !== chosen)
      .map(([st, n]) => `${st} (${n})`)
      .join(', ');
    const display = others ? `${chosen} (+ ${others})` : chosen;
    return { ...row, status: display };
  });
}
