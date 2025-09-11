import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { MetricsService } from '@/modules/common/services/MetricsService';
import { logFields } from '@/modules/common/utils/logging';

const logger = getLogger('api:admin:cleanup-orphan-requested');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST body: { clientId?: string, dryRun?: boolean, limit?: number }
export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const clientId: string | undefined = body?.clientId;
    const dryRun: boolean = body?.dryRun !== false; // default true
    const limit: number | undefined =
      typeof body?.limit === 'number' && body.limit > 0 ? Math.floor(body.limit) : undefined;

    const admin = SupabaseService.getInstance().getAdminClient();
    const metrics = MetricsService.getInstance();

    // 1) Carregar todas as collections REQUESTED (filtradas por cliente se informado)
    let q = admin
      .from('vehicle_collections')
      .select('id, client_id, collection_address, collection_date, status')
      .eq('status', STATUS.REQUESTED);
    if (clientId) q = q.eq('client_id', clientId);
    if (limit) q = q.limit(limit);
    const { data: requested, error: reqErr } = await q;
    if (reqErr) {
      logger.error('load_requested_failed', {
        error: reqErr.message,
        ...logFields({ client_id: clientId || null }),
      });
      return NextResponse.json(
        { success: false, error: 'Falha ao carregar collections requested' },
        { status: 500 }
      );
    }

    const ids = (requested || []).map((r: any) => r.id).filter(Boolean);
    if (!ids.length) {
      return NextResponse.json({ success: true, dryRun, detected: 0, deleted: 0, items: [] });
    }

    // 2) Contar veículos por collection_id numa única consulta
    const { data: vehiclesRows, error: vErr } = await admin
      .from('vehicles')
      .select('id, collection_id')
      .in('collection_id', ids);
    if (vErr) {
      logger.error('load_vehicles_for_requested_failed', { error: vErr.message });
      return NextResponse.json(
        { success: false, error: 'Falha ao carregar veículos para verificação' },
        { status: 500 }
      );
    }

    const counts = new Map<string, number>();
    (vehiclesRows || []).forEach((r: any) => {
      const cid = String(r?.collection_id || '');
      if (!cid) return;
      counts.set(cid, (counts.get(cid) || 0) + 1);
    });

    const orphans = (requested || []).filter((r: any) => (counts.get(r.id) || 0) === 0);
    const detected = orphans.length;
    if (detected) metrics.inc('orphan_requested_detected', detected);

    if (dryRun || detected === 0) {
      logger.info('cleanup_orphans_dry_run', {
        ...logFields({ client_id: clientId || null }),
        detected,
      });
      return NextResponse.json({
        success: true,
        dryRun: true,
        detected,
        deleted: 0,
        items: orphans,
      });
    }

    // 3) Remover em lote
    const orphanIds = orphans.map((o: any) => o.id);
    const { error: delErr } = await admin
      .from('vehicle_collections')
      .delete()
      .in('id', orphanIds)
      .eq('status', STATUS.REQUESTED);
    if (delErr) {
      logger.error('cleanup_orphans_failed', { error: delErr.message, count: orphanIds.length });
      return NextResponse.json(
        { success: false, error: 'Falha ao remover órfãs', detected, deleted: 0 },
        { status: 500 }
      );
    }

    metrics.inc('orphan_requested_cleaned', orphanIds.length);
    logger.info('cleanup_orphans_success', {
      ...logFields({ client_id: clientId || null }),
      deleted: orphanIds.length,
    });
    return NextResponse.json({ success: true, dryRun: false, detected, deleted: orphanIds.length });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
