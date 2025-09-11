import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { CollectionProposalService } from '@collections';
import { formatAddressLabel } from '@/modules/common/utils/address';
import { selectFeeForAddress } from '@/modules/common/utils/feeSelection';
import { CollectionOrchestrator } from '@collections';
import { logFields } from '@/modules/common/utils/logging';

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

    // Determinar contexto e data alvo
    const rawVehicles = vehiclesResult.vehicles || [];
    const statuses = new Set((rawVehicles as any[]).map(v => String(v.status)));
    const hasSolicitacaoMudanca = statuses.has(STATUS.SOLICITACAO_MUDANCA_DATA);
    const hasAguardandoAprovacao = statuses.has(STATUS.AGUARDANDO_APROVACAO);
    const targetDate = (
      rawVehicles.find(v => v.estimated_arrival_date)?.estimated_arrival_date || ''
    ).slice(0, 10);

    // Aceitar proposta - atualizar status dos veículos
    const acceptResult = await collectionService.acceptProposal({
      userId,
      addressId,
      adminClient: admin,
    });

    if (!acceptResult.success) {
      return NextResponse.json({ success: false, error: acceptResult.error }, { status: 500 });
    }

    // Buscar endereço e aprovar coleta (link + approve) garantindo histórico
    const addressResult = await collectionService.findAddress({
      addressId,
      adminClient: admin,
    });

    if (addressResult.success && addressResult.address) {
      const addressLabel = formatAddressLabel(addressResult.address);

      if (targetDate) {
        // Garantir collection REQUESTED para (cliente, endereço, data)
        let collectionId: string | undefined;
        const { data: collRow } = await admin
          .from('vehicle_collections')
          .select('id, status')
          .eq('client_id', userId)
          .eq('collection_address', addressLabel)
          .eq('collection_date', targetDate)
          .eq('status', STATUS.REQUESTED)
          .maybeSingle();
        collectionId = collRow?.id as string | undefined;

        if (!collectionId) {
          // Selecionar fee e criar requested se necessário
          const sel = await selectFeeForAddress(admin, userId, addressLabel);
          if (!sel.selectedFee) {
            return NextResponse.json(
              { success: false, error: 'Precifique o endereço antes de aprovar a coleta.' },
              { status: 400 }
            );
          }
          const up = await CollectionOrchestrator.upsertCollection(admin, {
            clientId: userId,
            addressLabel,
            dateIso: targetDate,
            feePerVehicle: sel.selectedFee,
          } as any);
          collectionId = up.collectionId;
        }

        // 1) Vincular veículos (garante contagem no histórico)
        await CollectionOrchestrator.linkVehiclesToCollection(admin, {
          clientId: userId,
          addressId,
          dateIso: targetDate,
          collectionId,
        });
        logger.info('client_accept_linked_vehicles', {
          ...logFields({
            client_id: userId,
            address_id: addressId,
            date: targetDate,
            collection_id: collectionId,
          }),
        });

        // 2) Colocar veículos em AGUARDANDO COLETA (antes de aprovar)
        const { error: updVehiclesFinal } = await admin
          .from('vehicles')
          .update({ status: STATUS.AGUARDANDO_COLETA })
          .eq('client_id', userId)
          .eq('pickup_address_id', addressId)
          .eq('estimated_arrival_date', targetDate)
          .in('status', [STATUS.AGUARDANDO_APROVACAO, STATUS.SOLICITACAO_MUDANCA_DATA]);
        if (updVehiclesFinal)
          logger.warn('finalize_vehicles_status_failed', {
            ...logFields({
              client_id: userId,
              address_id: addressId,
              date: targetDate,
              collection_id: collectionId,
            }),
            error: updVehiclesFinal.message,
          });

        // 3) Aprovar a collection (dispara trigger de histórico)
        await CollectionOrchestrator.approveCollection(admin, collectionId);
        logger.info('client_approved_collection', {
          ...logFields({
            client_id: userId,
            address_id: addressId,
            date: targetDate,
            collection_id: collectionId,
          }),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
