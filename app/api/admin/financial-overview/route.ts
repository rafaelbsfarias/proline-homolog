import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { STATUS } from '@/modules/common/constants/status';

type TotalsResponse = {
  collections_total: number; // BRL
  parking_total_today: number; // BRL
  approved_budgets_total: number; // BRL
  purchased_parts_total: number; // BRL
};

export const GET = withAdminAuth(async (_req: AuthenticatedRequest) => {
  const admin = SupabaseService.getInstance().getAdminClient();

  // 1) Collections total = sum(fee_per_vehicle * vehicles_count_per_collection) for APPROVED collections
  let collections_total = 0;
  try {
    const { data: collections } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, status')
      .eq('status', STATUS.APPROVED);

    const ids = (collections || []).map((c: any) => c.id).filter(Boolean);
    const feeById = new Map<string, number>();
    (collections || []).forEach((c: any) => {
      const fee =
        typeof c?.collection_fee_per_vehicle === 'number'
          ? Number(c.collection_fee_per_vehicle)
          : 0;
      if (c?.id) feeById.set(String(c.id), fee);
    });

    if (ids.length > 0) {
      const { data: vRows } = await admin
        .from('vehicles')
        .select('collection_id')
        .in('collection_id', ids);

      const countByCollection = new Map<string, number>();
      (vRows || []).forEach((r: any) => {
        const cid = String(r?.collection_id || '');
        if (!cid) return;
        countByCollection.set(cid, (countByCollection.get(cid) || 0) + 1);
      });

      collections_total = Array.from(countByCollection.entries()).reduce((sum, [cid, count]) => {
        const fee = feeById.get(cid) || 0;
        return sum + fee * count;
      }, 0);
    }
  } catch {
    collections_total = 0;
  }

  // 2) Parking total today = sum(client.parqueamento * parked_vehicle_count_for_client)
  // Consider parked vehicles as those with a service_order in category 'patio_atacado' and status 'in_progress'
  let parking_total_today = 0;
  try {
    // Query service_orders joined with service_categories to detect 'patio_atacado'
    const { data: soRows, error: soErr } = await admin
      .from('service_orders')
      .select(
        'client_id, vehicle_id, status, category_id, service_categories:category_id ( key, name )'
      )
      .eq('status', 'in_progress');
    if (soErr) throw soErr;

    const countsByClient = new Map<string, number>();
    const seenVehicleByClient = new Map<string, Set<string>>();
    (soRows || []).forEach((r: any) => {
      const cat = r?.service_categories;
      const key = String(cat?.key || '').toLowerCase();
      const name = String(cat?.name || '').toLowerCase();
      const isPatio = key === 'patio_atacado' || name.includes('pátio') || name.includes('patio');
      if (!isPatio) return;
      const cid = String(r?.client_id || '');
      const vid = String(r?.vehicle_id || '');
      if (!cid || !vid) return;
      if (!seenVehicleByClient.has(cid)) seenVehicleByClient.set(cid, new Set());
      const set = seenVehicleByClient.get(cid)!;
      if (!set.has(vid)) {
        set.add(vid);
        countsByClient.set(cid, (countsByClient.get(cid) || 0) + 1);
      }
    });

    const clientIds = Array.from(countsByClient.keys());
    if (clientIds.length > 0) {
      const { data: clientRows } = await admin
        .from('clients')
        .select('profile_id, parqueamento')
        .in('profile_id', clientIds);

      const parkByClient = new Map<string, number>();
      (clientRows || []).forEach((c: any) => {
        const fee = typeof c?.parqueamento === 'number' ? Number(c.parqueamento) : 0;
        parkByClient.set(String(c.profile_id), fee);
      });

      parking_total_today = clientIds.reduce((sum, cid) => {
        const count = countsByClient.get(cid) || 0;
        const daily = parkByClient.get(cid) || 0;
        return sum + daily * count;
      }, 0);
    }
  } catch {
    parking_total_today = 0;
  }

  // 3) Approved budgets total = sum(total_value) where quotes.status = 'approved'
  let approved_budgets_total = 0;
  try {
    const { data: sumRows } = await admin
      .from('quotes')
      .select('total_value', { head: false })
      .eq('status', 'approved');
    approved_budgets_total = (sumRows || []).reduce(
      (sum, r: any) => sum + (Number(r?.total_value) || 0),
      0
    );
  } catch {
    approved_budgets_total = 0;
  }

  // 4) Purchased parts total = sum(quantity * estimated_price) where status in ('ordered','received')
  let purchased_parts_total = 0;
  try {
    const { data: prRows } = await admin
      .from('part_requests')
      .select('quantity, estimated_price, status')
      .in('status', ['ordered', 'received']);
    purchased_parts_total = (prRows || []).reduce((sum, r: any) => {
      const qty = Number(r?.quantity) || 0;
      const price = Number(r?.estimated_price) || 0;
      return sum + qty * price;
    }, 0);
  } catch {
    purchased_parts_total = 0;
  }

  const result: TotalsResponse = {
    collections_total,
    parking_total_today,
    approved_budgets_total,
    purchased_parts_total,
  };

  return NextResponse.json(result);
});
