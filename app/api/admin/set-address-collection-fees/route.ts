import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:set-address-collection-fees');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type FeeItem = { addressId: string; fee: number; date?: string };

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const fees: FeeItem[] = Array.isArray(body?.fees) ? body.fees : [];
    if (!clientId || !fees.length) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Load labels for provided addresses
    const addrIds = fees.map(f => f.addressId);
    const { data: addrs, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .in('id', addrIds);
    if (addrErr) {
      logger.error('addr-error', { error: addrErr.message });
      return NextResponse.json({ success: false, error: 'Erro ao buscar endereços' }, { status: 500 });
    }
    const label = (a: any) => `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

    let updated = 0;
    for (const item of fees) {
      const a = (addrs || []).find((x: any) => x.id === item.addressId);
      const addrLabel = label(a);
      if (!addrLabel) continue;

      // Find existing collection entry for this client + address label in 'requested' status
      const { data: existing, error: findErr } = await admin
        .from('vehicle_collections')
        .select('id')
        .eq('client_id', clientId)
        .eq('collection_address', addrLabel)
        .eq('status', 'requested')
        .maybeSingle();
      if (findErr) {
        logger.error('find-error', { error: findErr.message, clientId, addrLabel });
        continue;
      }
      if (existing) {
        const { error: updErr } = await admin
          .from('vehicle_collections')
          .update({ collection_fee_per_vehicle: item.fee, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (updErr) {
          logger.error('update-error', { error: updErr.message, id: existing.id });
          continue;
        }
        updated += 1;
      } else {
        const { error: insErr } = await admin
          .from('vehicle_collections')
          .insert({
            client_id: clientId,
            collection_address: addrLabel,
            collection_fee_per_vehicle: item.fee,
            status: 'requested',
          });
        if (insErr) {
          logger.error('insert-error', { error: insErr.message, clientId, addrLabel });
          continue;
        }
        updated += 1;
      }
    }


    // After saving fees, update vehicles statuses only for addresses with fee AND date
    const eligible = (fees || []).filter(f => typeof f.fee === 'number' && f.date);
    if (eligible.length) {
      for (const f of eligible) {
        try {
          const { error: updVehiclesErr } = await admin
            .from('vehicles')
            .update({ status: 'AGUARDANDO APROVAÇÃO DA COLETA', estimated_arrival_date: f.date as any })
            .eq('client_id', clientId)
            .eq('pickup_address_id', f.addressId)
            .eq('status', 'PONTO DE COLETA SELECIONADO');
          if (updVehiclesErr) {
            logger.error('update-vehicles-status-error', { error: updVehiclesErr.message, clientId, addressId: f.addressId });
          }
        } catch (e: any) {
          logger.error('update-vehicles-status-exception', { error: e?.message, clientId, addressId: f.addressId });
        }
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
});
