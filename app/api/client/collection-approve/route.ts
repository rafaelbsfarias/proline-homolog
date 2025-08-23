import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:collection-approve');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const { addressId } = await req.json();
    if (!addressId) {
      return NextResponse.json({ success: false, error: 'addressId é obrigatório' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // label do endereço
    const { data: addr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();
    const addressLabel = addr ? `${addr.street || ''}${addr.number ? `, ${addr.number}` : ''}${addr.city ? ` - ${addr.city}` : ''}`.trim() : '';

    // atualizar veículos
    const { error: updVehErr } = await admin
      .from('vehicles')
      .update({ status: 'COLETA APROVADA' })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .in('status', ['AGUARDANDO APROVAÇÃO DA COLETA', 'APROVAÇÃO NOVA DATA']);
    if (updVehErr) {
      logger.error('vehicles-update-error', { error: updVehErr.message });
      return NextResponse.json({ success: false, error: 'Erro ao aprovar coleta' }, { status: 500 });
    }

    // marcar collection como approved
    if (addressLabel) {
      await admin
        .from('vehicle_collections')
        .update({ status: 'approved' })
        .eq('client_id', userId)
        .eq('collection_address', addressLabel)
        .eq('status', 'requested');
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
