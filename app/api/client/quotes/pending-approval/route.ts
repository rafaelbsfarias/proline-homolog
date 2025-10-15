/**
 * GET /api/client/quotes/pending-approval
 *
 * Lista orçamentos que estão pendentes de aprovação final do cliente (trilha cliente).
 * Faz parte do sistema de 3 trilhas de aprovação independentes.
 *
 * Retorna orçamentos onde approval_status.client === 'pending'
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é cliente
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('profile_id')
      .eq('profile_id', user.id)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas clientes podem acessar esta rota.' },
        { status: 403 }
      );
    }

    // Buscar veículos do cliente
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('client_id', user.id);

    if (vehiclesError) {
      return NextResponse.json(
        { error: 'Erro ao buscar veículos', details: vehiclesError.message },
        { status: 500 }
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vehicleIds = vehicles.map((v: any) => v.id);

    // Buscar service_orders dos veículos
    const { data: serviceOrders, error: soError } = await supabase
      .from('service_orders')
      .select('id')
      .in('vehicle_id', vehicleIds);

    if (soError) {
      return NextResponse.json(
        { error: 'Erro ao buscar ordens de serviço', details: soError.message },
        { status: 500 }
      );
    }

    if (!serviceOrders || serviceOrders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceOrderIds = serviceOrders.map((so: any) => so.id);

    // Buscar orçamentos pendentes de aprovação do cliente
    // Filtra por approval_status->>'client' = 'pending'
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        created_at,
        updated_at,
        service_order_id,
        partner_id,
        total_value,
        supplier_delivery_date,
        status,
        approval_status,
        partners:partner_id (
          profile_id,
          profiles:profile_id (
            name,
            email
          )
        ),
        service_orders:service_order_id (
          id,
          vehicle_id,
          vehicles:vehicle_id (
            id,
            plate,
            model,
            brand
          )
        ),
        quote_items (
          id,
          description,
          quantity,
          unit_price,
          total_price,
          estimated_days
        )
      `
      )
      .in('service_order_id', serviceOrderIds)
      .filter('approval_status->client', 'eq', 'pending')
      .order('created_at', { ascending: false });

    if (quotesError) {
      return NextResponse.json(
        { error: 'Erro ao buscar orçamentos', details: quotesError.message },
        { status: 500 }
      );
    }

    // Formatar resposta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedQuotes = quotes.map((quote: any) => {
      const partner = Array.isArray(quote.partners) ? quote.partners[0] : quote.partners;
      const serviceOrder = Array.isArray(quote.service_orders)
        ? quote.service_orders[0]
        : quote.service_orders;
      const vehicle = serviceOrder?.vehicles;

      return {
        id: quote.id,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        status: quote.status,
        approval_status: quote.approval_status,
        total_value: quote.total_value,
        supplier_delivery_date: quote.supplier_delivery_date,
        partner: {
          id: quote.partner_id,
          name: partner?.profiles?.name || 'N/A',
          email: partner?.profiles?.email || 'N/A',
        },
        vehicle: {
          id: vehicle?.id,
          plate: vehicle?.plate || 'N/A',
          model: vehicle?.model || 'N/A',
          brand: vehicle?.brand || 'N/A',
        },
        items: quote.quote_items || [],
        items_count: quote.quote_items?.length || 0,
        total_items_value:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quote.quote_items?.reduce(
            (sum: number, item: any) => sum + (Number(item.total_price) || 0),
            0
          ) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedQuotes,
      count: formattedQuotes.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
