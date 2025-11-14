import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { STATUS } from '@/modules/common/constants/status';

type VehicleRevenue = {
  vehicle_id: string;
  plate: string;
  brand: string;
  model: string;
  total_revenue: number;
};

type ClientRevenue = {
  client_id: string;
  client_name: string;
  total_revenue: number;
  vehicle_count: number;
};

type PartnerRevenue = {
  partner_id: string;
  company_name: string;
  total_revenue: number;
  quote_count: number;
};

type QuotesByStatus = {
  finalized: number; // Faturamento realizado
  in_execution: number; // Em execução (projeção)
  pending: number; // Pendentes (projeção)
  total: number; // Total geral
};

type TotalsResponse = {
  collections_total: number; // BRL
  parking_total_today: number; // BRL
  quotes_by_status: QuotesByStatus; // Estratificação de orçamentos
  purchased_parts_total: number; // BRL
  by_vehicle?: VehicleRevenue[];
  by_client?: ClientRevenue[];
  by_partner?: PartnerRevenue[];
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

  // 3) Quotes by status (estratificação para faturamento e projeção)
  const quotes_by_status: QuotesByStatus = {
    finalized: 0,
    in_execution: 0,
    pending: 0,
    total: 0,
  };

  try {
    const { data: allQuotes } = await admin
      .from('quotes')
      .select('total_value, status', { head: false });

    (allQuotes || []).forEach((q: any) => {
      const value = Number(q?.total_value) || 0;
      const status = String(q?.status || '').toLowerCase();

      quotes_by_status.total += value;

      // Estratificação por status
      if (status === 'finalized') {
        quotes_by_status.finalized += value;
      } else if (status === 'in_execution' || status === 'in_progress') {
        quotes_by_status.in_execution += value;
      } else {
        // Todos os outros status são considerados pendentes (pending, pending_admin_approval, pending_client_approval, etc)
        quotes_by_status.pending += value;
      }
    });
  } catch {
    // Mantém valores zerados em caso de erro
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

  // 5) Revenue by vehicle (from all quotes - agnostic to status)
  const by_vehicle: VehicleRevenue[] = [];
  try {
    const { data: quoteRows } = await admin
      .from('quotes')
      .select(
        'total_value, service_order_id, service_orders ( vehicle_id, vehicles ( id, plate, brand, model ) )'
      );

    const revenueByVehicle = new Map<
      string,
      { plate: string; brand: string; model: string; revenue: number }
    >();

    (quoteRows || []).forEach((q: any) => {
      const value = Number(q?.total_value) || 0;
      const so = Array.isArray(q?.service_orders) ? q.service_orders[0] : q.service_orders;
      const vehicle = Array.isArray(so?.vehicles) ? so.vehicles[0] : so?.vehicles;

      if (vehicle?.id) {
        const existing = revenueByVehicle.get(vehicle.id);
        revenueByVehicle.set(vehicle.id, {
          plate: vehicle.plate || 'N/A',
          brand: vehicle.brand || 'N/A',
          model: vehicle.model || 'N/A',
          revenue: (existing?.revenue || 0) + value,
        });
      }
    });

    by_vehicle.push(
      ...Array.from(revenueByVehicle.entries()).map(([vid, data]) => ({
        vehicle_id: vid,
        plate: data.plate,
        brand: data.brand,
        model: data.model,
        total_revenue: data.revenue,
      }))
    );
    by_vehicle.sort((a, b) => b.total_revenue - a.total_revenue);
  } catch {
    // ignore
  }

  // 6) Revenue by client (from all quotes - agnostic to status)
  const by_client: ClientRevenue[] = [];
  try {
    const { data: quoteRows } = await admin
      .from('quotes')
      .select('total_value, service_order_id, service_orders ( client_id, vehicle_id )');

    const revenueByClient = new Map<string, { revenue: number; vehicleIds: Set<string> }>();

    (quoteRows || []).forEach((q: any) => {
      const value = Number(q?.total_value) || 0;
      const so = Array.isArray(q?.service_orders) ? q.service_orders[0] : q.service_orders;
      const clientId = so?.client_id;
      const vehicleId = so?.vehicle_id;

      if (clientId) {
        const existing = revenueByClient.get(clientId);
        if (!existing) {
          revenueByClient.set(clientId, {
            revenue: value,
            vehicleIds: new Set(vehicleId ? [vehicleId] : []),
          });
        } else {
          existing.revenue += value;
          if (vehicleId) existing.vehicleIds.add(vehicleId);
        }
      }
    });

    // Get client names (company_name from clients table)
    const clientIds = Array.from(revenueByClient.keys());
    if (clientIds.length > 0) {
      const { data: clientsData } = await admin
        .from('clients')
        .select('profile_id, company_name')
        .in('profile_id', clientIds);

      const clientNamesMap = new Map<string, string>();
      (clientsData || []).forEach((c: any) => {
        if (c?.profile_id && c?.company_name) {
          clientNamesMap.set(c.profile_id, c.company_name);
        }
      });

      by_client.push(
        ...Array.from(revenueByClient.entries()).map(([cid, data]) => ({
          client_id: cid,
          client_name: clientNamesMap.get(cid) || 'Cliente sem nome',
          total_revenue: data.revenue,
          vehicle_count: data.vehicleIds.size, // Apenas veículos com orçamentos
        }))
      );
    }

    by_client.sort((a, b) => b.total_revenue - a.total_revenue);
  } catch {
    // ignore
  }

  // 7) Revenue by partner (from all quotes - agnostic to status)
  const by_partner: PartnerRevenue[] = [];
  try {
    const { data: quoteRows } = await admin
      .from('quotes')
      .select('total_value, partner_id, partners ( company_name )');

    const revenueByPartner = new Map<string, { company: string; revenue: number; count: number }>();

    (quoteRows || []).forEach((q: any) => {
      const value = Number(q?.total_value) || 0;
      const partnerId = q?.partner_id;
      const partner = Array.isArray(q?.partners) ? q.partners[0] : q.partners;

      if (partnerId) {
        const existing = revenueByPartner.get(partnerId);
        revenueByPartner.set(partnerId, {
          company: partner?.company_name || 'Parceiro sem nome',
          revenue: (existing?.revenue || 0) + value,
          count: (existing?.count || 0) + 1,
        });
      }
    });

    by_partner.push(
      ...Array.from(revenueByPartner.entries()).map(([pid, data]) => ({
        partner_id: pid,
        company_name: data.company,
        total_revenue: data.revenue,
        quote_count: data.count,
      }))
    );
    by_partner.sort((a, b) => b.total_revenue - a.total_revenue);
  } catch {
    // ignore
  }

  const result: TotalsResponse = {
    collections_total,
    parking_total_today,
    quotes_by_status,
    purchased_parts_total,
    by_vehicle,
    by_client,
    by_partner,
  };

  return NextResponse.json(result);
});
