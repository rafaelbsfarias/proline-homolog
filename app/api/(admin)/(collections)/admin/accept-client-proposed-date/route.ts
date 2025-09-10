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

    // 1) Primeiro, verificar se há veículos com status APROVACAO_NOVA_DATA para este endereço
    // Isso nos dá a data proposta pelo cliente
    const { data: vehiclesWithNewDate, error: vehiclesErr } = await admin
      .from('vehicles')
      .select('id, estimated_arrival_date, status')
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.APROVACAO_NOVA_DATA);

    if (vehiclesErr) {
      logger.error('vehicles_query_failed', { error: vehiclesErr.message, clientId, addressId });
    }

    let proposedDate: string | null = null;
    if (vehiclesWithNewDate && vehiclesWithNewDate.length > 0) {
      // Usar a data do primeiro veículo (todos deveriam ter a mesma data proposta)
      proposedDate = vehiclesWithNewDate[0].estimated_arrival_date;
      logger.info('client_proposed_date_found', {
        clientId,
        addressId,
        proposedDate,
        vehiclesCount: vehiclesWithNewDate.length,
      });
    }

    // 🔧 CORREÇÃO: Busca aprimorada por precificação (sem dependência de data específica)
    logger.info('starting_improved_pricing_search', {
      clientId,
      addressId,
      addressLabel,
      proposedDate,
    });

    // Busca principal: por cliente + endereço (sem filtro de data)
    const { data: collections } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, collection_date, status, collection_address')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
      .gt('collection_fee_per_vehicle', 0) // Garantir fee válido
      .order('updated_at', { ascending: false }) // Mais recente primeiro
      .limit(1);

    let finalRow = collections?.[0] || null;

    // Se não encontrou, tentar busca com ILIKE (mais tolerante)
    if (!finalRow) {
      logger.warn('exact_match_failed_trying_ilike', {
        clientId,
        addressLabel,
      });

      const { data: altCollections } = await admin
        .from('vehicle_collections')
        .select('id, collection_fee_per_vehicle, collection_date, status, collection_address')
        .eq('client_id', clientId)
        .ilike('collection_address', `%${addressLabel}%`)
        .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
        .gt('collection_fee_per_vehicle', 0)
        .order('updated_at', { ascending: false })
        .limit(1);

      finalRow = altCollections?.[0] || null;

      if (finalRow) {
        logger.info('ilike_fallback_success', {
          collectionId: finalRow.id,
          foundAddress: finalRow.collection_address,
          searchedAddress: addressLabel,
        });
      }
    }

    // Não sincronizar data se a collection já estiver aprovada; preservar histórico
    if (
      finalRow &&
      proposedDate &&
      finalRow.collection_date !== proposedDate &&
      finalRow.status === STATUS.REQUESTED
    ) {
      logger.info('synchronizing_collection_date', {
        collectionId: finalRow.id,
        oldDate: finalRow.collection_date,
        newDate: proposedDate,
      });

      const { error: syncError } = await admin
        .from('vehicle_collections')
        .update({ collection_date: proposedDate })
        .eq('id', finalRow.id);

      if (syncError) {
        logger.error('date_synchronization_failed', {
          error: syncError.message,
          collectionId: finalRow.id,
        });
      } else {
        logger.info('date_synchronization_success', {
          collectionId: finalRow.id,
          synchronizedDate: proposedDate,
        });
      }
    }

    if (
      !finalRow ||
      !(
        typeof finalRow.collection_fee_per_vehicle === 'number' &&
        finalRow.collection_fee_per_vehicle > 0
      )
    ) {
      // LOG CRÍTICO: Momento exato onde decidimos mostrar o erro no accept
      logger.error('ACCEPT_FINAL_PRICE_VERIFICATION_FAILURE', {
        clientId,
        addressId,
        addressLabel,
        finalRowFound: !!finalRow,
        finalRowId: finalRow?.id,
        finalRowFee: finalRow?.collection_fee_per_vehicle,
        finalRowFeeType: typeof finalRow?.collection_fee_per_vehicle,
        errorMessage: 'Precificação ausente para este endereço.',
        troubleshooting: {
          check1: 'Verificar se o endereço foi precificado no admin',
          check2: 'Verificar se o client_id está correto',
          check3: 'Verificar se a formatação do endereço está consistente',
          check4: 'Verificar se o registro tem status válido (requested/approved)',
          check5: 'Verificar se há registros na tabela vehicle_collections',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Precificação ausente para este endereço.' },
        { status: 400 }
      );
    }

    logger.info('ACCEPT_PRICE_VERIFICATION_SUCCESS', {
      finalRowId: finalRow.id,
      finalRowFee: finalRow.collection_fee_per_vehicle,
      finalDecision: 'PROCEED_WITH_DATE_ACCEPTANCE',
    });

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
  } catch (e: unknown) {
    logger.error('unhandled', { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
