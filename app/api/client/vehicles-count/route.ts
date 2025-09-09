// app/api/client/vehicles-count/route.ts
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';
import { randomUUID } from 'crypto';
import { ClientVehicleService } from '@/modules/client/services/ClientVehicleService';

const logger: ILogger = getLogger('api:client:vehicles-count');
const vehicleService = new ClientVehicleService();

export const revalidate = 0; // sem cache
export const dynamic = 'force-dynamic'; // sempre dinâmico

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  const startedAt = Date.now();
  const requestId = randomUUID();

  // helper p/ incluir requestId em todos os logs
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
      return new Response(
        JSON.stringify({ success: false, message: 'Usuário não autenticado', requestId }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log.info('vehicles-count:start', { userId: String(userId).slice(0, 8) });

    // 1) clients: PK é profile_id (não existe clients.id)
    const supabase = SupabaseService.getInstance().getAdminClient();
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

    // --- Start of Pagination Logic ---
    const { searchParams } = new URL(req.url, `http://${req.headers.get('host')}`);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    let query = supabase.from('vehicles').select(
      `
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
        fuel_level,
        addresses (
          id,
          street,
          number,
          city
        )
      `,
      // Only request total count if pagination is active
      pageParam ? { count: 'exact' } : undefined
    );

    query = query.eq('client_id', clientId).order('created_at', { ascending: false });

    // Apply pagination only if params are provided and valid
    if (pageParam && limitParam) {
      const page = parseInt(pageParam, 10);
      const limit = parseInt(limitParam, 10);
      if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit - 1;
        query = query.range(startIndex, endIndex);
      }
    }

    const { data: vehicles, error: vehErr, count: totalCount } = await query;
    // --- End of Pagination Logic ---

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

    // 3) Buscar dados de precificação para veículos aguardando aprovação
    const vehiclesWithFees = await Promise.all(
      (vehicles || []).map(async (vehicle: any) => {
        let collectionFee = null;

        // Só buscar fee se o veículo estiver aguardando aprovação E tiver endereço
        if (
          vehicle.status === 'AGUARDANDO APROVAÇÃO DA COLETA' &&
          vehicle.addresses &&
          vehicle.pickup_address_id
        ) {
          try {
            const addressLabel = `${vehicle.addresses.street}, ${vehicle.addresses.number} - ${vehicle.addresses.city}`;

            log.info('vehicles-count:fetching-fee', {
              vehicleId: vehicle.id,
              status: vehicle.status,
              addressLabel,
              hasAddress: !!vehicle.addresses,
              hasPickupAddressId: !!vehicle.pickup_address_id,
            });

            const { data: collectionData, error: collectionErr } = await supabase
              .from('vehicle_collections')
              .select('collection_fee_per_vehicle')
              .eq('client_id', clientId)
              .eq('collection_address', addressLabel)
              .eq('status', 'requested')
              .gt('collection_fee_per_vehicle', 0)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!collectionErr && collectionData) {
              collectionFee = collectionData.collection_fee_per_vehicle;
              log.info('vehicles-count:fee-found', {
                vehicleId: vehicle.id,
                fee: collectionFee,
              });
            } else {
              log.warn('vehicles-count:fee-not-found', {
                vehicleId: vehicle.id,
                error: collectionErr?.message,
                hasData: !!collectionData,
              });
            }
          } catch (feeErr) {
            log.warn('vehicles-count:fee-lookup-error', {
              vehicleId: vehicle.id,
              error: (feeErr as Error).message,
            });
          }
        }

        return {
          ...vehicle,
          collection_fee: collectionFee,
          addresses: undefined, // Remove o objeto aninhado para manter compatibilidade
        };
      })
    );

    const durationMs = Date.now() - startedAt;

    log.info('vehicles-count:success', {
      userId: String(userId).slice(0, 8),
      clientId: String(clientId).slice(0, 8),
      count: vehiclesWithFees?.length ?? 0,
      totalCount,
      durationMs,
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: vehiclesWithFees?.length ?? 0, // backward compatibility
        totalCount: totalCount, // for paginated clients
        vehicles: vehiclesWithFees ?? [],
        message: 'ok',
        requestId,
      }),
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
