import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

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
    const addressLabel = `${addr.street || ''}${addr.number ? `, ${addr.number}` : ''}${
      addr.city ? ` - ${addr.city}` : ''
    }`.trim();

    // Verificar se existe vehicle_collections com fee e data para esse endereço
    const { data: vcRow } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, collection_date, status')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .eq('status', 'requested')
      .maybeSingle();

    if (
      !vcRow ||
      !(
        typeof vcRow.collection_fee_per_vehicle === 'number' && vcRow.collection_fee_per_vehicle > 0
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
      .update({ status: 'AGUARDANDO APROVAÇÃO DA COLETA' })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', 'APROVAÇÃO NOVA DATA');
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
