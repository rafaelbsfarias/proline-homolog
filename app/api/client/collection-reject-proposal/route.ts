import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { CollectionProposalService } from '@/modules/client/services/CollectionProposalService';

const logger = getLogger('api:client:collection-reject-proposal');
const collectionService = CollectionProposalService.getInstance();

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

    // Buscar veículos aguardando aprovação
    const vehiclesResult = await collectionService.findVehiclesAwaitingApproval({
      userId,
      addressId,
      adminClient: admin,
    });

    if (!vehiclesResult.success) {
      return NextResponse.json(
        { success: false, error: vehiclesResult.error },
        { status: vehiclesResult.error?.includes('Nenhum veículo') ? 404 : 500 }
      );
    }

    // Rejeitar proposta - reverter status dos veículos
    const rejectResult = await collectionService.rejectProposal({
      userId,
      addressId,
      adminClient: admin,
    });

    if (!rejectResult.success) {
      return NextResponse.json({ success: false, error: rejectResult.error }, { status: 500 });
    }

    // Buscar endereço e remover/atualizar a coleta
    const addressResult = await collectionService.findAddress({
      addressId,
      adminClient: admin,
    });

    if (addressResult.success && addressResult.address) {
      await collectionService.updateCollectionStatus({
        userId,
        addressId,
        adminClient: admin,
        address: addressResult.address,
        newStatus: 'delete', // Indica que deve deletar
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
