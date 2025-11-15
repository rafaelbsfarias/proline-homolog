import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

type MechanicService = {
  id: string;
  quote_item_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
};

type QuoteItem = {
  id: string;
  description: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  estimated_days: number | null;
  created_at: string;
  updated_at: string;
};

export async function GET(_request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  try {
    const admin = SupabaseService.getInstance().getAdminClient();
    const { quoteId } = await params;

    // Buscar orçamento com serviços e veículo
    const { data: quote, error: quoteError } = await admin
      .from('quotes')
      .select(
        `
        id,
        total_value,
        status,
        created_at,
        service_orders (
          id,
          vehicles (
            plate,
            brand,
            model
          )
        )
      `
      )
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Buscar itens do orçamento
    const { data: quoteItems, error: itemsError } = await admin
      .from('quote_items')
      .select(
        `
        id,
        description,
        unit_price,
        quantity,
        total_price,
        estimated_days,
        created_at,
        updated_at
      `
      )
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: 'Erro ao buscar itens do orçamento' }, { status: 500 });
    }

    // Buscar serviços executados para calcular dias reais
    const { data: services, error: servicesError } = await admin
      .from('mechanic_services')
      .select(
        `
        id,
        quote_item_id,
        started_at,
        completed_at,
        status
      `
      )
      .eq('quote_id', quoteId);

    if (servicesError) {
      // Serviços são opcionais, continuar mesmo com erro
    }

    // Mapear serviços por quote_item_id para calcular dias reais
    const servicesByItem = new Map<string, MechanicService>();
    (services || []).forEach((service: MechanicService) => {
      if (service.quote_item_id) {
        servicesByItem.set(service.quote_item_id, service);
      }
    });

    // Montar resposta com detalhes
    const serviceOrder = Array.isArray(quote.service_orders)
      ? quote.service_orders[0]
      : quote.service_orders;

    const vehicle = serviceOrder?.vehicles
      ? Array.isArray(serviceOrder.vehicles)
        ? serviceOrder.vehicles[0]
        : serviceOrder.vehicles
      : null;

    const servicesDetail = (quoteItems || []).map((item: QuoteItem) => {
      const service = servicesByItem.get(item.id);
      let actualDays = null;

      // Calcular dias reais se o serviço foi completado
      if (service?.started_at && service?.completed_at) {
        const start = new Date(service.started_at);
        const end = new Date(service.completed_at);
        actualDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: item.id,
        description: item.description,
        value: item.total_price || item.unit_price * item.quantity,
        estimated_days: item.estimated_days,
        actual_days: actualDays,
        quantity: item.quantity,
        unit_price: item.unit_price,
      };
    });

    const response = {
      id: quote.id,
      total_value: quote.total_value,
      status: quote.status,
      services: servicesDetail,
      vehicle: vehicle
        ? {
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
