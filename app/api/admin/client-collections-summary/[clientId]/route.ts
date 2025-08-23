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

    const admin = SupabaseService.getInstance().getAdminClient();

    // Load vehicles with selected pickup address
    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, client_id, status, pickup_address_id')
      .eq('client_id', clientId)
      .eq('status', 'PONTO DE COLETA SELECIONADO')
      .not('pickup_address_id', 'is', null);

    if (vehErr) {
      logger.error('vehicles-error', { error: vehErr.message });
      return NextResponse.json({ success: false, error: 'Erro ao buscar veículos' }, { status: 500 });
    }

    const byAddress = new Map<string, number>();
    (vehicles || []).forEach((v: any) => {
      const aid = v.pickup_address_id as string;
      byAddress.set(aid, (byAddress.get(aid) || 0) + 1);
    });

    const addressIds = Array.from(byAddress.keys());
    // Removida a condicional que retornava prematuramente
    
    // Load address labels
    let addrs: any[] = [];
    let addrLabelMap = new Map<string, string>();
    const label = (a: any) => `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();
    
    if (addressIds.length > 0) {
      const { data, error: addrErr } = await admin
        .from('addresses')
        .select('id, street, number, city')
        .in('id', addressIds);

      if (addrErr) {
        logger.error('addresses-error', { error: addrErr.message });
        return NextResponse.json({ success: false, error: 'Erro ao buscar endereços' }, { status: 500 });
      }
      
      addrs = data || [];
      addressIds.forEach(aid => {
        const a = addrs.find((x: any) => x.id === aid);
        addrLabelMap.set(aid, label(a));
      });
    }

    // Load any saved fees for these address labels
    let feeByLabel = new Map<string, number>();
    if (addressIds.length > 0) {
      const labels = Array.from(addrLabelMap.values()).filter(Boolean);
      if (labels.length) {
        const { data: feeRows, error: feeErr } = await admin
          .from('vehicle_collections')
          .select('collection_address, collection_fee_per_vehicle')
          .eq('client_id', clientId)
          .eq('status', 'requested')
          .in('collection_address', labels);
        if (feeErr) {
          logger.warn('fees-load-error', { error: feeErr.message });
        } else {
          (feeRows || []).forEach((r: any) => {
            const addr = r?.collection_address;
            const fee = r?.collection_fee_per_vehicle;
            if (addr && typeof fee === 'number') {
              feeByLabel.set(addr, Number(fee));
            }
          });
        }
      }
    }

    const groups = addressIds.map(aid => {
      const lbl = addrLabelMap.get(aid) || '';
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: byAddress.get(aid) || 0,
        collection_fee: feeByLabel.get(lbl) ?? null,
      };
    });

    // Build approval groups (status = 'AGUARDANDO APROVAÇÃO DA COLETA')
    const approvalStatus = 'AGUARDANDO APROVAÇÃO DA COLETA';
    const { data: vehiclesApproval, error: vehApprErr } = await admin
      .from('vehicles')
      .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
      .eq('client_id', clientId)
      .eq('status', approvalStatus)
      .not('pickup_address_id', 'is', null);

    let approvalGroups: any[] = [];
    let approvalTotal: number = 0;
    if (!vehApprErr && vehiclesApproval && vehiclesApproval.length) {
      const byAddress2 = new Map<string, number>();
      const dateByAddress: Record<string, string | null> = {};
      (vehiclesApproval || []).forEach((v: any) => {
        const aid = v.pickup_address_id as string;
        byAddress2.set(aid, (byAddress2.get(aid) || 0) + 1);
        const d = v.estimated_arrival_date ? String(v.estimated_arrival_date) : null;
        // prefer the earliest date if multiple; simple min by string works for YYYY-MM-DD
        if (d) {
          if (!dateByAddress[aid] || d < (dateByAddress[aid] as string)) {
            dateByAddress[aid] = d;
          }
        }
      });
      const addressIds2 = Array.from(byAddress2.keys());
      // Load labels for approval addresses
      const { data: addrs2 } = await admin
        .from('addresses')
        .select('id, street, number, city')
        .in('id', addressIds2);
      const addrLabelMap2 = new Map<string, string>();
      addressIds2.forEach(aid => {
        const a = (addrs2 || []).find((x: any) => x.id === aid);
        addrLabelMap2.set(aid, label(a));
      });
      // Load fees by label (reuse feeByLabel if same label)
      const labels2 = Array.from(addrLabelMap2.values()).filter(Boolean);
      const feeByLabel2 = new Map<string, number>(feeByLabel);
      if (labels2.length) {
        const { data: feeRows2, error: feeErr2 } = await admin
          .from('vehicle_collections')
          .select('collection_address, collection_fee_per_vehicle')
          .eq('client_id', clientId)
          .eq('status', 'requested')
          .in('collection_address', labels2);
        if (!feeErr2) {
          (feeRows2 || []).forEach((r: any) => {
            const addr = r?.collection_address; const fee = r?.collection_fee_per_vehicle;
            if (addr && typeof fee === 'number') feeByLabel2.set(addr, Number(fee));
          });
        }
      }
      // Load status breakdown per address
      const { data: statusRows } = await admin
        .from('vehicles')
        .select('pickup_address_id, status')
        .eq('client_id', clientId)
        .in('pickup_address_id', addressIds2);
      const statusMap: Record<string, Record<string, number>> = {};
      (statusRows || []).forEach((row: any) => {
        const aid = row.pickup_address_id as string; const st = String(row.status || '').toUpperCase();
        statusMap[aid] = statusMap[aid] || {};
        statusMap[aid][st] = (statusMap[aid][st] || 0) + 1;
      });
      approvalGroups = addressIds2.map(aid => {
        const lbl = addrLabelMap2.get(aid) || '';
        const count = byAddress2.get(aid) || 0;
        const fee = feeByLabel2.get(lbl) ?? null;
        const statuses = Object.entries(statusMap[aid] || {}).map(([status, count]) => ({ status, count }));
        if (typeof fee === 'number') approvalTotal += fee * count;
        const collection_date = dateByAddress[aid] || null;
        return { addressId: aid, address: lbl, vehicle_count: count, collection_fee: fee, statuses, collection_date };
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
        const st = String(row?.status || '').toUpperCase().trim();
        if (!st) return;
        totals[st] = ((totals[st] || 0) + 1)
      })
      statusTotals = Object.entries(totals).map(([k,v]) => ({ status: k as string, count: v as number }))
    } catch {}

    return NextResponse.json({ success: true, groups, approvalGroups, approvalTotal, clientSummary, statusTotals });
    

  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: Request, context: any) {
  const wrapped = withAdminAuth(handler);
  return wrapped(request as any, context as any);
}
