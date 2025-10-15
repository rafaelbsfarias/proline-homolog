import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

async function getSpecialistPendingTimeApprovalsHandler(req: AuthenticatedRequest) {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // Primeiro, buscar os client_ids do especialista
    const { data: clientSpecialists, error: csError } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('specialist_id', req.user.id);

    if (csError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar clientes do especialista' },
        { status: 500 }
      );
    }

    if (!clientSpecialists || clientSpecialists.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const clientIds = clientSpecialists.map(cs => cs.client_id);

    // Buscar vehicles dos clientes
    const { data: vehicles, error: vError } = await supabase
      .from('vehicles')
      .select('id')
      .in('client_id', clientIds);

    if (vError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos dos clientes' },
        { status: 500 }
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const vehicleIds = vehicles.map(v => v.id);

    // Buscar service_orders dos veículos
    const { data: serviceOrders, error: soError } = await supabase
      .from('service_orders')
      .select('id')
      .in('vehicle_id', vehicleIds);

    if (soError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar ordens de serviço' },
        { status: 500 }
      );
    }

    if (!serviceOrders || serviceOrders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const serviceOrderIds = serviceOrders.map(so => so.id);

    // Buscar quotes aprovados pelos admins mas pendentes de aprovação de prazos pelos especialistas
    const { data: quotes, error: qError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        created_at,
        total_value,
        status,
        service_order_id,
        partner_id
      `
      )
      .in('service_order_id', serviceOrderIds)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (qError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar orçamentos pendentes' },
        { status: 500 }
      );
    }

    // Para cada quote, buscar os dados relacionados
    const quotesWithDetails = await Promise.all(
      (quotes || []).map(async quote => {
        // Buscar informações do parceiro
        const { data: partner } = await supabase
          .from('partners')
          .select('company_name')
          .eq('profile_id', quote.partner_id)
          .single();

        // Buscar informações do service order e veículo
        const { data: serviceOrder } = await supabase
          .from('service_orders')
          .select('vehicle_id')
          .eq('id', quote.service_order_id)
          .single();

        let vehicle = null;
        let client = null;

        if (serviceOrder) {
          const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('plate, model, brand, client_id')
            .eq('id', serviceOrder.vehicle_id)
            .single();

          vehicle = vehicleData;

          if (vehicleData) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('full_name')
              .eq('profile_id', vehicleData.client_id)
              .single();

            client = clientData;
          }
        }

        // Buscar itens do orçamento
        const { data: items } = await supabase
          .from('quote_items')
          .select(
            `
            id,
            description,
            quantity,
            unit_price,
            total_price,
            estimated_days
          `
          )
          .eq('quote_id', quote.id);

        return {
          id: quote.id,
          created_at: quote.created_at,
          total_value: quote.total_value,
          status: quote.status,
          partners: {
            company_name: partner?.company_name || 'N/A',
          },
          vehicles: {
            plate: vehicle?.plate || 'N/A',
            model: vehicle?.model || 'N/A',
            brand: vehicle?.brand || 'N/A',
          },
          clients: {
            full_name: client?.full_name || 'N/A',
          },
          items: items || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: quotesWithDetails,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withSpecialistAuth(getSpecialistPendingTimeApprovalsHandler);
