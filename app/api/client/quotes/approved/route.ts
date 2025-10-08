import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:quotes:approved');

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const clientId = req.user.id;

    if (!clientId) {
      logger.error('client_id_not_found');
      return NextResponse.json({ error: 'ID do cliente não encontrado' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Buscar veículos do cliente
    const { data: vehicles, error: vehiclesErr } = await admin
      .from('vehicles')
      .select('id, plate, brand, model')
      .eq('client_id', clientId);

    if (vehiclesErr) {
      logger.error('failed_fetch_vehicles', { error: vehiclesErr });
      return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
    }

    interface Vehicle {
      id: string;
      plate: string;
      brand: string;
      model: string;
    }

    const vehicleIds = vehicles?.map((v: { id: string }) => v.id) || [];
    const vehicleMap = new Map<string, { plate: string; brand: string; model: string }>(
      vehicles?.map((v: Vehicle) => [v.id, { plate: v.plate, brand: v.brand, model: v.model }]) ||
        []
    );

    if (vehicleIds.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    // Buscar service_orders dos veículos
    const { data: serviceOrders, error: soErr } = await admin
      .from('service_orders')
      .select('id, vehicle_id')
      .in('vehicle_id', vehicleIds);

    if (soErr) {
      logger.error('failed_fetch_service_orders', { error: soErr });
      return NextResponse.json({ error: 'Erro ao buscar ordens de serviço' }, { status: 500 });
    }

    const serviceOrderIds = serviceOrders?.map((so: { id: string }) => so.id) || [];
    const soVehicleMap = new Map<string, string>(
      serviceOrders?.map((so: { id: string; vehicle_id: string }) => [so.id, so.vehicle_id]) || []
    );

    if (serviceOrderIds.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    // Buscar quotes aprovados pelo cliente (onde client_approved_at não é NULL)
    const { data: quotes, error: quotesErr } = await admin
      .from('quotes')
      .select(
        `
        id,
        status,
        total_value,
        service_order_id,
        created_at,
        client_approved_at,
        client_approved_items
      `
      )
      .in('service_order_id', serviceOrderIds)
      .not('client_approved_at', 'is', null)
      .order('client_approved_at', { ascending: false });

    if (quotesErr) {
      logger.error('failed_fetch_quotes', { error: quotesErr });
      return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
    }

    // Para cada quote, buscar os itens aprovados e calcular o valor real
    const formattedQuotes = await Promise.all(
      quotes?.map(
        async (quote: {
          id: string;
          status: string;
          total_value: number;
          service_order_id: string;
          created_at: string;
          client_approved_at: string;
          client_approved_items: string[];
        }) => {
          const vehicleId = soVehicleMap.get(quote.service_order_id);
          const vehicle = vehicleId ? vehicleMap.get(vehicleId) : null;

          let approvedValue = quote.total_value;

          // Se existem itens aprovados específicos, calcular o valor apenas desses itens
          if (quote.client_approved_items && quote.client_approved_items.length > 0) {
            const { data: approvedItems, error: itemsErr } = await admin
              .from('quote_items')
              .select('total_price')
              .in('id', quote.client_approved_items);

            if (!itemsErr && approvedItems) {
              approvedValue = approvedItems.reduce(
                (sum: number, item: { total_price: number }) => sum + item.total_price,
                0
              );
            }
          }

          return {
            id: quote.id,
            status: quote.status,
            total_value: approvedValue,
            service_order_id: quote.service_order_id,
            created_at: quote.created_at,
            approved_at: quote.client_approved_at,
            vehicle_plate: vehicle?.plate,
            vehicle_model: vehicle ? `${vehicle.brand} ${vehicle.model}`.trim() : undefined,
          };
        }
      ) || []
    );

    logger.info('approved_quotes_fetched', { count: formattedQuotes.length });

    return NextResponse.json({ quotes: formattedQuotes });
  } catch (error) {
    logger.error('unexpected_error', { error });
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
  }
});
