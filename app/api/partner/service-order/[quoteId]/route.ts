import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:service-order');

async function handler(req: AuthenticatedRequest, ctx: { params: Promise<{ quoteId: string }> }) {
  try {
    const { quoteId } = await ctx.params;
    const partnerId = req.user.id;
    const supabase = SupabaseService.getInstance().getAdminClient();

    // 1. Buscar quote e validar propriedade e status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, status, created_at, partner_id, service_order_id')
      .eq('id', quoteId)
      .eq('partner_id', partnerId)
      .eq('status', 'approved')
      .single();

    if (quoteError || !quote) {
      logger.error('quote_not_found', { error: quoteError, quoteId, partnerId });
      return NextResponse.json(
        { ok: false, error: 'Orçamento não encontrado ou não aprovado' },
        { status: 404 }
      );
    }

    // 2. Buscar service_order
    const { data: serviceOrder, error: serviceOrderError } = await supabase
      .from('service_orders')
      .select('id, vehicle_id, client_id')
      .eq('id', quote.service_order_id)
      .single();

    if (serviceOrderError || !serviceOrder) {
      logger.error('service_order_not_found', {
        error: serviceOrderError,
        serviceOrderId: quote.service_order_id,
      });
      return NextResponse.json(
        { ok: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // 3. Buscar dados do veículo
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('plate, brand, model, year, color, current_odometer')
      .eq('id', serviceOrder.vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      logger.error('vehicle_not_found', {
        error: vehicleError,
        vehicleId: serviceOrder.vehicle_id,
      });
      return NextResponse.json({ ok: false, error: 'Veículo não encontrado' }, { status: 404 });
    }

    // 4. Buscar estimated_days da tabela services
    const { data: serviceData } = await supabase
      .from('services')
      .select('estimated_days')
      .eq('quote_id', quoteId)
      .limit(1)
      .maybeSingle();

    const estimatedDays = serviceData?.estimated_days || 0;

    // 5. Buscar itens do orçamento (sem preços)
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('id, description, quantity')
      .eq('quote_id', quoteId)
      .order('description', { ascending: true });

    if (itemsError) {
      logger.error('failed_fetch_items', { error: itemsError, quoteId });
      return NextResponse.json(
        { ok: false, error: 'Erro ao buscar itens do orçamento' },
        { status: 500 }
      );
    }

    // 6. Buscar dados do parceiro (auth.users para telefone)
    const { data: partnerUser } = await supabase.auth.admin.getUserById(partnerId);

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('company_name, profile_id, profiles!inner(full_name)')
      .eq('profile_id', partnerId)
      .single();

    if (partnerError) {
      logger.warn('partner_not_found', { error: partnerError, partnerId });
    }

    // 7. Buscar dados do cliente (auth.users para telefone e email)
    const { data: clientUser } = await supabase.auth.admin.getUserById(serviceOrder.client_id);

    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', serviceOrder.client_id)
      .single();

    if (clientError) {
      logger.warn('client_not_found', {
        error: clientError,
        clientId: serviceOrder.client_id,
      });
    }

    // 8. Montar resposta
    const response = {
      ok: true,
      serviceOrder: {
        id: quote.id,
        created_at: quote.created_at,
        estimated_days: estimatedDays,
        status: quote.status,
        vehicle: {
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          odometer: vehicle.current_odometer,
        },
        partner: {
          company_name: partner?.company_name || 'N/A',
          contact_name: partner?.profiles?.full_name || 'N/A',
          phone:
            partnerUser?.user?.phone && partnerUser.user.phone !== ''
              ? partnerUser.user.phone
              : 'N/A',
        },
        client: {
          name: client?.full_name || 'N/A',
          phone:
            clientUser?.user?.phone && clientUser.user.phone !== '' ? clientUser.user.phone : 'N/A',
          email: clientUser?.user?.email || 'N/A',
        },
        items: items || [],
      },
    };

    logger.info('service_order_fetched', { quoteId, partnerId, itemsCount: items?.length });
    return NextResponse.json(response);
  } catch (error) {
    logger.error('service_order_unexpected_error', { error });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withPartnerAuth(handler);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
