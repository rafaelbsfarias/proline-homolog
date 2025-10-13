import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:approved');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handler(req: AuthenticatedRequest) {
  try {
    const partnerId = req.user.id;
    const supabase = SupabaseService.getInstance().getAdminClient();

    // 1) Buscar orçamentos aprovados do parceiro (campos simples + vehicle_id direto se existir)
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(
        'id, status, total_value, client_approved_at, admin_reviewed_at, partner_id, service_order_id, vehicle_id'
      )
      .eq('partner_id', partnerId)
      .eq('status', 'approved');

    if (quotesError) {
      logger.error('approved_fetch_error', { error: quotesError });
      return NextResponse.json({ ok: false, error: 'Falha ao buscar aprovados' }, { status: 500 });
    }

    const quotesList = (quotes || []).map(q => ({
      ...q,
      effective_approved_at: (q as any).client_approved_at || (q as any).admin_reviewed_at || null,
    }));
    // Sort by effective approved date desc
    quotesList.sort((a: any, b: any) => {
      const da = a.effective_approved_at ? new Date(a.effective_approved_at).getTime() : 0;
      const db = b.effective_approved_at ? new Date(b.effective_approved_at).getTime() : 0;
      return db - da;
    });

    // 2) Resolver vehicle_id: a) direto da quote.vehicle_id; b) da service_order
    const serviceOrderIds = quotesList.map(q => q.service_order_id).filter(Boolean) as string[];

    const serviceOrdersById: Record<string, { id: string; vehicle_id: string } | undefined> = {};
    if (serviceOrderIds.length > 0) {
      const { data: serviceOrders } = await supabase
        .from('service_orders')
        .select('id, vehicle_id')
        .in('id', serviceOrderIds);
      for (const so of serviceOrders || []) {
        serviceOrdersById[so.id] = { id: so.id, vehicle_id: so.vehicle_id };
      }
    }

    const vehicleIdsSet = new Set<string>();
    const baseItems = quotesList.map(q => {
      const so = q.service_order_id ? serviceOrdersById[q.service_order_id] : undefined;
      const vehicle_id = (q as any).vehicle_id || so?.vehicle_id || null;
      if (vehicle_id) vehicleIdsSet.add(vehicle_id);
      return {
        quote_id: q.id as string,
        status: q.status as string,
        total_value: (q as any).total_value ?? null,
        approved_at: (q as any).client_approved_at || (q as any).admin_reviewed_at || null,
        service_order_id: q.service_order_id as string | null,
        vehicle_id: vehicle_id as string | null,
      } as any;
    });

    // 3) Buscar dados dos veículos em lote
    const vehicleIds = Array.from(vehicleIdsSet);
    const vehiclesById: Record<string, any> = {};
    if (vehicleIds.length > 0) {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, plate, brand, model, year')
        .in('id', vehicleIds);
      for (const v of vehicles || []) {
        vehiclesById[v.id] = v;
      }
    }

    // 4) Normalizar resposta
    const items = baseItems.map((row: any) => {
      const vehicle = row.vehicle_id ? vehiclesById[row.vehicle_id] : null;
      return {
        quote_id: row.quote_id,
        status: row.status,
        total_value: row.total_value,
        approved_at: row.approved_at,
        service_order_id: row.service_order_id,
        vehicle_id: row.vehicle_id,
        vehicle: {
          plate: vehicle?.plate || '',
          brand: vehicle?.brand || '',
          model: vehicle?.model || '',
          year: vehicle?.year || null,
        },
      };
    });

    logger.info('approved_list_returned', { count: items.length });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    logger.error('approved_unexpected_error', { e });
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 500 });
  }
}

export const GET = withPartnerAuth(handler);
