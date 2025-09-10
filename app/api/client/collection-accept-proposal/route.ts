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

    // Determinar contexto e data alvo
    const rawVehicles = vehiclesResult.vehicles || [];
    const statuses = new Set((rawVehicles as any[]).map(v => String(v.status)));
    const hasSolicitacaoMudanca = statuses.has(STATUS.SOLICITACAO_MUDANCA_DATA);
    const hasAguardandoAprovacao = statuses.has(STATUS.AGUARDANDO_APROVACAO);
    const targetDate = (rawVehicles.find(v => v.estimated_arrival_date)?.estimated_arrival_date || '').slice(0, 10);

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
        // Encontrar collection REQUESTED exata por (cliente, endereço, data)
        const { data: collRow } = await admin
          .from('vehicle_collections')
          .select('id, status')
          .eq('client_id', userId)
          .eq('collection_address', addressLabel)
          .eq('collection_date', targetDate)
          .eq('status', STATUS.REQUESTED)
          .maybeSingle();

        const collId = collRow?.id as string | undefined;

        if (collId) {
          // 1) Vincular veículos a esta collection (garante contagem no histórico)
          const { error: linkErr } = await admin
            .from('vehicles')
            .update({ collection_id: collId })
            .eq('client_id', userId)
            .eq('pickup_address_id', addressId)
            .eq('estimated_arrival_date', targetDate);
          if (linkErr) logger.warn('link_vehicles_on_accept_failed', { error: linkErr.message, collId });

          // 2) Colocar veículos em AGUARDANDO COLETA (antes de aprovar)
          const { error: updVehiclesFinal } = await admin
            .from('vehicles')
            .update({ status: STATUS.AGUARDANDO_COLETA })
            .eq('client_id', userId)
            .eq('pickup_address_id', addressId)
            .eq('estimated_arrival_date', targetDate)
            .in('status', [STATUS.AGUARDANDO_APROVACAO, STATUS.SOLICITACAO_MUDANCA_DATA]);
          if (updVehiclesFinal) logger.warn('finalize_vehicles_status_failed', { error: updVehiclesFinal.message });

          // 3) Aprovar a collection (dispara trigger de histórico)
          const { error: updColErr } = await admin
            .from('vehicle_collections')
            .update({ status: STATUS.APPROVED })
            .eq('id', collId)
            .eq('status', STATUS.REQUESTED);
          if (updColErr) {
            logger.warn('approve_collection_failed', { error: updColErr.message, collId, addressLabel, targetDate });
          }
        } else if (hasSolicitacaoMudanca && !hasAguardandoAprovacao) {
          // Passo intermediário para não falhar (mantém compatibilidade)
          const { error: upd1 } = await admin
            .from('vehicles')
            .update({ status: STATUS.AGUARDANDO_APROVACAO })
            .eq('client_id', userId)
            .eq('pickup_address_id', addressId)
            .eq('status', STATUS.SOLICITACAO_MUDANCA_DATA);
          if (upd1) {
            logger.error('accept-admin-proposal-failed', { error: upd1.message, userId, addressId });
            return NextResponse.json(
              { success: false, error: 'Erro ao aceitar proposta do administrador' },
              { status: 500 }
            );
          }
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
