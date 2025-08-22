import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:client-collections-summary');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (req: AuthenticatedRequest, ctx: { params: { clientId: string } }) => {
  try {
    const { clientId } = ctx.params;
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
    if (!addressIds.length) {
      return NextResponse.json({ success: true, groups: [] });
    }

    // Load address labels
    const { data: addrs, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .in('id', addressIds);

    if (addrErr) {
      logger.error('addresses-error', { error: addrErr.message });
      return NextResponse.json({ success: false, error: 'Erro ao buscar endereços' }, { status: 500 });
    }

    const label = (a: any) => `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

    const groups = addressIds.map(aid => {
      const a = (addrs || []).find((x: any) => x.id === aid);
      return {
        addressId: aid,
        address: label(a),
        vehicle_count: byAddress.get(aid) || 0,
        collection_fee: null as number | null, // not defined yet
      };
    });

    return NextResponse.json({ success: true, groups });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
});

