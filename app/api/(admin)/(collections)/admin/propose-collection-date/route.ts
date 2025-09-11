import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';
import { selectFeeForAddress } from '@/modules/common/utils/feeSelection';
import { CollectionOrchestrator } from '@/modules/common/services/CollectionOrchestrator';

const logger = getLogger('api:admin:propose-collection-date');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    logger.info('propose_collection_date_start', {
      timestamp: new Date().toISOString(),
      user: req.user?.email,
    });

    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const addressId: string | undefined = body?.addressId;
    const new_date: string | undefined = body?.new_date;

    logger.info('propose_collection_date_params', {
      clientId,
      addressId,
      new_date,
      hasClientId: !!clientId,
      hasAddressId: !!addressId,
      hasNewDate: !!new_date,
    });

    logger.info('propose_collection_date_start', {
      clientId,
      addressId,
      new_date,
      hasClientId: !!clientId,
      hasAddressId: !!addressId,
      hasNewDate: !!new_date,
    });

    if (!clientId || !addressId || !new_date) {
      return NextResponse.json(
        { success: false, error: 'clientId, addressId e new_date são obrigatórios' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // 1) Obter label do endereço
    const { data: addr, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();
    if (addrErr || !addr) {
      logger.error('address_not_found', { addressId, error: addrErr });
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }
    const addressLabel = formatAddressLabel(addr);
    const normalizedLabel = normalizeAddressLabel(addressLabel);

    logger.info('address_found', {
      addressId,
      addressLabel,
      normalizedLabel,
      addressData: addr,
    });

    // 2) Selecionar fee correto via util compartilhado
    let selectedFee: number | null = null;
    let selectedStrategy: 'approved' | 'non_zero' | 'none' = 'none';
    try {
      const sel = await selectFeeForAddress(admin, clientId, addressLabel);
      selectedFee = sel.selectedFee;
      selectedStrategy = sel.strategy;
    } catch (feeErr: any) {
      logger.error('load_collections_failed', {
        error: feeErr?.message,
        clientId,
        addressLabel,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar coleções' },
        { status: 500 }
      );
    }

    logger.info('propose_date_fee_selection', {
      clientId,
      addressLabel,
      selectedStrategy,
      selectedFee,
      note: 'fee selected via util',
    });

    if (!selectedFee) {
      return NextResponse.json(
        { success: false, error: 'Precifique o endereço antes de propor uma data de coleta.' },
        { status: 400 }
      );
    }

    // 3) Upsert idempotente via orquestrador
    let collectionId: string;
    try {
      const res = await CollectionOrchestrator.upsertCollection(admin, {
        clientId,
        addressLabel,
        dateIso: new_date,
        feePerVehicle: selectedFee,
      } as any);
      collectionId = res.collectionId;
      logger.info('propose_date_upsert_success', { collection_id: collectionId });
    } catch (e: any) {
      if (String(e?.message).includes('approved_collection_already_exists')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Já existe uma coleta aprovada para este endereço e data. Escolha outra data para a proposta.',
          },
          { status: 400 }
        );
      }
      logger.error('propose_date_upsert_failed', { error: e?.message });
      return NextResponse.json(
        { success: false, error: 'Falha ao salvar proposta' },
        { status: 500 }
      );
    }

    // 5) Sincronizar data apenas para veículos não-finalizados (evitar tocar histórico)
    logger.info('synchronizing_vehicle_dates', { clientId, addressId, newDate: new_date });
    let vehicleSyncError: any = null;
    try {
      await CollectionOrchestrator.syncVehicleDates(admin, {
        clientId,
        addressId,
        newDateIso: new_date,
      });
    } catch (e: any) {
      vehicleSyncError = e;
    }

    if (vehicleSyncError) {
      logger.warn('vehicle_date_sync_failed', {
        error: vehicleSyncError.message,
        clientId,
        addressId,
      });
    } else {
      logger.info('vehicle_date_sync_success', { clientId, addressId, synchronizedDate: new_date });
      // 5.1) Após sincronizar datas, vincular veículos à nova collection REQUESTED
      try {
        await CollectionOrchestrator.linkVehiclesToCollection(admin, {
          clientId,
          addressId,
          dateIso: new_date,
          collectionId,
        });
        logger.info('link_vehicles_after_sync_success', { collection_id: collectionId });
      } catch (e: any) {
        logger.warn('link_vehicles_after_sync_failed', {
          error: e?.message,
          collection_id: collectionId,
        });
      }

      // 5.2) Limpeza: remover collections REQUESTED sem veículos (órfãs) deste endereço (datas antigas)
      try {
        const { data: requestedCols } = await admin
          .from('vehicle_collections')
          .select('id, collection_date')
          .eq('client_id', clientId)
          .eq('collection_address', addressLabel)
          .eq('status', STATUS.REQUESTED)
          .neq('collection_date', new_date);
        for (const c of requestedCols || []) {
          const cid = c?.id as string;
          if (!cid) continue;
          const { data: anyVehicle } = await admin
            .from('vehicles')
            .select('id')
            .eq('collection_id', cid)
            .limit(1);
          if (!anyVehicle || anyVehicle.length === 0) {
            const { error: delErr } = await admin
              .from('vehicle_collections')
              .delete()
              .eq('id', cid)
              .eq('status', STATUS.REQUESTED);
            if (delErr) {
              logger.warn('orphan_collection_cleanup_failed', { cid, error: delErr.message });
            } else {
              logger.info('orphan_collection_removed', { cid, addressLabel });
            }
          }
        }
      } catch (e: unknown) {
        logger.warn('orphan_cleanup_error', { error: (e as Error)?.message });
      }
    }

    // 4) Atualizar veículos do cliente nesse endereço para indicar que há solicitação de mudança
    // Estratégia: detectar o contexto baseado no status atual dos veículos
    const { data: vehiclesInApproval } = await admin
      .from('vehicles')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('status', STATUS.APROVACAO_NOVA_DATA);

    // Debug: verificar todos os veículos para este endereço
    const { data: allVehiclesForAddress } = await admin
      .from('vehicles')
      .select('id, status, estimated_arrival_date')
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId);

    logger.info('vehicles_debug_info', {
      clientId,
      addressId,
      vehiclesInApprovalCount: vehiclesInApproval?.length || 0,
      allVehiclesForAddressCount: allVehiclesForAddress?.length || 0,
      allVehiclesForAddress: allVehiclesForAddress?.map(
        (v: { id: string; status: string; estimated_arrival_date: string }) => ({
          id: v.id,
          status: v.status,
          estimated_arrival_date: v.estimated_arrival_date,
        })
      ),
    });

    let allowedPrev: string[];
    let newStatus: string;

    if (vehiclesInApproval && vehiclesInApproval.length > 0) {
      // Estamos respondendo a uma proposta do cliente
      allowedPrev = [STATUS.APROVACAO_NOVA_DATA];
      newStatus = STATUS.SOLICITACAO_MUDANCA_DATA;
      logger.info('propose_collection_date_context', {
        context: 'responding_to_client',
        vehiclesInApprovalCount: vehiclesInApproval.length,
        allowedPrev,
        newStatus,
      });
    } else {
      // É uma proposta inicial do admin
      allowedPrev = [STATUS.PONTO_COLETA_SELECIONADO, STATUS.AGUARDANDO_APROVACAO];
      newStatus = STATUS.SOLICITACAO_MUDANCA_DATA;
      logger.info('propose_collection_date_context', {
        context: 'initial_admin_proposal',
        vehiclesInApprovalCount: 0,
        allowedPrev,
        newStatus,
      });
    }

    const { error: vehErr } = await admin
      .from('vehicles')
      .update({ status: newStatus })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .in('status', allowedPrev);

    // Log detalhado sobre a atualização dos veículos
    logger.info('vehicle_update_attempt', {
      clientId,
      addressId,
      allowedPrev,
      newStatus,
      updateError: vehErr?.message,
      updateCode: vehErr?.code,
    });

    if (vehErr) {
      // Se falhou a atualização, verificar se há veículos com status diferente
      const { data: allVehiclesCheck } = await admin
        .from('vehicles')
        .select('id, status')
        .eq('client_id', clientId)
        .eq('pickup_address_id', addressId);

      logger.error('vehicle_update_analysis', {
        error: vehErr.message,
        clientId,
        addressId,
        allowedPrev,
        newStatus,
        totalVehiclesForAddress: allVehiclesCheck?.length || 0,
        vehiclesByStatus: allVehiclesCheck?.reduce(
          (acc: Record<string, number>, v: { status: string }) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
          },
          {}
        ),
        suggestion: 'Check if vehicles have different status than expected',
      });

      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar veículos' },
        { status: 500 }
      );
    }

    logger.info('propose_collection_date_success', {
      clientId,
      addressId,
      new_date,
      context: vehiclesInApproval && vehiclesInApproval.length > 0 ? 'response' : 'initial',
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
