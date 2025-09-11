import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminClientsWithCollectionSummaryAPI');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handler(req: AuthenticatedRequest) {
  try {
    const admin = SupabaseService.getInstance().getAdminClient();
    const adminUser = req.user;
    logger.info('summary:start', { userId: adminUser?.id?.slice(0, 8) });

    // 1) Base list via existing RPC (includes company_name, vehicle_count, specialist_names)
    const { data: baseClients, error: baseErr } = await admin.rpc('get_clients_with_vehicle_count');
    if (baseErr) {
      logger.error('summary:rpc_error', { error: baseErr.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar clientes (RPC).', details: baseErr.message },
        { status: 500 }
      );
    }

    const clients = Array.isArray(baseClients) ? baseClients : [];
    const ids: string[] = clients.map((c: any) => c.id).filter(Boolean);

    if (!ids.length) {
      logger.info('summary:no_clients');
      return NextResponse.json({ success: true, clients: [] });
    }

    // 2) Aggregate per client how many vehicles are in "PONTO DE COLETA SELECIONADO"
    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, client_id, status')
      .in('client_id', ids)
      .eq('status', 'PONTO DE COLETA SELECIONADO');

    if (vehErr) {
      logger.error('summary:vehicles_error', { error: vehErr.message });
      // Do not fail entirely; return base clients with zero collection count
      const merged = clients.map((c: any) => ({ ...c, collection_requests_count: 0 }));
      return NextResponse.json({ success: true, clients: merged });
    }

    const counts = new Map<string, number>();
    (vehicles || []).forEach((row: any) => {
      const cid = row.client_id as string;
      counts.set(cid, (counts.get(cid) || 0) + 1);
    });

    const merged = clients.map((c: any) => ({
      ...c,
      collection_requests_count: counts.get(c.id) || 0,
    }));

    logger.info('summary:success', { total: merged.length });
    return NextResponse.json({ success: true, clients: merged });
  } catch (e: any) {
    logger.error('summary:unhandled', { error: e?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handler);
