import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:mark-collection-paid');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Body =
  | { id: string; paid: boolean }
  | { clientId: string; address: string; date: string | null; paid: boolean };

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as Body | null;
    if (!body) {
      return NextResponse.json({ success: false, error: 'Corpo inválido' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    let paid: boolean;
    let q = admin.from('vehicle_collections').update({});

    if ('id' in body) {
      if (!body.id || typeof body.paid !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Parâmetros inválidos' },
          { status: 400 }
        );
      }
      paid = body.paid;
      q = q.eq('id', body.id);
    } else {
      const { clientId, address, date } = body;
      if (!clientId || !address || typeof body.paid !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Parâmetros inválidos' },
          { status: 400 }
        );
      }
      paid = body.paid;
      q = q.eq('client_id', clientId).eq('collection_address', address);
      if (date) q = q.eq('collection_date', date);
      else q = q.is('collection_date', null);
    }

    const patch: Record<string, any> = {
      payment_received: paid,
      payment_received_at: paid ? new Date().toISOString() : null,
    };
    if (paid) patch.status = 'paid';

    const { error } = await q.update(patch);
    if (error) {
      logger.error('update_error', { error: error.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar pagamento' },
        { status: 500 }
      );
    }

    // If payment was marked as received, update related vehicles to AGUARDANDO_COLETA
    if (paid) {
      try {
        // Re-load the collection rows we just updated so we can map labels -> collection ids
        const collectionRows: Array<{
          id: string;
          client_id: string;
          collection_address: string;
          collection_date: string | null;
        }> = [];
        if ('id' in body) {
          const { data: coll } = await admin
            .from('vehicle_collections')
            .select('id, client_id, collection_address, collection_date')
            .eq('id', (body as any).id)
            .maybeSingle();
          if (coll) collectionRows.push(coll as any);
        } else {
          const { clientId, address, date } = body as any;
          const q2 = admin
            .from('vehicle_collections')
            .select('id, client_id, collection_address, collection_date')
            .eq('client_id', clientId)
            .eq('collection_address', address);
          if (date) q2.eq('collection_date', date);
          else q2.is('collection_date', null);
          const { data: rows2 } = await q2;
          if (rows2 && rows2.length) collectionRows.push(...(rows2 as any));
        }

        // Also include any other collections that are now marked as payment_received for the same labels
        const labels = Array.from(new Set(collectionRows.map(r => r.collection_address)));
        if (labels.length) {
          const { data: more } = await admin
            .from('vehicle_collections')
            .select('id, client_id, collection_address, collection_date')
            .in('collection_address', labels)
            .eq('payment_received', true);
          if (more && more.length) collectionRows.push(...(more as any));
        }

        // Group by client + collection_address and collect collection ids
        const targets = new Map<
          string,
          { clientId: string; addressLabel: string; collectionIds: string[] }
        >();
        (collectionRows || []).forEach((r: any) => {
          const key = `${r.client_id}|${r.collection_address}`;
          const existing = targets.get(key) || {
            clientId: String(r.client_id),
            addressLabel: String(r.collection_address),
            collectionIds: [],
          };
          if (r.id) existing.collectionIds.push(String(r.id));
          targets.set(key, existing);
        });

        // For each target, find the pickup_address_id used by the client's vehicles that matches the label
        for (const t of targets.values()) {
          try {
            // 1) get distinct pickup_address_id values for this client
            const { data: vehAddrs, error: vehAddrsErr } = await admin
              .from('vehicles')
              .select('pickup_address_id')
              .eq('client_id', t.clientId)
              .not('pickup_address_id', 'is', null);
            if (vehAddrsErr) {
              logger.warn('load_client_vehicle_addresses_failed', {
                error: vehAddrsErr.message,
                clientId: t.clientId,
              });
              continue;
            }
            const addrIds = Array.from(
              new Set((vehAddrs || []).map((v: any) => String(v.pickup_address_id)))
            ).filter(Boolean);
            if (!addrIds.length) continue;

            // 2) load those addresses and find which one matches the collection label
            const { data: addrs } = await admin
              .from('addresses')
              .select('id, street, number, city')
              .in('id', addrIds);
            const labelFn = (a: any) =>
              `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();
            const matched = (addrs || []).find((a: any) => labelFn(a) === t.addressLabel);
            if (!matched) {
              logger.warn('address_label_not_found', {
                clientId: t.clientId,
                label: t.addressLabel,
              });
              continue;
            }
            const addrId = String(matched.id);

            // 3) update vehicles for this client/pickup_address_id -> set status and (if available) collection_id
            const collId = t.collectionIds.length ? t.collectionIds[0] : null;
            const updatePayload: any = { status: VehicleStatus.AGUARDANDO_COLETA };
            if (collId) updatePayload.collection_id = collId;

            const { error: vehErr } = await admin
              .from('vehicles')
              .update(updatePayload)
              .eq('client_id', t.clientId)
              .eq('pickup_address_id', addrId);
            if (vehErr)
              logger.warn('vehicle_update_error', {
                error: vehErr.message,
                clientId: t.clientId,
                addressId: addrId,
              });
          } catch (e) {
            logger.warn('target_vehicle_update_failed', {
              error: (e as any)?.message,
              clientId: t.clientId,
              label: t.addressLabel,
            });
          }
        }
      } catch (err) {
        logger.warn('post_payment_vehicle_update_failed', { error: (err as any)?.message });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
