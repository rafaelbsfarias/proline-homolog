import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:set-address-collection-fees');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const fees: Array<{ addressId: string; fee: number; date?: string }> = Array.isArray(body?.fees)
      ? body.fees
      : [];
    if (!clientId || !fees.length) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // 1) Carregar endereços para montar o label
    const addrIds = fees.map(f => f.addressId);
    const { data: addrs, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .in('id', addrIds);
    if (addrErr) {
      logger.error('addr-error', { error: addrErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar endereços' },
        { status: 500 }
      );
    }
    const label = (a: any) =>
      `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

    // 2) Montar upsert (client_id + collection_address) com fee + date
    const upsertPayload = fees.map(item => {
      const a = (addrs || []).find((x: any) => x.id === item.addressId);
      const addrLabel = label(a);
      return {
        client_id: clientId,
        collection_address: addrLabel,
        collection_fee_per_vehicle: item.fee,
        collection_date: item.date ?? null,
        status: 'requested', // volta/permanece como solicitado até o cliente aprovar
      };
    });

    const { data: rows, error: upErr } = await admin
      .from('vehicle_collections')
      .upsert(upsertPayload, { onConflict: 'client_id,collection_address' })
      .select('id, collection_address');

    if (upErr) {
      logger.error('upsert-error', { error: upErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar valores de coleta' },
        { status: 500 }
      );
    }

    // Mapa label -> collection_id retornado pelo upsert
    const labelToCollectionId = new Map<string, string>();
    (rows || []).forEach((r: any) => labelToCollectionId.set(String(r.collection_address), r.id));

    // 3) Atualizar veículos somente para itens com fee e date definidos
    //    -> status 'AGUARDANDO APROVAÇÃO DA COLETA', estimated_arrival_date e (opcional) collection_id
    const eligible = (fees || []).filter(f => typeof f.fee === 'number' && f.date);
    for (const f of eligible) {
      try {
        const addr = (addrs || []).find((x: any) => x.id === f.addressId);
        if (!addr) continue;
        const addrLabel = label(addr);
        const collId = labelToCollectionId.get(addrLabel) || null;

        const { error: updVehiclesErr } = await admin
          .from('vehicles')
          .update({
            status: 'AGUARDANDO APROVAÇÃO DA COLETA',
            estimated_arrival_date: f.date as any,
            ...(collId ? { collection_id: collId } : {}),
          })
          .eq('client_id', clientId)
          .eq('pickup_address_id', f.addressId);
        // se quiser forçar só quando vieram do passo anterior:
        // .eq('status', 'PONTO DE COLETA SELECIONADO')
        if (updVehiclesErr) {
          logger.error('update-vehicles-status-error', {
            error: updVehiclesErr.message,
            clientId,
            addressId: f.addressId,
          });
        }
      } catch (e: any) {
        logger.error('update-vehicles-status-exception', {
          error: e?.message,
          clientId,
          addressId: f.addressId,
        });
      }
    }

    return NextResponse.json({ success: true, updated: upsertPayload.length });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
