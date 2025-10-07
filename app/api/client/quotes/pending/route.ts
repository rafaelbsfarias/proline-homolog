import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:quotes:pending');

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const clientId = req.user?.user_metadata?.profile_id;

    if (!clientId) {
      logger.error('client_id_not_found');
      return NextResponse.json({ error: 'ID do cliente não encontrado' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Buscar veículos do cliente
    const { data: vehicles, error: vehiclesErr } = await admin
      .from('vehicles')
      .select('id')
      .eq('client_id', clientId);

    if (vehiclesErr) {
      logger.error('failed_fetch_vehicles', { error: vehiclesErr });
      return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
    }

    const vehicleIds = vehicles?.map((v: { id: string }) => v.id) || [];

    if (vehicleIds.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    // Buscar service_orders dos veículos
    const { data: serviceOrders, error: soErr } = await admin
      .from('service_orders')
      .select('id')
      .in('vehicle_id', vehicleIds);

    if (soErr) {
      logger.error('failed_fetch_service_orders', { error: soErr });
      return NextResponse.json({ error: 'Erro ao buscar ordens de serviço' }, { status: 500 });
    }

    const serviceOrderIds = serviceOrders?.map((so: { id: string }) => so.id) || [];

    if (serviceOrderIds.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    // Buscar quotes com status pending_client_approval
    const { data: quotes, error: quotesErr } = await admin
      .from('quotes')
      .select(
        `
        id,
        status,
        total_value,
        service_order_id,
        created_at,
        is_partial_approval,
        rejected_items,
        rejection_reason,
        admin_reviewed_at
      `
      )
      .in('service_order_id', serviceOrderIds)
      .eq('status', 'pending_client_approval')
      .order('created_at', { ascending: false });

    if (quotesErr) {
      logger.error('failed_fetch_quotes', { error: quotesErr });
      return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
    }

    logger.info('quotes_fetched', { count: quotes?.length || 0 });

    return NextResponse.json({ quotes: quotes || [] });
  } catch (error) {
    logger.error('unexpected_error', { error });
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
  }
});
