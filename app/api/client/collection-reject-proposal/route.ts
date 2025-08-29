import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:client:collection-reject-proposal');

// Endpoint POST - Rejeitar proposta de data para um endereço específico
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

    // Buscar veículos do endereço que estão aguardando aprovação
    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, status, estimated_arrival_date')
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.AGUARDANDO_APROVACAO);

    if (vehErr) {
      logger.error('vehicles-error', { error: vehErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum veículo encontrado para este endereço' },
        { status: 404 }
      );
    }

    // Reverter para a data original e status de solicitação de mudança
    const originalDate = vehicles[0]?.estimated_arrival_date;
    const { error: updateErr } = await admin
      .from('vehicles')
      .update({
        status: STATUS.SOLICITACAO_MUDANCA_DATA,
        estimated_arrival_date: originalDate,
      })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.AGUARDANDO_APROVACAO);

    if (updateErr) {
      logger.error('vehicles-update-error', { error: updateErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar status dos veículos' },
        { status: 500 }
      );
    }

    // Buscar e remover/atualizar a coleta correspondente
    const { data: address } = await admin
      .from('addresses')
      .select('street, number, city')
      .eq('id', addressId)
      .maybeSingle();

    if (address) {
      const addressLabel = `${address.street}, ${address.number} - ${address.city}`;

      const { error: collectionErr } = await admin
        .from('vehicle_collections')
        .delete()
        .eq('client_id', userId)
        .eq('collection_address', addressLabel)
        .eq('status', STATUS.REQUESTED);

      if (collectionErr) {
        logger.warn('collection-delete-error', { error: collectionErr.message });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
