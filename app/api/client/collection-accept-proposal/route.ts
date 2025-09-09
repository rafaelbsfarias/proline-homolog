import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { CollectionProposalService } from '@/modules/client/services/CollectionProposalService';
import { formatAddressLabel } from '@/modules/common/utils/address';

const logger = getLogger('api:client:collection-accept-proposal');
const collectionService = CollectionProposalService.getInstance();

// Endpoint POST - Aceitar proposta de data para um endereço específico
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

    // Determinar contexto: proposta do admin (SOLICITACAO_MUDANCA_DATA) vs aprovação final (AGUARDANDO_APROVACAO)
    const rawVehicles = vehiclesResult.vehicles || [];
    const statuses = new Set((rawVehicles as any[]).map(v => String(v.status)));
    const hasSolicitacaoMudanca = statuses.has(STATUS.SOLICITACAO_MUDANCA_DATA);
    const hasAguardandoAprovacao = statuses.has(STATUS.AGUARDANDO_APROVACAO);

    // Aceitar proposta - atualizar status dos veículos
    const acceptResult = await collectionService.acceptProposal({
      userId,
      addressId,
      adminClient: admin,
    });

    if (!acceptResult.success) {
      return NextResponse.json({ success: false, error: acceptResult.error }, { status: 500 });
    }

    // Buscar endereço e atualizar status da coleta
    const addressResult = await collectionService.findAddress({
      addressId,
      adminClient: admin,
    });

    if (addressResult.success && addressResult.address) {
      // Aprovação da coleta (final) só quando os veículos estavam em AGUARDANDO_APROVACAO
      if (hasAguardandoAprovacao) {
        const { error: findCollectionErr } = await admin
          .from('vehicle_collections')
          .select('id, status')
          .eq('client_id', userId)
          .eq('collection_address', formatAddressLabel(addressResult.address))
          .eq('status', STATUS.REQUESTED)
          .maybeSingle();

        if (!findCollectionErr) {
          await collectionService.updateCollectionStatus({
            userId,
            addressId,
            adminClient: admin,
            address: addressResult.address,
            newStatus: STATUS.APPROVED,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
