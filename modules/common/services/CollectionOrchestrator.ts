import { STATUS } from '@/modules/common/constants/status';
import { MetricsService } from '@/modules/common/services/MetricsService';
import { getLogger } from '@/modules/logger';
import { logFields } from '@/modules/common/utils/logging';

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

  /**
   * Cleanup orphan vehicle_collections in REQUESTED status with no vehicles linked
   * Supports optional scoping by client and/or address, excluding a given date,
   * limiting number of records, and dry-run mode.
   */
  static async cleanupOrphanedCollections(
    admin: AdminClient,
    params: {
      clientId?: string;
      addressLabel?: string;
      excludeDate?: string;
      limit?: number;
      dryRun?: boolean;
    }
  ): Promise<{ detected: number; deleted: number; items: any[]; dryRun: boolean }> {
    const { clientId, addressLabel, excludeDate, limit, dryRun = true } = params || {};
    const logger = getLogger('CollectionOrchestrator');
    const metrics = MetricsService.getInstance();

    // Load requested collections with optional filters
    let q = admin
      .from('vehicle_collections')
      .select('id, client_id, collection_address, collection_date, status')
      .eq('status', STATUS.REQUESTED);
    if (clientId) q = q.eq('client_id', clientId);
    if (addressLabel) q = q.eq('collection_address', addressLabel);
    if (excludeDate) q = q.neq('collection_date', excludeDate);
    if (limit && Number.isFinite(limit) && limit > 0) q = q.limit(Math.floor(limit));

    const { data: requested, error: reqErr } = await q;
    if (reqErr) throw reqErr;

    const ids = (requested || []).map((r: any) => r.id).filter(Boolean);
    if (!ids.length) {
      logger.info('cleanup_orphans_no_requested_found', {
        ...logFields({ client_id: clientId || null, address_label: addressLabel || null }),
      });
      return { detected: 0, deleted: 0, items: [], dryRun };
    }

    // Count vehicles per collection_id
    const { data: vehiclesRows, error: vErr } = await admin
      .from('vehicles')
      .select('id, collection_id')
      .in('collection_id', ids);
    if (vErr) throw vErr;

    const counts = new Map<string, number>();
    (vehiclesRows || []).forEach((r: any) => {
      const cid = String(r?.collection_id || '');
      if (!cid) return;
      counts.set(cid, (counts.get(cid) || 0) + 1);
    });

    const orphans = (requested || []).filter((r: any) => (counts.get(r.id) || 0) === 0);
    const detected = orphans.length;
    if (detected) metrics.inc('orphan_requested_detected', detected);

    if (dryRun || detected === 0) {
      logger.info('cleanup_orphans_dry_run', {
        ...logFields({ client_id: clientId || null, address_label: addressLabel || null }),
        detected,
      });
      return { detected, deleted: 0, items: orphans, dryRun: true };
    }

    const orphanIds = orphans.map((o: any) => o.id);
    const { error: delErr } = await admin
      .from('vehicle_collections')
      .delete()
      .in('id', orphanIds)
      .eq('status', STATUS.REQUESTED);
    if (delErr) throw delErr;

    metrics.inc('orphan_requested_cleaned', orphanIds.length);
    logger.info('cleanup_orphans_deleted', {
      ...logFields({ client_id: clientId || null, address_label: addressLabel || null }),
      deleted: orphanIds.length,
    });
    return { detected, deleted: orphanIds.length, items: orphans, dryRun: false };
  }
}
