import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { formatAddressLabel } from '@/modules/common/utils/address';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:admin:accept-client-proposed-date');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { clientId, addressId } = await req.json();
    if (!clientId || !addressId) {
      return NextResponse.json(
        { success: false, error: 'clientId e addressId são obrigatórios' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Label do endereço
    const { data: addr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();
    if (!addr) {
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }
    const addressLabel = formatAddressLabel(addr);

    // Verificar se existe vehicle_collections com fee e data para esse endereço
    const { data: vcRow, error: vcErr } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, collection_date, status')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
      .order('collection_date', { ascending: false, nullsLast: true })
      .limit(1)
      .maybeSingle();
    if (vcErr) {
      logger.warn('load_collection_failed', { error: vcErr.message, clientId, addressLabel });
    }

    let finalRow = vcRow as any;
    if (
      !finalRow ||
      !(
        typeof finalRow.collection_fee_per_vehicle === 'number' &&
        finalRow.collection_fee_per_vehicle > 0
      )
    ) {
      // Fallback: tentar localizar por ILIKE no endereço (variações de label antigas)
      const { data: altRows } = await admin
        .from('vehicle_collections')
        .select('id, collection_fee_per_vehicle, collection_date, status, collection_address')
        .eq('client_id', clientId)
        .ilike('collection_address', addressLabel)
        .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
        .order('collection_date', { ascending: false, nullsLast: true })
        .limit(1);
      if (Array.isArray(altRows) && altRows.length) finalRow = altRows[0];
    }
    if (
      !finalRow ||
      !(
        typeof finalRow.collection_fee_per_vehicle === 'number' &&
        finalRow.collection_fee_per_vehicle > 0
      )
    ) {
      return NextResponse.json(
        { success: false, error: 'Precificação ausente para este endereço.' },
        { status: 400 }
      );
    }

    // Mover veículos de 'APROVAÇÃO NOVA DATA' para 'AGUARDANDO APROVAÇÃO DA COLETA'
    const { error: vehErr } = await admin
      .from('vehicles')
      .update({ status: STATUS.AGUARDANDO_APROVACAO })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.APROVACAO_NOVA_DATA);
    if (vehErr) {
      logger.error('vehicles-update-failed', { error: vehErr.message, clientId, addressId });
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar veículos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
