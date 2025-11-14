import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

type FinancialItemType =
  | 'vehicle_collection'
  | 'executed_budget'
  | 'material_purchase'
  | 'parking_fee';

type VehicleFinancialItem = {
  id: string;
  type: FinancialItemType;
  description: string;
  status: 'finished' | 'in_progress' | 'pending';
  amount: number;
};

type VehicleFinancials = {
  vehicleId: string;
  plate: string;
  brand?: string;
  model?: string;
  items: VehicleFinancialItem[];
  total: number;
  status: 'finished' | 'in_progress' | 'pending'; // Pior status entre os itens
};

type GeneralFees = {
  operation_fee: number;
  total: number;
};

type FinancialOverviewResponse = {
  general_fees: GeneralFees;
  vehicles: VehicleFinancials[];
  summary: {
    total_to_pay: number;
    total_future: number;
    grand_total: number;
  };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const admin = SupabaseService.getInstance().getAdminClient();

  try {
    // Map to store all financial data by vehicle
    const vehicleFinancialsMap = new Map<
      string,
      {
        plate: string;
        brand?: string;
        model?: string;
        items: VehicleFinancialItem[];
      }
    >();

    // General fees (not tied to specific vehicles)
    let operationFeeTotal = 0;

    // Helper to get or create vehicle entry
    const getVehicleEntry = (vehicleId: string, plate: string, brand?: string, model?: string) => {
      if (!vehicleFinancialsMap.has(vehicleId)) {
        vehicleFinancialsMap.set(vehicleId, {
          plate,
          brand,
          model,
          items: [],
        });
      }
      return vehicleFinancialsMap.get(vehicleId)!;
    };

    // 1) Get client data for pricing
    const { data: clientData } = await admin
      .from('clients')
      .select('profile_id, taxa_operacao, parqueamento, company_name')
      .eq('profile_id', clientId)
      .single();

    if (!clientData) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const taxaOperacao = Number(clientData.taxa_operacao) || 0;
    const parqueamentoDiaria = Number(clientData.parqueamento) || 0;

    // 2) Count total vehicles for operation fee
    const { data: vehiclesData } = await admin
      .from('vehicles')
      .select('id, plate, brand, model')
      .eq('client_id', clientId);

    const totalVehicles = vehiclesData?.length || 0;

    // Calculate operation fee (general fee, not per vehicle)
    if (taxaOperacao > 0 && totalVehicles > 0) {
      operationFeeTotal = taxaOperacao * totalVehicles;
    }

    // 3) Calculate parking fees (vehicles in patio_atacado)
    if (parqueamentoDiaria > 0) {
      const { data: parkingData } = await admin
        .from('service_orders')
        .select(
          'vehicle_id, created_at, vehicles ( id, plate, brand, model ), service_categories ( key, name )'
        )
        .eq('client_id', clientId)
        .eq('status', 'in_progress');

      const vehiclesInPatio = (parkingData || []).filter((so: unknown) => {
        const cat = (so as Record<string, unknown>)?.service_categories as
          | Record<string, unknown>
          | undefined;
        const key = String(cat?.key || '').toLowerCase();
        const name = String(cat?.name || '').toLowerCase();
        return key === 'patio_atacado' || name.includes('pátio') || name.includes('patio');
      });

      vehiclesInPatio.forEach((so: unknown) => {
        const soRecord = so as Record<string, unknown>;
        const vehicleData = soRecord.vehicles;
        const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;
        const vehicleRecord = vehicle as Record<string, unknown> | undefined;
        if (!vehicleRecord?.id || !vehicleRecord?.plate) return;

        const created = new Date(soRecord.created_at as string).getTime();
        const now = Date.now();
        const days = Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));

        const entry = getVehicleEntry(
          String(vehicleRecord.id),
          String(vehicleRecord.plate),
          vehicleRecord.brand as string | undefined,
          vehicleRecord.model as string | undefined
        );
        entry.items.push({
          id: `parking-${soRecord.vehicle_id}`,
          type: 'parking_fee',
          description: `Parqueamento (${days} dia${days > 1 ? 's' : ''})`,
          status: 'finished',
          amount: parqueamentoDiaria * days,
        });
      });
    }

    // 4) Get collection fees (approved collections)
    const { data: collectionsData } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle, vehicles ( id, plate, brand, model )')
      .eq('client_id', clientId)
      .eq('status', 'approved');

    (collectionsData || []).forEach((collection: unknown) => {
      const collectionRecord = collection as Record<string, unknown>;
      const fee = Number(collectionRecord.collection_fee_per_vehicle) || 0;
      if (fee <= 0) return;

      const vehiclesData = collectionRecord.vehicles;
      const vehicles = Array.isArray(vehiclesData) ? vehiclesData : [];

      vehicles.forEach((vehicle: unknown) => {
        const vehicleRecord = vehicle as Record<string, unknown>;
        if (!vehicleRecord?.id || !vehicleRecord?.plate) return;

        const entry = getVehicleEntry(
          String(vehicleRecord.id),
          String(vehicleRecord.plate),
          vehicleRecord.brand as string | undefined,
          vehicleRecord.model as string | undefined
        );
        entry.items.push({
          id: `collection-${collectionRecord.id}-${vehicleRecord.id}`,
          type: 'vehicle_collection',
          description: 'Coleta de veículo',
          status: 'finished',
          amount: fee,
        });
      });
    });

    // 5) Get quotes (finalized = finished, in_execution = in_progress, pending = pending)
    const { data: quotesData } = await admin
      .from('quotes')
      .select(
        'id, total_value, status, service_orders ( vehicle_id, vehicles ( id, plate, brand, model ) )'
      )
      .eq('service_orders.client_id', clientId);

    (quotesData || []).forEach((quote: unknown) => {
      const quoteRecord = quote as Record<string, unknown>;
      const value = Number(quoteRecord.total_value) || 0;
      if (value <= 0) return;

      const statusStr = String(quoteRecord.status || '').toLowerCase();
      let itemStatus: 'finished' | 'in_progress' | 'pending' = 'pending';

      if (statusStr === 'finalized') {
        itemStatus = 'finished';
      } else if (statusStr === 'in_execution' || statusStr === 'in_progress') {
        itemStatus = 'in_progress';
      }

      const soData = quoteRecord.service_orders;
      const so = Array.isArray(soData) ? soData[0] : soData;
      const soRecord = so as Record<string, unknown> | undefined;
      const vehicleData = soRecord?.vehicles;
      const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;
      const vehicleRecord = vehicle as Record<string, unknown> | undefined;

      if (!vehicleRecord?.id || !vehicleRecord?.plate) return;

      const entry = getVehicleEntry(
        String(vehicleRecord.id),
        String(vehicleRecord.plate),
        vehicleRecord.brand as string | undefined,
        vehicleRecord.model as string | undefined
      );
      entry.items.push({
        id: `quote-${quoteRecord.id}`,
        type: 'executed_budget',
        description: 'Serviços executados',
        status: itemStatus,
        amount: value,
      });
    });

    // 6) Get part requests (ordered or received = material purchase)
    const { data: partsData } = await admin
      .from('part_requests')
      .select(
        'id, quantity, estimated_price, status, quote_id, quotes ( service_orders ( vehicles ( id, plate, brand, model ) ) )'
      )
      .in('status', ['ordered', 'received']);

    (partsData || []).forEach((part: unknown) => {
      const partRecord = part as Record<string, unknown>;
      const qty = Number(partRecord.quantity) || 0;
      const price = Number(partRecord.estimated_price) || 0;
      const amount = qty * price;

      if (amount <= 0) return;

      const quoteData = partRecord.quotes;
      const quote = quoteData as Record<string, unknown> | undefined;
      const soData = quote?.service_orders;
      const so = Array.isArray(soData) ? soData[0] : soData;
      const soRecord = so as Record<string, unknown> | undefined;
      const vehicleData = soRecord?.vehicles;
      const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData;
      const vehicleRecord = vehicle as Record<string, unknown> | undefined;

      if (!vehicleRecord?.id || !vehicleRecord?.plate) return;

      const entry = getVehicleEntry(
        String(vehicleRecord.id),
        String(vehicleRecord.plate),
        vehicleRecord.brand as string | undefined,
        vehicleRecord.model as string | undefined
      );
      entry.items.push({
        id: `part-${partRecord.id}`,
        type: 'material_purchase',
        description: `Materiais (${qty} ${qty > 1 ? 'itens' : 'item'})`,
        status: partRecord.status === 'received' ? 'finished' : 'in_progress',
        amount,
      });
    });

    // Convert Map to array and calculate totals
    const vehicles: VehicleFinancials[] = Array.from(vehicleFinancialsMap.entries()).map(
      ([vehicleId, data]) => {
        const total = data.items.reduce((sum, item) => sum + item.amount, 0);

        // Determine overall vehicle status based on items
        let vehicleStatus: 'finished' | 'in_progress' | 'pending' = 'finished';
        const hasInProgress = data.items.some(i => i.status === 'in_progress');
        const hasPending = data.items.some(i => i.status === 'pending');

        if (hasPending) {
          vehicleStatus = 'pending';
        } else if (hasInProgress) {
          vehicleStatus = 'in_progress';
        }

        return {
          vehicleId,
          plate: data.plate,
          brand: data.brand,
          model: data.model,
          items: data.items,
          total,
          status: vehicleStatus,
        };
      }
    );

    // Calculate summary
    const vehicleFinishedTotal = vehicles
      .filter(v => v.status === 'finished')
      .reduce((sum, v) => sum + v.total, 0);

    const vehicleFutureTotal = vehicles
      .filter(v => v.status !== 'finished')
      .reduce((sum, v) => sum + v.total, 0);

    const summary = {
      total_to_pay: vehicleFinishedTotal + operationFeeTotal,
      total_future: vehicleFutureTotal,
      grand_total: vehicleFinishedTotal + vehicleFutureTotal + operationFeeTotal,
    };

    const general_fees: GeneralFees = {
      operation_fee: operationFeeTotal,
      total: operationFeeTotal,
    };

    const response: FinancialOverviewResponse = {
      general_fees,
      vehicles,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro ao buscar resumo financeiro',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
