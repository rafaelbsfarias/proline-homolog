import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { formatAddressLabel, normalizeAddressLabel } from '@/modules/common/utils/address';

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

    // 2) Verificar existência de precificação (fee) antes de permitir propor data
    // CORREÇÃO SIMPLIFICADA: Buscar qualquer registro válido para o cliente e endereço
    const { data: collections, error: collectionsErr } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, status, collection_address')
      .eq('client_id', clientId)
      .in('status', ['requested', 'approved']);

    if (collectionsErr) {
      logger.error('load_collections_failed', {
        error: collectionsErr.message,
        clientId,
        addressLabel,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar coleções' },
        { status: 500 }
      );
    }

    // Filtrar apenas registros com fee válido (> 0)
    const validCollections =
      collections?.filter(
        (c: { collection_fee_per_vehicle: number }) =>
          typeof c.collection_fee_per_vehicle === 'number' && c.collection_fee_per_vehicle > 0
      ) || [];

    logger.info('price_verification_simplified', {
      clientId,
      addressLabel,
      totalCollections: collections?.length || 0,
      validCollections: validCollections.length,
      validCollectionsDetails: validCollections.map(
        (c: {
          id: string;
          collection_fee_per_vehicle: number;
          status: string;
          collection_address: string;
        }) => ({
          id: c.id,
          fee: c.collection_fee_per_vehicle,
          status: c.status,
          address: c.collection_address,
        })
      ),
    });

    if (validCollections.length === 0) {
      logger.warn('no_valid_collections_found', {
        clientId,
        addressLabel,
        totalCollections: collections?.length || 0,
      });

      return NextResponse.json(
        { success: false, error: 'Precifique o endereço antes de propor uma data de coleta.' },
        { status: 400 }
      );
    }

    // Usar a primeira coleção válida encontrada
    const vcRow = validCollections[0];

    logger.info('using_valid_collection', {
      collectionId: vcRow.id,
      collectionFee: vcRow.collection_fee_per_vehicle,
      collectionStatus: vcRow.status,
      collectionAddress: vcRow.collection_address,
    });

    // 3) Atualizar proposta de data na vehicle_collections existente
    if (vcRow?.id) {
      const { error } = await admin
        .from('vehicle_collections')
        .update({ collection_date: new_date })
        .eq('id', vcRow.id);
      if (error) {
        logger.error('update_collection_failed', { error: error.message, clientId, addressLabel });
        return NextResponse.json(
          { success: false, error: 'Falha ao atualizar proposta' },
          { status: 500 }
        );
      }

      // 🔧 CORREÇÃO: Sincronizar data nos veículos também
      logger.info('synchronizing_vehicle_dates', {
        clientId,
        addressId,
        newDate: new_date,
      });

      const { error: vehicleSyncError } = await admin
        .from('vehicles')
        .update({ estimated_arrival_date: new_date })
        .eq('client_id', clientId)
        .eq('pickup_address_id', addressId);

      if (vehicleSyncError) {
        logger.warn('vehicle_date_sync_failed', {
          error: vehicleSyncError.message,
          clientId,
          addressId,
        });
        // Não é erro crítico, continua
      } else {
        logger.info('vehicle_date_sync_success', {
          clientId,
          addressId,
          synchronizedDate: new_date,
        });
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
