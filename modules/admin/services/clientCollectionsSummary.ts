import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:client-collections-summary');

export interface CollectionPricingRequest {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date?: string | null;
}

export interface PendingApprovalGroup {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
  statuses?: { status: string; count: number }[];
}

export interface ApprovedCollectionGroup {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
  status?: string;
}

export interface ClientSummary {
  taxa_operacao?: number | null;
  percentual_fipe?: number | null;
  parqueamento?: number | null;
  quilometragem?: number | null;
}

export interface HistoryRow {
  collection_address: string;
  collection_fee_per_vehicle: number | null;
  collection_date: string | null;
  status?: string;
  payment_received?: boolean;
  payment_received_at?: string | null;
}

export interface ClientCollectionsSummaryResult {
  groups: CollectionPricingRequest[];
  approvalGroups: PendingApprovalGroup[];
  approvalTotal: number;
  approvedGroups: ApprovedCollectionGroup[];
  approvedTotal: number;
  clientSummary: ClientSummary | null;
  statusTotals: { status: string; count: number }[];
  collectionHistory: HistoryRow[];
}

const labelOf = (a: any) =>
  `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

export async function getClientCollectionsSummary(
  clientId: string
): Promise<ClientCollectionsSummaryResult> {
  const admin = SupabaseService.getInstance().getAdminClient();

  // Approved groups (COLETA APROVADA | approved | paid) aggregated by address + date
  const approvedStatusValues = ['COLETA APROVADA', 'approved', 'paid'];
  const { data: vehiclesApproved } = await admin
    .from('vehicles')
    .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
    .eq('client_id', clientId)
    .in('status', approvedStatusValues)
    .not('pickup_address_id', 'is', null);

  let approvedGroups: ApprovedCollectionGroup[] = [];
  let approvedTotal = 0;
  if (vehiclesApproved?.length) {
    const byAddressDate = new Map<string, number>();
    const addressIds = new Set<string>();
    vehiclesApproved.forEach((v: any) => {
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
    if (labels.length) {
      const { data: feeRows3 } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', clientId)
        .in('status', ['requested', 'approved', 'paid'])
        .in('collection_address', labels);
      (feeRows3 || []).forEach((r: any) => {
        const addr = r?.collection_address;
        const fee = r?.collection_fee_per_vehicle;
        const date = r?.collection_date ? String(r.collection_date) : '';
        if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date}`, Number(fee));
      });
    }

    approvedGroups = Array.from(byAddressDate.entries()).map(([key, count]) => {
      const [aid, d] = key.split('|');
      const lbl = addrLabelMap.get(aid) || '';
      const fee = feeByAddrDate.get(`${lbl}|${d}`) ?? null;
      if (typeof fee === 'number') approvedTotal += fee * count;
      const collection_date = d || null;
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: count,
        collection_fee: fee,
        collection_date,
      };
    });
  }

  // Vehicles that selected a pickup point (pricing step)
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

  // Load any saved fees for these address labels (map by address|date)
  const feeByAddrDate = new Map<string, number>();
  if (addressIds.length > 0) {
    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    if (labels.length) {
      const { data: feeRows, error: feeErr } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', clientId)
        .eq('status', 'requested')
        .in('collection_address', labels);
      if (!feeErr) {
        (feeRows || []).forEach((r: any) => {
          const addr = r?.collection_address;
          const fee = r?.collection_fee_per_vehicle;
          const date = r?.collection_date ? String(r.collection_date) : '';
          if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date}`, Number(fee));
        });
      }
    }
  }

  const groups: CollectionPricingRequest[] = addressIds.map(aid => {
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

  // Approval groups (awaiting client's approval or admin date-change request)
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
    const feeByAddrDate2 = new Map<string, number>(feeByAddrDate);
    if (labels2.length) {
      const { data: feeRows2 } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', clientId)
        .eq('status', 'requested')
        .in('collection_address', labels2);
      (feeRows2 || []).forEach((r: any) => {
        const addr = r?.collection_address;
        const fee = r?.collection_fee_per_vehicle;
        const date = r?.collection_date ? String(r.collection_date) : '';
        if (addr && typeof fee === 'number') feeByAddrDate2.set(`${addr}|${date}`, Number(fee));
      });
    }

    approvalGroups = Array.from(byAddressDate.entries()).map(([key, count]) => {
      const [aid, d] = key.split('|');
      const lbl = addrLabelMap2.get(aid) || '';
      const fee = feeByAddrDate2.get(`${lbl}|${d}`) ?? null;
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

  // Client contract summary
  let clientSummary: ClientSummary | null = null;
  try {
    const { data: clientRow } = await admin
      .from('clients')
      .select('taxa_operacao, percentual_fipe, parqueamento, quilometragem')
      .eq('profile_id', clientId)
      .maybeSingle();
    if (clientRow) clientSummary = clientRow;
  } catch {}

  // Status totals for all vehicles of the client
  let statusTotals: { status: string; count: number }[] = [];
  try {
    const { data: allStatusRows } = await admin
      .from('vehicles')
      .select('status')
      .eq('client_id', clientId);
    const totals: Record<string, number> = {};
    (allStatusRows || []).forEach((row: any) => {
      const st = String(row?.status || '')
        .toUpperCase()
        .trim();
      if (!st) return;
      totals[st] = (totals[st] || 0) + 1;
    });
    statusTotals = Object.entries(totals).map(([k, v]) => ({ status: k, count: v }));
  } catch {}

  // Collection history + enrich with real vehicle status by address/date
  let collectionHistory: HistoryRow[] = [];
  try {
    const { data: coll } = await admin
      .from('vehicle_collections')
      .select(
        'collection_address, collection_fee_per_vehicle, collection_date, status, payment_received, payment_received_at'
      )
      .eq('client_id', clientId)
      .order('collection_date', { ascending: false, nullsLast: true });
    collectionHistory = (coll || []).map((r: any) => ({
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

    // Enriquecer com status real de veículos
    if (collectionHistory.length) {
      const { data: addrsAll } = await admin
        .from('addresses')
        .select('id, street, number, city, profile_id')
        .eq('profile_id', clientId);
      const labelMap = new Map<string, string>();
      const idByLabel = new Map<string, string>();
      (addrsAll || []).forEach((a: any) => {
        const lbl = labelOf(a);
        labelMap.set(String(a.id), lbl);
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

      collectionHistory = collectionHistory.map(row => {
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
  } catch (e: any) {
    logger.warn('history_enrich_failed', { error: e?.message });
  }

  return {
    groups,
    approvalGroups,
    approvalTotal,
    approvedGroups,
    approvedTotal,
    clientSummary,
    statusTotals,
    collectionHistory,
  };
}
