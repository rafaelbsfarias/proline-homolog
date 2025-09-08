import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { formatAddressLabel } from '@/modules/common/utils/address';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:admin:set-address-collection-fees');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type FeeItem = { addressId: string; fee: number; date?: string };

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

    type AddressRow = {
      id: string;
      street: string;
      number: string;
      city: string;
    };

    const addressMap = new Map<string, AddressRow>();
    (addrs || []).forEach((addr: AddressRow) => {
      addressMap.set(addr.id, addr);
    });

    // 2) Montar upsert (client_id + collection_address) com fee + date
    const upsertPayload = fees.map(item => {
      const a = addressMap.get(item.addressId);
      const addrLabel = a ? formatAddressLabel(a) : '';
      return {
        client_id: clientId,
        collection_address: addrLabel,
        collection_fee_per_vehicle: item.fee,
        collection_date: item.date ?? null,
        status: STATUS.REQUESTED, // permanece solicitado até o cliente aprovar
        // Ensure we don't overwrite existing approved collections
        ...(item.date ? {} : { collection_date: null }),
      };
    });

    const { data: rows, error: upErr } = await admin
      .from('vehicle_collections')
      .upsert(upsertPayload, {
        onConflict: 'client_id,collection_address,collection_date',
        ignoreDuplicates: false,
      })
      .select('id, collection_address, status');

    if (upErr) {
      logger.error('upsert-error', { error: upErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar valores de coleta' },
        { status: 500 }
      );
    }

    // Mapa label -> collection_id retornado pelo upsert
    const labelToCollectionId = new Map<string, string>();
    (rows || []).forEach((r: { id: string; collection_address: string; status: string }) =>
      labelToCollectionId.set(String(r.collection_address), r.id)
    );

    // 3) Atualizar veículos após precificação
    //    -> PREÇOS: setar 'AGUARDANDO APROVAÇÃO DA COLETA' para quem está em 'PONTO DE COLETA SELECIONADO'
    //       Mesmo sem data (cliente já definiu uma estimativa), a aprovação do cliente vem depois.
    const eligible = (fees || []).filter(f => typeof f.fee === 'number');
    for (const f of eligible) {
      try {
        const addr = addressMap.get(f.addressId);
        if (!addr) continue;
        const addrLabel = formatAddressLabel(addr);
        const collId = labelToCollectionId.get(addrLabel) || null;

        const { error: updVehiclesErr } = await admin
          .from('vehicles')
          .update({
            status: STATUS.AGUARDANDO_APROVACAO, // ← Usar constante em vez de string literal
            ...(collId ? { collection_id: collId } : {}),
          })
          .eq('client_id', clientId)
          .eq('pickup_address_id', f.addressId)
          .eq('status', STATUS.PONTO_COLETA_SELECIONADO); // ← Usar constante
        if (updVehiclesErr) {
          logger.error('update-vehicles-status-error', {
            error: updVehiclesErr.message,
            clientId,
            addressId: f.addressId,
          });
        }
      } catch (e: unknown) {
        const error = e as Error;
        logger.error('update-vehicles-status-exception', {
          error: error?.message,
          clientId,
          addressId: f.addressId,
        });
      }
    }

    return NextResponse.json({ success: true, updated: upsertPayload.length });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
