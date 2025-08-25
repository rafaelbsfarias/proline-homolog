import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:collection-summary');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Endpoint GET - Obter resumo das coleções do cliente
export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const admin = SupabaseService.getInstance().getAdminClient();

    // Buscar veículos com status 'AGUARDANDO APROVAÇÃO DA COLETA'
    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
      .eq('client_id', userId)
      .eq('status', 'AGUARDANDO APROVAÇÃO DA COLETA')
      .not('pickup_address_id', 'is', null);

    if (vehErr) {
      logger.error('vehicles-error', { error: vehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    // Agrupar veículos por endereço de coleta
    const byAddress = new Map<string, { count: number; date: string | null }>();
    (vehicles || []).forEach((v: any) => {
      const aid = v.pickup_address_id as string;
      const current = byAddress.get(aid) || { count: 0, date: v.estimated_arrival_date };
      byAddress.set(aid, { count: current.count + 1, date: current.date });
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

    // Carregar labels dos endereços
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

    const label = (a: any) =>
      `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

    const addrLabelMap = new Map<string, string>();
    addressIds.forEach(aid => {
      const a = (addrs || []).find((x: any) => x.id === aid);
      addrLabelMap.set(aid, label(a));
    });

    // Carregar taxas salvas para esses endereços (mapeadas por endereco|data)
    const labels = Array.from(addrLabelMap.values()).filter(Boolean);
    const feeByAddrDate = new Map<string, number>();
    if (labels.length) {
      const { data: feeRows, error: feeErr } = await admin
        .from('vehicle_collections')
        .select('collection_address, collection_fee_per_vehicle, collection_date')
        .eq('client_id', userId)
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

    // Criar grupos
    const groups = addressIds.map(aid => {
      const lbl = addrLabelMap.get(aid) || '';
      const info = byAddress.get(aid) || { count: 0, date: null };
      const fee = feeByAddrDate.get(`${lbl}|${info.date || ''}`) ?? null;
      return {
        addressId: aid,
        address: lbl,
        vehicle_count: info.count,
        collection_fee: fee,
        collection_date: info.date,
      };
    });

    // Calcular total
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

    // label do endereço
    const { data: addr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();
    const addressLabel = addr
      ? `${addr.street || ''}${addr.number ? `, ${addr.number}` : ''}${addr.city ? ` - ${addr.city}` : ''}`.trim()
      : '';

    // atualizar veículos
    const { error: updVehErr } = await admin
      .from('vehicles')
      .update({ estimated_arrival_date: new_date, status: 'APROVAÇÃO NOVA DATA' })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .in('status', ['AGUARDANDO APROVAÇÃO DA COLETA', 'APROVAÇÃO NOVA DATA']);
    if (updVehErr) {
      logger.error('vehicles-update-error', { error: updVehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar veículos' },
        { status: 500 }
      );
    }

    // atualizar linha em vehicle_collections (se existir)
    if (addressLabel) {
      await admin
        .from('vehicle_collections')
        .update({ collection_date: new_date }) // mantém 'requested'
        .eq('client_id', userId)
        .eq('collection_address', addressLabel)
        .in('status', ['requested', 'approved']);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
