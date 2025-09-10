// app/api/client/vehicles-count/route.ts
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';
import { randomUUID } from 'crypto';

const logger: ILogger = getLogger('api:client:vehicles-count');

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 10;

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  const startedAt = Date.now();
  const requestId = randomUUID();
  const log = {
    info: (msg: string, meta?: Record<string, unknown>) =>
      logger.info(msg, { requestId, ...(meta || {}) }),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      logger.warn(msg, { requestId, ...(meta || {}) }),
    error: (msg: string, meta?: Record<string, unknown>) =>
      logger.error(msg, { requestId, ...(meta || {}) }),
  };

  try {
    const userId = req.user?.id;
    if (!userId) {
      log.warn('vehicles-count:missing-user-id');
      return new Response(JSON.stringify({ success: false, message: 'Usuário não autenticado' }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
    const plateFilter = searchParams.get('plate') || '';
    const statusFilter = searchParams.get('status') || '';

    log.info('vehicles-count:start', {
      userId: String(userId).slice(0, 8),
      page,
      limit,
      plateFilter,
      statusFilter,
    });

    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase.rpc('get_client_vehicles_paginated', {
      p_client_id: userId,
      p_page_num: page,
      p_page_size: limit,
      p_plate_filter: plateFilter,
      p_status_filter: statusFilter,
    });

    if (error) {
      log.error('vehicles-count:rpc-error', { error: error.message, code: error.code });
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao buscar veículos via RPC.' }),
        { status: 500 }
      );
    }

    // The RPC returns { vehicles, total_count, status_counts }
    // The old API returned { vehicles, totalCount }, so we align the new response.
    const responsePayload = {
      success: true,
      vehicles: data.vehicles || [],
      totalCount: data.total_count || 0,
      statusCounts: data.status_counts || {},
      message: 'ok',
      requestId,
    };

    const durationMs = Date.now() - startedAt;
    log.info('vehicles-count:success', {
      count: responsePayload.vehicles.length,
      totalCount: responsePayload.totalCount,
      durationMs,
    });

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    log.error('vehicles-count:unhandled-error', { error: e?.message, stack: e?.stack });
    return new Response(JSON.stringify({ success: false, message: 'Erro interno do servidor' }), {
      status: 500,
    });
  }
});
