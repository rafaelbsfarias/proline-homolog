import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:client-collections-summary');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { clientId } = await (ctx as any).params;
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Cliente inválido' }, { status: 400 });
    }

    // Prepare admin supabase client
    const admin = SupabaseService.getInstance().getAdminClient();

    // helper: build a label for an address row
    const label = (a: any) =>
      `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

    // Build approved groups (status = 'COLETA APROVADA'), split by date
    const approvedStatusValues = ['COLETA APROVADA', 'approved'];
    const { data: vehiclesApproved, error: vehApprovedErr } = await admin
      .from('vehicles')
      .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
      .eq('client_id', clientId)
      .in('status', approvedStatusValues)
      .not('pickup_address_id', 'is', null);

    let approvedGroups: any[] = [];
    let approvedTotal: number = 0;
    if (!vehApprovedErr && vehiclesApproved && vehiclesApproved.length) {
      const byAddressDate3 = new Map<string, number>();
      const addressIds3 = new Set<string>();
      (vehiclesApproved || []).forEach((v: any) => {
        const aid = String(v.pickup_address_id);
        addressIds3.add(aid);
        const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
        const key = `${aid}|${d}`;
        byAddressDate3.set(key, (byAddressDate3.get(key) || 0) + 1);
      });

      const addrIdsArr3 = Array.from(addressIds3);
      const { data: addrs3 } = await admin
        .from('addresses')
        .select('id, street, number, city')
        .in('id', addrIdsArr3);
      const addrLabelMap3 = new Map<string, string>();
      addrIdsArr3.forEach(aid => {
        const a = (addrs3 || []).find((x: any) => x.id === aid);
        addrLabelMap3.set(aid, label(a));
      });

      const labels3 = Array.from(addrLabelMap3.values()).filter(Boolean);
      const feeByAddrDate3 = new Map<string, number>();
      if (labels3.length) {
        const { data: feeRows3 } = await admin
          .from('vehicle_collections')
          .select('collection_address, collection_fee_per_vehicle, collection_date')
          .eq('client_id', clientId)
          .in('status', ['requested', 'approved', 'paid'])
          .in('collection_address', labels3);
        (feeRows3 || []).forEach((r: any) => {
          const addr = r?.collection_address;
          const fee = r?.collection_fee_per_vehicle;
          const date = r?.collection_date ? String(r.collection_date) : '';
          if (addr && typeof fee === 'number') feeByAddrDate3.set(`${addr}|${date}`, Number(fee));
        });
      }

      approvedGroups = Array.from(byAddressDate3.entries()).map(([key, count]) => {
        const [aid, d] = key.split('|');
        const lbl = addrLabelMap3.get(aid) || '';
        const fee = feeByAddrDate3.get(`${lbl}|${d}`) ?? null;
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

    // Load vehicles with selected pickup address
    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
      .eq('client_id', clientId)
      .eq('status', 'PONTO DE COLETA SELECIONADO')
      .not('pickup_address_id', 'is', null);

    if (vehErr) {
      logger.error('vehicles-error', { error: vehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    const byAddress = new Map<string, number>();
    const dateByAddress = new Map<string, string | null>();
    (vehicles || []).forEach((v: any) => {
      const aid = String(v.pickup_address_id);
      byAddress.set(aid, (byAddress.get(aid) || 0) + 1);
      const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
      const prev = dateByAddress.get(aid);
      if (prev === undefined) {
        dateByAddress.set(aid, d || null);
      } else {
        // Se houver divergência de datas entre veículos do mesmo endereço, deixa null
        if ((prev || '') !== (d || '')) {
          dateByAddress.set(aid, null);
        }
      }
    });

    const addressIds = Array.from(byAddress.keys());
    // Removida a condicional que retornava prematuramente

    // Load address labels
    let addrs: any[] = [];
    const addrLabelMap = new Map<string, string>();

    if (addressIds.length > 0) {
      const { data, error: addrErr } = await admin
        .from('addresses')
        .select('id, street, number, city')
        .in('id', addressIds);

      if (addrErr) {
        logger.error('addresses-error', { error: addrErr.message });
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar endereços' },
          { status: 500 }
        );
      }

      addrs = data || [];
      addressIds.forEach(aid => {
        const a = addrs.find((x: any) => x.id === aid);
        addrLabelMap.set(aid, label(a));
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
        if (feeErr) {
          logger.warn('fees-load-error', { error: feeErr.message });
        } else {
          (feeRows || []).forEach((r: any) => {
            const addr = r?.collection_address;
            const fee = r?.collection_fee_per_vehicle;
            const date = r?.collection_date ? String(r.collection_date) : '';
            if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date}`, Number(fee));
          });
        }
      }
    }

    const groups = addressIds.map(aid => {
      const lbl = addrLabelMap.get(aid) || '';
      // Para precificação, preferir data escolhida pelo cliente quando houver
      const clientDate = dateByAddress.get(aid) || '';
      const feeKey = `${lbl}|${clientDate}`;
      // Se não houver fee para a data do cliente, cair para fee sem data
      const fee = feeByAddrDate.get(feeKey) ?? feeByAddrDate.get(`${lbl}|`) ?? null;
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: byAddress.get(aid) || 0,
        collection_fee: fee,
        collection_date: clientDate || null,
      };
    });

    // Build approval groups (status = 'AGUARDANDO APROVAÇÃO DA COLETA'), split by date
    const approvalStatuses = ['AGUARDANDO APROVAÇÃO DA COLETA', 'SOLICITAÇÃO DE MUDANÇA DE DATA'];
    const { data: vehiclesApproval, error: vehApprErr } = await admin
      .from('vehicles')
      .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
      .eq('client_id', clientId)
      .in('status', approvalStatuses)
      .not('pickup_address_id', 'is', null);

    let approvalGroups: any[] = [];
    let approvalTotal: number = 0;
    if (!vehApprErr && vehiclesApproval && vehiclesApproval.length) {
      const byAddressDate = new Map<string, number>();
      const addressIds2 = new Set<string>();
      (vehiclesApproval || []).forEach((v: any) => {
        const aid = String(v.pickup_address_id);
        addressIds2.add(aid);
        const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : '';
        const key = `${aid}|${d}`;
        byAddressDate.set(key, (byAddressDate.get(key) || 0) + 1);
      });

      // Load labels for approval addresses
      const addrIdsArr = Array.from(addressIds2);
      const { data: addrs2 } = await admin
        .from('addresses')
        .select('id, street, number, city')
        .in('id', addrIdsArr);
      const addrLabelMap2 = new Map<string, string>();
      addrIdsArr.forEach(aid => {
        const a = (addrs2 || []).find((x: any) => x.id === aid);
        addrLabelMap2.set(aid, label(a));
      });

      // Load fees by address+date
      const labels2 = Array.from(addrLabelMap2.values()).filter(Boolean);
      const feeByAddrDate2 = new Map<string, number>(feeByAddrDate);
      if (labels2.length) {
        const { data: feeRows2, error: feeErr2 } = await admin
          .from('vehicle_collections')
          .select('collection_address, collection_fee_per_vehicle, collection_date')
          .eq('client_id', clientId)
          .eq('status', 'requested')
          .in('collection_address', labels2);
        if (!feeErr2) {
          (feeRows2 || []).forEach((r: any) => {
            const addr = r?.collection_address;
            const fee = r?.collection_fee_per_vehicle;
            const date = r?.collection_date ? String(r.collection_date) : '';
            if (addr && typeof fee === 'number') feeByAddrDate2.set(`${addr}|${date}`, Number(fee));
          });
        }
      }

      // Optional: status breakdown per address-date
      const statusMap: Record<string, Record<string, number>> = {};
      (vehiclesApproval || []).forEach((row: any) => {
        const aid = String(row.pickup_address_id);
        const d = row.estimated_arrival_date ? String(row.estimated_arrival_date) : '';
        const key = `${aid}|${d}`;
        const st = String(row.status || '').toUpperCase();
        statusMap[key] = statusMap[key] || {};
        statusMap[key][st] = (statusMap[key][st] || 0) + 1;
      });

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

    // Load client contract summary (include parqueamento, quilometragem)
    let clientSummary: any = null;
    try {
      const { data: clientRow } = await admin
        .from('clients')
        .select('taxa_operacao, percentual_fipe, parqueamento, quilometragem')
        .eq('profile_id', clientId)
        .maybeSingle();
      if (clientRow) clientSummary = clientRow;
    } catch {}

    // Build overall status totals for client's vehicles
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
      statusTotals = Object.entries(totals).map(([k, v]) => ({
        status: k as string,
        count: v as number,
      }));
    } catch {}

    // Load all collection records (all dates and values) for this client
    let collectionHistory: Array<{
      collection_address: string;
      collection_fee_per_vehicle: number | null;
      collection_date: string | null;
      status?: string;
      payment_received?: boolean;
      payment_received_at?: string | null;
    }> = [];
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
        status: r.status || undefined, // será substituído abaixo por status de veículo
        payment_received: !!r.payment_received,
        payment_received_at: r.payment_received_at ? String(r.payment_received_at) : null,
      }));
    } catch {}

    // Enriquecer o histórico com o status real dos veículos (por endereço|data)
    try {
      if (collectionHistory.length) {
        // 1) Carregar endereços do cliente e mapear label -> addressId
        const { data: addrsAll } = await admin
          .from('addresses')
          .select('id, street, number, city, profile_id')
          .eq('profile_id', clientId);
        const labelFn = (a: any) =>
          `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();
        const labelToId = new Map<string, string>();
        (addrsAll || []).forEach((a: any) => labelToId.set(labelFn(a), String(a.id)));

        // 2) Carregar todos os veículos do cliente (status/pickup/date)
        const { data: vehAll } = await admin
          .from('vehicles')
          .select('pickup_address_id, status, estimated_arrival_date')
          .eq('client_id', clientId);

        // 3) Indexar contagens por addressId|date
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

        // 4) Atribuir status consolidado ao histórico
        collectionHistory = collectionHistory.map(row => {
          const aid = labelToId.get(row.collection_address || '') || '';
          // usar a data do histórico se houver; senão, considerar sem data
          const d = row.collection_date ? String(row.collection_date) : '';
          const key = `${aid}|${d}`;
          const bucket = counts.get(key);
          if (!bucket || !Object.keys(bucket).length) {
            return { ...row, status: '-' };
          }
          // escolher o status mais frequente; se empatar, mantém o primeiro iterado
          let chosen = '';
          let max = -1;
          Object.entries(bucket).forEach(([st, n]) => {
            if (n > max) {
              max = n as number;
              chosen = st;
            }
          });
          // exibir o mais frequente; se houver múltiplos, indicar entre parênteses as variações
          const others = Object.entries(bucket)
            .filter(([st]) => st !== chosen)
            .map(([st, n]) => `${st} (${n})`)
            .join(', ');
          const display = others ? `${chosen} (+ ${others})` : chosen;
          return { ...row, status: display };
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      groups,
      approvalGroups,
      approvalTotal,
      approvedGroups,
      approvedTotal,
      clientSummary,
      statusTotals,
      collectionHistory,
    });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, context: any) {
  const wrapped = withAdminAuth(handler);
  return wrapped(request as any, context as any);
}
