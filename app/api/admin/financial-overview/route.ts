import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { STATUS } from '@/modules/common/constants/status';

type VehicleRevenueItem = {
  id: string;
  type: 'collection' | 'parking' | 'quote' | 'delivery';
  description: string;
  amount: number;
  status?: string;
};

type VehicleRevenue = {
  vehicle_id: string;
  plate: string;
  brand: string;
  model: string;
  total_revenue: number;
  items?: VehicleRevenueItem[];
  client_name?: string;
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
  deliveries_total: number; // BRL - entregas aprovadas
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

  // 4.1) Deliveries total = sum(fee_amount) for completed/scheduled deliveries
  // Status 'scheduled' = cliente aprovou valor e está agendada (faturável)
  // Status 'delivered' = entrega concluída (faturado)
  let deliveries_total = 0;
  try {
    const { data: deliveryRows } = await admin
      .from('delivery_requests')
      .select('fee_amount, status, address_id')
      .in('status', ['scheduled', 'delivered'])
      .not('address_id', 'is', null);

    deliveries_total = (deliveryRows || []).reduce((sum, d: any) => {
      const fee = Number(d?.fee_amount) || 0;
      return sum + fee;
    }, 0);
  } catch {
    deliveries_total = 0;
  }

  // 5) Revenue by vehicle (from quotes + collections + parking) with detailed items
  const by_vehicle: VehicleRevenue[] = [];
  try {
    const revenueByVehicle = new Map<
      string,
      {
        plate: string;
        brand: string;
        model: string;
        client_name: string;
        items: VehicleRevenueItem[];
        revenue: number;
      }
    >();

    // Get quotes with vehicle and client info
    // service_orders tem vehicle_id e client_id direto
    const { data: quoteRows } = await admin.from('quotes').select(
      `id, total_value, status, service_order_id, 
         service_orders ( 
           vehicle_id, 
           client_id,
           vehicles ( id, plate, brand, model )
         )`
    );

    // Add quotes revenue with items
    (quoteRows || []).forEach((q: any) => {
      const value = Number(q?.total_value) || 0;
      if (value <= 0) return;

      const quoteId = q?.id;
      const status = String(q?.status || '');
      const so = Array.isArray(q?.service_orders) ? q.service_orders[0] : q.service_orders;
      const vehicle = Array.isArray(so?.vehicles) ? so.vehicles[0] : so?.vehicles;

      if (vehicle?.id) {
        const existing = revenueByVehicle.get(vehicle.id);
        if (!existing) {
          revenueByVehicle.set(vehicle.id, {
            plate: vehicle.plate || 'N/A',
            brand: vehicle.brand || 'N/A',
            model: vehicle.model || 'N/A',
            client_name: 'Cliente não identificado', // Será preenchido depois
            items: [
              {
                id: quoteId,
                type: 'quote',
                description: 'Serviços executados',
                amount: value,
                status,
              },
            ],
            revenue: value,
          });
        } else {
          existing.items.push({
            id: quoteId,
            type: 'quote',
            description: 'Serviços executados',
            amount: value,
            status,
          });
          existing.revenue += value;
        }
      }
    });

    // Buscar nomes dos clientes para preencher nos veículos que vieram das quotes
    // Coletar client_ids únicos das quotes
    const clientIdsFromQuotes = new Set<string>();
    (quoteRows || []).forEach((q: any) => {
      const so = Array.isArray(q?.service_orders) ? q.service_orders[0] : q.service_orders;
      if (so?.client_id) clientIdsFromQuotes.add(so.client_id);
    });

    if (clientIdsFromQuotes.size > 0) {
      const { data: clientsData } = await admin
        .from('clients')
        .select('profile_id, company_name')
        .in('profile_id', Array.from(clientIdsFromQuotes));

      const clientNamesMap = new Map<string, string>();
      (clientsData || []).forEach((c: any) => {
        clientNamesMap.set(c.profile_id, c.company_name);
      });

      // Atualizar client_name nos veículos do revenueByVehicle Map
      // Precisamos mapear vehicle_id -> client_id primeiro
      const vehicleClientMap = new Map<string, string>();
      (quoteRows || []).forEach((q: any) => {
        const so = Array.isArray(q?.service_orders) ? q.service_orders[0] : q.service_orders;
        const vehicle = Array.isArray(so?.vehicles) ? so.vehicles[0] : so?.vehicles;
        if (vehicle?.id && so?.client_id) {
          vehicleClientMap.set(vehicle.id, so.client_id);
        }
      });

      // Atualizar client_name
      revenueByVehicle.forEach((data, vehicleId) => {
        const clientId = vehicleClientMap.get(vehicleId);
        if (clientId && clientNamesMap.has(clientId)) {
          data.client_name = clientNamesMap.get(clientId) || 'Cliente não identificado';
        }
      });
    }

    // Add collection fees by vehicle with items
    const { data: collectionRows } = await admin
      .from('vehicle_collections')
      .select(
        'id, collection_fee_per_vehicle, status, vehicles ( id, plate, brand, model, client_id, clients ( company_name ) )'
      )
      .eq('status', STATUS.APPROVED);

    (collectionRows || []).forEach((collection: unknown) => {
      const collectionRecord = collection as Record<string, unknown>;
      const fee = Number(collectionRecord?.collection_fee_per_vehicle) || 0;
      const collectionId = collectionRecord?.id;
      const vehiclesData = collectionRecord?.vehicles;
      const vehicles = Array.isArray(vehiclesData) ? vehiclesData : [];

      vehicles.forEach((vehicle: unknown) => {
        const vRecord = vehicle as Record<string, unknown>;
        const vehicleId = vRecord?.id as string | undefined;
        const client = Array.isArray(vRecord?.clients) ? vRecord.clients[0] : vRecord?.clients;
        const clientRecord = client as Record<string, unknown> | undefined;

        if (vehicleId && fee > 0) {
          const existing = revenueByVehicle.get(vehicleId);
          if (!existing) {
            revenueByVehicle.set(vehicleId, {
              plate: (vRecord?.plate as string) || 'N/A',
              brand: (vRecord?.brand as string) || 'N/A',
              model: (vRecord?.model as string) || 'N/A',
              client_name: (clientRecord?.company_name as string) || 'Cliente não identificado',
              items: [
                {
                  id: `collection-${collectionId}-${vehicleId}`,
                  type: 'collection',
                  description: 'Coleta de veículo',
                  amount: fee,
                },
              ],
              revenue: fee,
            });
          } else {
            existing.items.push({
              id: `collection-${collectionId}-${vehicleId}`,
              type: 'collection',
              description: 'Coleta de veículo',
              amount: fee,
            });
            existing.revenue += fee;
          }
        }
      });
    });

    // Add parking fees by vehicle with items
    const { data: parkingRows } = await admin
      .from('service_orders')
      .select(
        'vehicle_id, client_id, created_at, status, vehicles ( id, plate, brand, model ), clients ( company_name ), service_categories:category_id ( key, name )'
      )
      .eq('status', 'in_progress');

    // Get client parking rates
    const clientIdsForParking = Array.from(
      new Set(
        (parkingRows || [])
          .map((r: unknown) => (r as Record<string, unknown>)?.client_id as string)
          .filter(Boolean)
      )
    );

    if (clientIdsForParking.length > 0) {
      const { data: clientsDataForParking } = await admin
        .from('clients')
        .select('profile_id, parqueamento')
        .in('profile_id', clientIdsForParking);

      const parkingRateByClient = new Map<string, number>();
      (clientsDataForParking || []).forEach((c: unknown) => {
        const cRecord = c as Record<string, unknown>;
        const profileId = cRecord?.profile_id as string;
        const rate = Number(cRecord?.parqueamento) || 0;
        if (profileId && rate > 0) {
          parkingRateByClient.set(profileId, rate);
        }
      });

      // Calculate parking fees per vehicle with items
      (parkingRows || []).forEach((r: unknown) => {
        const rRecord = r as Record<string, unknown>;
        const cat = rRecord?.service_categories as Record<string, unknown> | undefined;
        const key = String(cat?.key || '').toLowerCase();
        const name = String(cat?.name || '').toLowerCase();
        const isPatio = key === 'patio_atacado' || name.includes('pátio') || name.includes('patio');

        if (!isPatio) return;

        const vehicleData = rRecord?.vehicles;
        const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;
        const vRecord = vehicle as Record<string, unknown> | undefined;
        const vehicleId = vRecord?.id as string | undefined;
        const clientId = rRecord?.client_id as string | undefined;
        const createdAt = rRecord?.created_at as string | undefined;
        const clientData = rRecord?.clients;
        const client = Array.isArray(clientData) ? clientData[0] : clientData;
        const clientRecord = client as Record<string, unknown> | undefined;

        if (vehicleId && clientId && createdAt) {
          const rate = parkingRateByClient.get(clientId) || 0;
          if (rate > 0) {
            const created = new Date(createdAt).getTime();
            const now = Date.now();
            const days = Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
            const parkingRevenue = rate * days;

            const existing = revenueByVehicle.get(vehicleId);
            if (!existing) {
              revenueByVehicle.set(vehicleId, {
                plate: (vRecord?.plate as string) || 'N/A',
                brand: (vRecord?.brand as string) || 'N/A',
                model: (vRecord?.model as string) || 'N/A',
                client_name: (clientRecord?.company_name as string) || 'Cliente não identificado',
                items: [
                  {
                    id: `parking-${vehicleId}`,
                    type: 'parking',
                    description: `Parqueamento (${days} dia${days > 1 ? 's' : ''})`,
                    amount: parkingRevenue,
                  },
                ],
                revenue: parkingRevenue,
              });
            } else {
              existing.items.push({
                id: `parking-${vehicleId}`,
                type: 'parking',
                description: `Parqueamento (${days} dia${days > 1 ? 's' : ''})`,
                amount: parkingRevenue,
              });
              existing.revenue += parkingRevenue;
            }
          }
        }
      });
    }

    // Add delivery fees by vehicle with items
    // Status 'scheduled' = cliente aprovou e está agendada (faturável)
    // Status 'delivered' = entrega concluída (faturada)
    const { data: deliveryRows } = await admin
      .from('delivery_requests')
      .select(
        'id, fee_amount, status, vehicle_id, client_id, address_id, vehicles ( id, plate, brand, model ), clients ( company_name )'
      )
      .in('status', ['scheduled', 'delivered'])
      .not('address_id', 'is', null); // Apenas entregas (com endereço)

    (deliveryRows || []).forEach((delivery: unknown) => {
      const deliveryRecord = delivery as Record<string, unknown>;
      const fee = Number(deliveryRecord?.fee_amount) || 0;
      const deliveryId = deliveryRecord?.id;
      const vehicleData = deliveryRecord?.vehicles;
      const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;
      const vRecord = vehicle as Record<string, unknown> | undefined;
      const vehicleId = vRecord?.id as string | undefined;
      const clientData = deliveryRecord?.clients;
      const client = Array.isArray(clientData) ? clientData[0] : clientData;
      const clientRecord = client as Record<string, unknown> | undefined;

      if (vehicleId && fee > 0) {
        const existing = revenueByVehicle.get(vehicleId);
        if (!existing) {
          revenueByVehicle.set(vehicleId, {
            plate: (vRecord?.plate as string) || 'N/A',
            brand: (vRecord?.brand as string) || 'N/A',
            model: (vRecord?.model as string) || 'N/A',
            client_name: (clientRecord?.company_name as string) || 'Cliente não identificado',
            items: [
              {
                id: `delivery-${deliveryId}`,
                type: 'delivery',
                description: 'Entrega de veículo',
                amount: fee,
              },
            ],
            revenue: fee,
          });
        } else {
          existing.items.push({
            id: `delivery-${deliveryId}`,
            type: 'delivery',
            description: 'Entrega de veículo',
            amount: fee,
          });
          existing.revenue += fee;
        }
      }
    });

    by_vehicle.push(
      ...Array.from(revenueByVehicle.entries()).map(([vid, data]) => ({
        vehicle_id: vid,
        plate: data.plate,
        brand: data.brand,
        model: data.model,
        client_name: data.client_name,
        total_revenue: data.revenue,
        items: data.items,
      }))
    );
    by_vehicle.sort((a, b) => b.total_revenue - a.total_revenue);
  } catch {
    // Ignore error but continue - by_vehicle will be empty array
  }

  // 6) Revenue by client (from quotes + collections + parking)
  const by_client: ClientRevenue[] = [];
  try {
    const { data: quoteRows } = await admin
      .from('quotes')
      .select('total_value, service_order_id, service_orders ( client_id, vehicle_id )');

    const revenueByClient = new Map<string, { revenue: number; vehicleIds: Set<string> }>();

    // Add quotes revenue
    (quoteRows || []).forEach((q: unknown) => {
      const qRecord = q as Record<string, unknown>;
      const value = Number(qRecord?.total_value) || 0;
      const soData = qRecord?.service_orders;
      const so = Array.isArray(soData) ? soData[0] : soData;
      const soRecord = so as Record<string, unknown> | undefined;
      const clientId = soRecord?.client_id as string | undefined;
      const vehicleId = soRecord?.vehicle_id as string | undefined;

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

    // Add collection fees
    const { data: collectionRows } = await admin
      .from('vehicle_collections')
      .select('id, client_id, collection_fee_per_vehicle, status, vehicles ( id )')
      .eq('status', STATUS.APPROVED);

    (collectionRows || []).forEach((collection: unknown) => {
      const collectionRecord = collection as Record<string, unknown>;
      const clientId = collectionRecord?.client_id as string | undefined;
      const fee = Number(collectionRecord?.collection_fee_per_vehicle) || 0;
      const vehiclesData = collectionRecord?.vehicles;
      const vehicles = Array.isArray(vehiclesData) ? vehiclesData : [];
      const vehicleCount = vehicles.length;

      if (clientId && fee > 0 && vehicleCount > 0) {
        const collectionTotal = fee * vehicleCount;
        const existing = revenueByClient.get(clientId);
        if (!existing) {
          revenueByClient.set(clientId, {
            revenue: collectionTotal,
            vehicleIds: new Set(
              vehicles
                .map((v: unknown) => (v as Record<string, unknown>).id as string)
                .filter(Boolean)
            ),
          });
        } else {
          existing.revenue += collectionTotal;
          vehicles.forEach((v: unknown) => {
            const vId = (v as Record<string, unknown>).id as string | undefined;
            if (vId) existing.vehicleIds.add(vId);
          });
        }
      }
    });

    // Add parking fees
    const { data: parkingRows } = await admin
      .from('service_orders')
      .select(
        'client_id, vehicle_id, status, created_at, service_categories:category_id ( key, name )'
      )
      .eq('status', 'in_progress');

    // Get client parking rates
    const allClientIds = Array.from(
      new Set([
        ...Array.from(revenueByClient.keys()),
        ...(parkingRows || [])
          .map((r: unknown) => (r as Record<string, unknown>)?.client_id as string)
          .filter(Boolean),
      ])
    );

    const { data: clientsDataForParking } = await admin
      .from('clients')
      .select('profile_id, parqueamento')
      .in('profile_id', allClientIds);

    const parkingRateByClient = new Map<string, number>();
    (clientsDataForParking || []).forEach((c: unknown) => {
      const cRecord = c as Record<string, unknown>;
      const profileId = cRecord?.profile_id as string;
      const rate = Number(cRecord?.parqueamento) || 0;
      if (profileId && rate > 0) {
        parkingRateByClient.set(profileId, rate);
      }
    });

    // Calculate parking fees per client
    const parkingByClient = new Map<string, { days: number; vehicleIds: Set<string> }>();
    (parkingRows || []).forEach((r: unknown) => {
      const rRecord = r as Record<string, unknown>;
      const cat = rRecord?.service_categories as Record<string, unknown> | undefined;
      const key = String(cat?.key || '').toLowerCase();
      const name = String(cat?.name || '').toLowerCase();
      const isPatio = key === 'patio_atacado' || name.includes('pátio') || name.includes('patio');

      if (!isPatio) return;

      const clientId = rRecord?.client_id as string | undefined;
      const vehicleId = rRecord?.vehicle_id as string | undefined;
      const createdAt = rRecord?.created_at as string | undefined;

      if (clientId && vehicleId && createdAt) {
        const created = new Date(createdAt).getTime();
        const now = Date.now();
        const days = Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));

        const existing = parkingByClient.get(clientId);
        if (!existing) {
          parkingByClient.set(clientId, { days, vehicleIds: new Set([vehicleId]) });
        } else {
          existing.days += days;
          existing.vehicleIds.add(vehicleId);
        }
      }
    });

    // Add parking revenue to revenueByClient
    parkingByClient.forEach((data, clientId) => {
      const rate = parkingRateByClient.get(clientId) || 0;
      if (rate > 0) {
        const parkingRevenue = rate * data.days;
        const existing = revenueByClient.get(clientId);
        if (!existing) {
          revenueByClient.set(clientId, {
            revenue: parkingRevenue,
            vehicleIds: data.vehicleIds,
          });
        } else {
          existing.revenue += parkingRevenue;
          data.vehicleIds.forEach(vid => existing.vehicleIds.add(vid));
        }
      }
    });

    // Add delivery fees by client
    // Status 'scheduled' = cliente aprovou e está agendada (faturável)
    // Status 'delivered' = entrega concluída (faturada)
    const { data: deliveryRowsByClient } = await admin
      .from('delivery_requests')
      .select('id, fee_amount, status, vehicle_id, client_id, address_id')
      .in('status', ['scheduled', 'delivered'])
      .not('address_id', 'is', null); // Apenas entregas (com endereço)

    (deliveryRowsByClient || []).forEach((delivery: unknown) => {
      const deliveryRecord = delivery as Record<string, unknown>;
      const fee = Number(deliveryRecord?.fee_amount) || 0;
      const clientId = deliveryRecord?.client_id as string | undefined;
      const vehicleId = deliveryRecord?.vehicle_id as string | undefined;

      if (clientId && vehicleId && fee > 0) {
        const existing = revenueByClient.get(clientId);
        if (!existing) {
          revenueByClient.set(clientId, {
            revenue: fee,
            vehicleIds: new Set([vehicleId]),
          });
        } else {
          existing.revenue += fee;
          existing.vehicleIds.add(vehicleId);
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
      (clientsData || []).forEach((c: unknown) => {
        const cRecord = c as Record<string, unknown>;
        if (cRecord?.profile_id && cRecord?.company_name) {
          clientNamesMap.set(cRecord.profile_id as string, cRecord.company_name as string);
        }
      });

      by_client.push(
        ...Array.from(revenueByClient.entries()).map(([cid, data]) => ({
          client_id: cid,
          client_name: clientNamesMap.get(cid) || 'Cliente sem nome',
          total_revenue: data.revenue,
          vehicle_count: data.vehicleIds.size,
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
    deliveries_total,
    by_vehicle,
    by_client,
    by_partner,
  };

  return NextResponse.json(result);
});
