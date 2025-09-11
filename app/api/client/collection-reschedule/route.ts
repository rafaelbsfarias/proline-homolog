import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:client:collection-reschedule');

function labelAddress(a: { street?: string; number?: string; city?: string }) {
  const street = a?.street?.trim() || '';
  const number = a?.number ? `, ${a.number}` : '';
  const city = a?.city ? ` - ${a.city}` : '';
  return `${street}${number}${city}`.trim();
}

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const { addressId, new_date } = await req.json();
    if (!addressId || !new_date) {
      return NextResponse.json({ error: 'addressId e new_date são obrigatórios' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // 1) Pegar label do endereço
    const { data: addr, error: aerr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();

    if (aerr || !addr) {
      return NextResponse.json({ error: 'Endereço inválido' }, { status: 400 });
    }
    const addressLabel = labelAddress(addr);

    // 2) Atualizar veículos do cliente nesse endereço
    const allowedPrev = [STATUS.AGUARDANDO_APROVACAO, STATUS.SOLICITACAO_MUDANCA_DATA];
    const { error: vehErr } = await admin
      .from('vehicles')
      .update({
        estimated_arrival_date: new_date,
        status: STATUS.APROVACAO_NOVA_DATA, // ✅ CORREÇÃO: Status correto para proposta do cliente
      })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .in('status', allowedPrev);

    if (vehErr) {
      logger.error('veh-update', { error: vehErr.message });
      return NextResponse.json({ error: 'Erro ao atualizar veículos' }, { status: 500 });
    }

    // 3) Buscar preço existente - busca mais robusta
    // PRIORIZAR collection com fee válido em vez de mais recente
    const { data: existingCollectionFirst, error: existingErr } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, status, collection_address')
      .eq('client_id', userId)
      .eq('collection_address', addressLabel)
      .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
      .gt('collection_fee_per_vehicle', 0) // PRIORIZAR registros com fee válido
      .order('updated_at', { ascending: false }) // Mais recente primeiro entre os que têm fee
      .limit(1)
      .maybeSingle();

    let existingCollection = existingCollectionFirst;

    // Se não encontrou com fee, tentar sem filtro de fee (fallback)
    if (!existingCollection) {
      logger.info('no_fee_found_trying_without_fee_filter', { clientId: userId, addressLabel });

      const { data: fallbackCollection } = await admin
        .from('vehicle_collections')
        .select('id, collection_fee_per_vehicle, status, collection_address')
        .eq('client_id', userId)
        .eq('collection_address', addressLabel)
        .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      existingCollection = fallbackCollection;
      logger.info('fallback_collection_found', {
        foundId: fallbackCollection?.id,
        fee: fallbackCollection?.collection_fee_per_vehicle,
      });
    }

    // Se ainda não encontrou, tentar com ILIKE para maior tolerância
    if (!existingCollection) {
      logger.info('trying_ilike_search', { clientId: userId, addressLabel });

      const { data: altCollection } = await admin
        .from('vehicle_collections')
        .select('id, collection_fee_per_vehicle, status, collection_address')
        .eq('client_id', userId)
        .ilike('collection_address', `%${addressLabel}%`)
        .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
        .gt('collection_fee_per_vehicle', 0) // Garantir que tem fee válido
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (altCollection?.collection_fee_per_vehicle) {
        existingCollection = altCollection;
        logger.info('ilike_search_success', {
          foundAddress: altCollection.collection_address,
          fee: altCollection.collection_fee_per_vehicle,
        });
      }
    }

    if (existingErr) {
      logger.error('existing-collection-query', { error: existingErr.message });
      return NextResponse.json({ error: 'Erro ao buscar coleção existente' }, { status: 500 });
    }

    // 🔧 CORREÇÃO: Atualizar/criar registro na vehicle_collections com a nova data
    logger.info('collection_reschedule_sync_start', {
      clientId: userId,
      addressLabel,
      newDate: new_date,
      existingFee: existingCollection?.collection_fee_per_vehicle,
      existingId: existingCollection?.id,
      hasExistingCollection: !!existingCollection,
    });

    if (existingCollection?.id) {
      // Atualizar registro existente mantendo o fee
      const { error: updateErr } = await admin
        .from('vehicle_collections')
        .update({
          collection_date: new_date,
          status: STATUS.REQUESTED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCollection.id);

      if (updateErr) {
        logger.error('collection_update_failed', { error: updateErr.message });
        return NextResponse.json({ error: 'Erro ao atualizar coleção' }, { status: 500 });
      }

      logger.info('collection_date_synchronized', {
        collectionId: existingCollection.id,
        newDate: new_date,
        preservedFee: existingCollection.collection_fee_per_vehicle,
      });

      // 🔧 CORREÇÃO: Remover outros registros duplicados SEM FEE para o mesmo endereço
      const { error: cleanupErr } = await admin
        .from('vehicle_collections')
        .delete()
        .eq('client_id', userId)
        .eq('collection_address', addressLabel)
        .neq('id', existingCollection.id)
        .is('collection_fee_per_vehicle', null);

      if (cleanupErr) {
        logger.warn('cleanup_failed', { error: cleanupErr.message });
      } else {
        logger.info('duplicate_collections_cleaned', { preservedId: existingCollection.id });
      }
    } else {
      // Criar novo registro (sem fee ainda)
      const { error: insertErr } = await admin.from('vehicle_collections').insert({
        client_id: userId,
        collection_address: addressLabel,
        collection_date: new_date,
        status: STATUS.REQUESTED,
        // Sem collection_fee_per_vehicle - será definido pelo admin
      });

      if (insertErr) {
        logger.error('collection_insert_failed', { error: insertErr.message });
        return NextResponse.json({ error: 'Erro ao criar coleção' }, { status: 500 });
      }

      logger.info('new_collection_created', {
        clientId: userId,
        addressLabel,
        newDate: new_date,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
