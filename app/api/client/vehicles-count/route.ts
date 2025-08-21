// app/api/client/vehicles-count/route.ts
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';
import { randomUUID } from 'crypto';

const logger: ILogger = getLogger('api:client:vehicles-count');

export const revalidate = 0;             // sem cache
export const dynamic = 'force-dynamic';  // sempre dinâmico

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  const startedAt = Date.now();
  const requestId = randomUUID();

  // helper p/ incluir requestId em todos os logs
  const log = {
    info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, { requestId, ...(meta || {}) }),
    warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, { requestId, ...(meta || {}) }),
    error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { requestId, ...(meta || {}) }),
  };

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    const userId =
      (req as any)?.user?.id ||
      (req as any)?.auth?.user?.id ||
      (req as any)?.userId;

    if (!userId) {
      log.warn('vehicles-count:missing-user-id');
      return new Response(
        JSON.stringify({ success: false, message: 'Usuário não autenticado', requestId }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log.info('vehicles-count:start', { userId: String(userId).slice(0, 8) });

    // 1) clients: PK é profile_id (não existe clients.id)
    const { data: clientRow, error: clientErr } = await supabase
      .from('clients')
      .select('profile_id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (clientErr) {
      log.error('vehicles-count:client-lookup-error', {
        userId: String(userId).slice(0, 8),
        error: clientErr.message,
        code: (clientErr as any)?.code,
      });
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao localizar cliente', requestId }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!clientRow) {
      log.warn('vehicles-count:client-not-found', { userId: String(userId).slice(0, 8) });
      return new Response(
        JSON.stringify({ success: false, message: 'Cliente não encontrado', requestId }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientId: string = clientRow.profile_id; // == userId

    // 2) vehicles do cliente (FK: vehicles.client_id -> clients.profile_id)
    const { data: vehicles, error: vehErr } = await supabase
      .from('vehicles')
      .select(`
        id,
        plate,
        brand,
        model,
        year,
        color,
        status,
        created_at,
        fipe_value,
        pickup_address_id,
        estimated_arrival_date,
        current_odometer,
        fuel_level
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (vehErr) {
      log.error('vehicles-count:list-error', {
        userId: String(userId).slice(0, 8),
        clientId: String(clientId).slice(0, 8),
        error: vehErr.message,
        code: (vehErr as any)?.code,
      });
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao listar veículos', requestId }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const count = vehicles?.length ?? 0;
    const durationMs = Date.now() - startedAt;

    log.info('vehicles-count:success', {
      userId: String(userId).slice(0, 8),
      clientId: String(clientId).slice(0, 8),
      count,
      durationMs,
    });

    return new Response(
      JSON.stringify({ success: true, count, vehicles: vehicles ?? [], message: 'ok', requestId }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (e: any) {
    log.error('vehicles-count:unhandled-error', { error: e?.message, stack: e?.stack });
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor', requestId }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
