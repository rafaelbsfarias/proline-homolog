import { STATUS } from '@/modules/common/constants/status';

export type AdminClient = any;

export class CollectionOrchestrator {
  static async upsertCollection(
    admin: AdminClient,
    params: {
      clientId: string;
      addressLabel: string;
      dateIso: string;
      feePerVehicle: number;
    }
  ): Promise<{ collectionId: string }> {
    const { clientId, addressLabel, dateIso, feePerVehicle } = params;

    // Nunca tocar uma coleta já aprovada para a mesma (cliente, endereço, data)
    const { data: approvedExisting } = await admin
      .from('vehicle_collections')
      .select('id')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .eq('collection_date', dateIso)
      .eq('status', STATUS.APPROVED)
      .maybeSingle();
    if (approvedExisting?.id) {
      // Consumidores devem tratar como erro de regra de negócio
      throw new Error('approved_collection_already_exists_for_address_and_date');
    }

    const upsertPayload = {
      client_id: clientId,
      collection_address: addressLabel,
      collection_date: dateIso,
      collection_fee_per_vehicle: feePerVehicle,
      status: STATUS.REQUESTED,
    } as const;

    const { data: upserted, error: upsertErr } = await admin
      .from('vehicle_collections')
      .upsert(upsertPayload, {
        onConflict: 'client_id,collection_address,collection_date',
        ignoreDuplicates: false,
      })
      .select('id')
      .limit(1);
    if (upsertErr) throw upsertErr;
    const collectionId = upserted?.[0]?.id as string | undefined;
    if (!collectionId) throw new Error('collection_upsert_failed');
    return { collectionId };
  }

  static async syncVehicleDates(
    admin: AdminClient,
    params: {
      clientId: string;
      addressId: string;
      newDateIso: string;
      allowedStatuses?: string[];
    }
  ): Promise<void> {
    const { clientId, addressId, newDateIso, allowedStatuses } = params;
    const filterStatuses = allowedStatuses || [
      STATUS.PONTO_COLETA_SELECIONADO,
      STATUS.SOLICITACAO_MUDANCA_DATA,
      STATUS.AGUARDANDO_APROVACAO,
      STATUS.APROVACAO_NOVA_DATA,
    ];

    const { error } = await admin
      .from('vehicles')
      .update({ estimated_arrival_date: newDateIso })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .in('status', filterStatuses);
    if (error) throw error;
  }

  static async linkVehiclesToCollection(
    admin: AdminClient,
    params: {
      clientId: string;
      addressId: string;
      dateIso: string;
      collectionId: string;
      allowedStatuses?: string[];
    }
  ): Promise<void> {
    const { clientId, addressId, dateIso, collectionId, allowedStatuses } = params;
    const filterStatuses = allowedStatuses || [
      STATUS.PONTO_COLETA_SELECIONADO,
      STATUS.SOLICITACAO_MUDANCA_DATA,
      STATUS.AGUARDANDO_APROVACAO,
      STATUS.APROVACAO_NOVA_DATA,
    ];

    const { error } = await admin
      .from('vehicles')
      .update({ collection_id: collectionId })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .eq('estimated_arrival_date', dateIso)
      .in('status', filterStatuses);
    if (error) throw error;
  }

  static async approveCollection(admin: AdminClient, collectionId: string): Promise<void> {
    const { error } = await admin
      .from('vehicle_collections')
      .update({ status: STATUS.APPROVED })
      .eq('id', collectionId)
      .eq('status', STATUS.REQUESTED);
    if (error) throw error;
  }
}
