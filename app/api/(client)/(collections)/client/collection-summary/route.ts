import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { formatAddressLabel } from '@/modules/common/utils/address';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:client:collection-summary');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Endpoint GET - Obter resumo das coleções do cliente
export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const admin = SupabaseService.getInstance().getAdminClient();

    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
      .eq('client_id', userId)
      .in('status', [
        STATUS.AGUARDANDO_APROVACAO,
        STATUS.SOLICITACAO_MUDANCA_DATA,
        STATUS.APROVACAO_NOVA_DATA,
      ])
      .not('pickup_address_id', 'is', null);

    if (vehErr) {
      logger.error('vehicles-error', { error: vehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    const byAddress = new Map<string, { count: number; original_date: string | null }>();
    (vehicles || []).forEach((v: any) => {
      const aid = String(v.pickup_address_id);
      const current = byAddress.get(aid) || { count: 0, original_date: v.estimated_arrival_date };
      byAddress.set(aid, { count: current.count + 1, original_date: current.original_date });
    });

    const addressIds = Array.from(byAddress.keys());
    if (!addressIds.length) {
      return NextResponse.json({
        success: true,
        approvalTotal: 0,
        count: 0,
        dates: [],
        groups: [],
      });
    }

    const { data: addrs, error: addrErr } = await admin
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

    const addrLabelMap = new Map<string, string>();
    addressIds.forEach(aid => {
      const a = (addrs || []).find((x: any) => x.id === aid);
      addrLabelMap.set(aid, formatAddressLabel(a));
    });

    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    const feeByAddrDate = new Map<string, number>();
    const proposedDateByAddr = new Map<string, string | null>();
    if (labels.length) {
      const { data: feeRows, error: feeErr } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', userId)
        .eq('status', STATUS.REQUESTED)
        .in('collection_address', labels);
      if (feeErr) {
        logger.warn('fees-load-error', { error: feeErr.message });
      } else {
        (feeRows || []).forEach((r: any) => {
          const addr = r?.collection_address;
          const fee = r?.collection_fee_per_vehicle;
          const date = r?.collection_date ? String(r.collection_date) : '';
          if (addr && typeof fee === 'number') feeByAddrDate.set(`${addr}|${date}`, Number(fee));
          if (addr) proposedDateByAddr.set(addr, date || null);
        });
      }
    }

    const groups = addressIds.map(aid => {
      const lbl = addrLabelMap.get(aid) || '';
      const info = byAddress.get(aid) || ({ count: 0, original_date: null } as any);
      const proposed = proposedDateByAddr.get(lbl) || null;
      const fee =
        feeByAddrDate.get(`${lbl}|${proposed || ''}`) ?? feeByAddrDate.get(`${lbl}|`) ?? null;
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: info.count,
        collection_fee: fee,
        collection_date: proposed,
        original_date: info.original_date || null,
      };
    });

    let approvalTotal = 0;
    let totalCount = 0;
    const dates: string[] = [];
    groups.forEach(g => {
      totalCount += g.vehicle_count;
      if (typeof g.collection_fee === 'number' && g.collection_date) {
        approvalTotal += g.collection_fee * g.vehicle_count;
        dates.push(g.collection_date);
      }
    });

    return NextResponse.json({
      success: true,
      approvalTotal,
      count: totalCount,
      dates: [...new Set(dates)],
      groups,
    });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});

// Endpoint POST - Reagendar coleta
export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const { addressId, new_date } = await req.json();
    if (!addressId || !new_date) {
      return NextResponse.json(
        { success: false, error: 'addressId e new_date são obrigatórios' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    const { data: addr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();
    const addressLabel = formatAddressLabel(addr);

    const { error: updVehErr } = await admin
      .from('vehicles')
      .update({ estimated_arrival_date: new_date, status: STATUS.APROVACAO_NOVA_DATA })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .in('status', [STATUS.AGUARDANDO_APROVACAO, STATUS.APROVACAO_NOVA_DATA]);
    if (updVehErr) {
      logger.error('vehicles-update-error', { error: updVehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar veículos' },
        { status: 500 }
      );
    }

    if (addressLabel) {
      await admin
        .from('vehicle_collections')
        .update({ collection_date: new_date })
        .eq('client_id', userId)
        .eq('collection_address', addressLabel)
        .in('status', [STATUS.REQUESTED, STATUS.APPROVED]);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
