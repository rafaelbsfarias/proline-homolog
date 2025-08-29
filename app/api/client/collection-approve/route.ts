import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { formatAddressLabel } from '@/modules/common/utils/address';

const logger = getLogger('api:client:collection-approve');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const { addressId } = await req.json();
    if (!addressId) {
      return NextResponse.json(
        { success: false, error: 'addressId é obrigatório' },
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
    const addressLabel = formatAddressLabel(addr);

    // atualizar veículos
    const { error: updVehErr } = await admin
      .from('vehicles')
      .update({ status: STATUS.AGUARDANDO_COLETA })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .in('status', [STATUS.AGUARDANDO_APROVACAO, STATUS.APROVACAO_NOVA_DATA]);
    if (updVehErr) {
      logger.error('vehicles-update-error', { error: updVehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao aprovar coleta' },
        { status: 500 }
      );
    }

    // marcar collection como approved
    if (addressLabel) {
      await admin
        .from('vehicle_collections')
        .update({ status: STATUS.APPROVED })
        .eq('client_id', userId)
        .eq('collection_address', addressLabel)
        .eq('status', STATUS.REQUESTED);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
