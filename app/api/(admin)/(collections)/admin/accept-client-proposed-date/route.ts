import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { formatAddressLabel } from '@/modules/common/utils/address';
import { selectFeeForAddress } from '@/modules/common/utils/feeSelection';
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

    // 2) Garantir collection REQUESTED para (address, proposedDate)
    if (!proposedDate) {
      return NextResponse.json(
        { success: false, error: 'Data proposta ausente para aceite' },
        { status: 400 }
      );
    }

    // Procurar collection existente exata
    const { data: existingRequested } = await admin
      .from('vehicle_collections')
      .select('id, status, collection_fee_per_vehicle')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .eq('collection_date', proposedDate)
      .eq('status', STATUS.REQUESTED)
      .maybeSingle();

    let collectionId = existingRequested?.id as string | undefined;
    let collectionFee = existingRequested?.collection_fee_per_vehicle as number | undefined;

    // Se não existe requested, criar uma (com fee selecionado por util compartilhado)
    if (!collectionId) {
      const sel = await selectFeeForAddress(admin, clientId, addressLabel);
      if (!sel.selectedFee) {
        return NextResponse.json(
          { success: false, error: 'Precifique o endereço antes de aprovar a coleta.' },
          { status: 400 }
        );
      }
      collectionFee = sel.selectedFee;
      const { data: inserted, error: insErr } = await admin
        .from('vehicle_collections')
        .insert({
          client_id: clientId,
          collection_address: addressLabel,
          collection_date: proposedDate,
          collection_fee_per_vehicle: collectionFee,
          status: STATUS.REQUESTED,
        })
        .select('id')
        .limit(1);
      if (insErr) {
        return NextResponse.json(
          { success: false, error: 'Falha ao criar coleta para aprovação' },
          { status: 500 }
        );
      }
      collectionId = inserted?.[0]?.id as string | undefined;
    }

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Falha ao identificar coleta para aprovação' },
        { status: 500 }
      );
    }

    // 3) Linkar veículos do endereço/data para esta collection
    const { error: linkErr } = await admin
      .from('vehicles')
      .update({ collection_id: collectionId })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('estimated_arrival_date', proposedDate);
    if (linkErr) {
      logger.warn('admin_accept_link_failed', { error: linkErr.message, collectionId });
    }

    // 4) Atualizar status dos veículos para 'COLETA APROVADA' (requisito de UI/Admin)
    const { error: vehFinal } = await admin
      .from('vehicles')
      .update({ status: 'COLETA APROVADA' })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('estimated_arrival_date', proposedDate)
      .in('status', [STATUS.APROVACAO_NOVA_DATA, STATUS.AGUARDANDO_APROVACAO]);
    if (vehFinal) {
      logger.warn('admin_accept_vehicle_status_failed', { error: vehFinal.message });
    }

    // 5) Aprovar a collection (dispara trigger de histórico)
    const { error: approveErr } = await admin
      .from('vehicle_collections')
      .update({ status: STATUS.APPROVED })
      .eq('id', collectionId)
      .eq('status', STATUS.REQUESTED);
    if (approveErr) {
      logger.warn('admin_accept_collection_approve_failed', { error: approveErr.message });
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
