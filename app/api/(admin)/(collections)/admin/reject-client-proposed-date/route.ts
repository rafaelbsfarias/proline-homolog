import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { formatAddressLabel } from '@/modules/common/utils/address';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:admin:reject-client-proposed-date');

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

    // Obter label do endereço
    const { data: addr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();
    if (!addr) {
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }
    const addressLabel = formatAddressLabel(addr);

    // Verificar se existem veículos com proposta de mudança de data pendente
    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, status, estimated_arrival_date')
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.APROVACAO_NOVA_DATA);

    if (vehErr) {
      logger.error('vehicles-error', { error: vehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma proposta de mudança de data pendente para este endereço',
        },
        { status: 404 }
      );
    }

    // Reverter veículos para o status anterior (AGUARDANDO APROVAÇÃO DA COLETA)
    // Mantém a data original (estimated_arrival_date)
    const { error: updateErr } = await admin
      .from('vehicles')
      .update({ status: STATUS.AGUARDANDO_APROVACAO })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.APROVACAO_NOVA_DATA);

    if (updateErr) {
      logger.error('vehicles-update-error', { error: updateErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar status dos veículos' },
        { status: 500 }
      );
    }

    // Remover ou atualizar a entrada correspondente na vehicle_collections
    // Como é uma rejeição, removemos a proposta de mudança
    const { error: collectionErr } = await admin
      .from('vehicle_collections')
      .delete()
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .eq('status', STATUS.REQUESTED);

    if (collectionErr) {
      logger.warn('collection-delete-error', { error: collectionErr.message });
      // Não é erro crítico, continua
    }

    return NextResponse.json({
      success: true,
      message: 'Proposta de mudança de data rejeitada com sucesso',
    });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
