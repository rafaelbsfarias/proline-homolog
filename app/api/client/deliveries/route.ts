import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:deliveries:create');

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const {
      vehicleId,
      addressId,
      desiredDate,
      method,
    }: { vehicleId?: string; addressId?: string; desiredDate?: string; method?: string } =
      body || {};

    const mode: 'delivery' | 'pickup' = method === 'pickup' ? 'pickup' : 'delivery';

    if (!vehicleId || !desiredDate) {
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios ausentes (vehicleId, desiredDate)',
          code: 'E_BAD_PARAMS',
        },
        { status: 400 }
      );
    }
    if (mode === 'delivery' && !addressId) {
      return NextResponse.json(
        { error: 'addressId é obrigatório para entregas', code: 'E_ADDRESS_REQUIRED' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();
    const clientId = req.user.id;
    const tokenProfileId = req.user.profile_id;
    logger.info('create_delivery_request_received', {
      clientId: clientId.slice(0, 8),
      vehicleId,
      addressId,
      desiredDate,
      mode,
    });

    // Debug: verificar consistência entre id e profile_id do token
    if (clientId !== tokenProfileId) {
      logger.warn('auth_profile_mismatch', {
        id: clientId.slice(0, 8),
        profile_id: tokenProfileId.slice(0, 8),
      });
    }

    // 1) Validar que o veículo pertence ao cliente e está Finalizado
    const { data: vehicleRow, error: vehErr } = await admin
      .from('vehicles')
      .select('id, status, service_orders(id, quotes(status))')
      .eq('id', vehicleId)
      .single();
    if (vehErr || !vehicleRow) {
      logger.warn('vehicle_not_found', { vehicleId: vehicleId?.slice(0, 8) });
      return NextResponse.json(
        { error: 'Veículo não encontrado', code: 'E_VEHICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verifica propriedade via service_orders -> vehicles has client? If vehicles table has client_id, prefer that
    // Tentativa 1: vehicles has client_id
    const { data: vehicleOwner } = await admin
      .from('vehicles')
      .select('client_id')
      .eq('id', vehicleId)
      .single();
    if (vehicleOwner?.client_id !== clientId) {
      logger.warn('vehicle_not_owned_by_client', {
        vehicleId: vehicleId.slice(0, 8),
        expectedOwner: String(vehicleOwner?.client_id || 'null').slice(0, 8),
        clientId: clientId.slice(0, 8),
      });
      return NextResponse.json(
        { error: 'Veículo não pertence ao cliente', code: 'E_VEHICLE_NOT_OWNED' },
        { status: 403 }
      );
    }

    const statusUpper = String(vehicleRow.status || '').toUpperCase();
    const isFinal = statusUpper === 'FINALIZADO' || statusUpper === 'EXECUÇÃO FINALIZADA';
    if (!isFinal) {
      logger.warn('vehicle_not_finalized', {
        vehicleId: vehicleId.slice(0, 8),
        status: vehicleRow.status,
      });
      return NextResponse.json(
        { error: 'Veículo não está finalizado', code: 'E_VEHICLE_NOT_FINAL' },
        { status: 400 }
      );
    }

    // 2) Verificar pendências de orçamento (quotes em execução/aprovação) na service_order atual
    const serviceOrderId = Array.isArray(vehicleRow.service_orders)
      ? vehicleRow.service_orders[0]?.id
      : vehicleRow.service_orders?.id;

    if (!serviceOrderId) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada para o veículo' },
        { status: 400 }
      );
    }

    // 2.1) Se o veículo já está finalizado, não bloquear por status residual de quotes
    // (mantemos o check apenas para veículos não finalizados; porém já retornamos acima)

    // 3) Validar endereço pertence ao cliente (somente para entrega)
    let addr: {
      id: string;
      street: string | null;
      number: string | null;
      city: string | null;
      label: string | null;
    } | null = null;
    if (mode === 'delivery') {
      logger.info('address_validation_started', {
        clientId: clientId.slice(0, 8),
        addressId: addressId?.slice(0, 8),
      });
      const { data: addressRow, error: addrSelectErr } = await admin
        .from('addresses')
        .select('id, street, number, city')
        .eq('id', addressId)
        .eq('profile_id', clientId)
        .single();
      if (addrSelectErr) {
        logger.warn('address_select_error', {
          message: addrSelectErr.message,
          hint: addrSelectErr.hint,
          details: addrSelectErr.details,
        });
      }
      if (!addressRow) {
        // Investigar causa: endereço inexistente ou não pertence ao cliente
        const { data: existsAny } = await admin
          .from('addresses')
          .select('id, profile_id')
          .eq('id', addressId)
          .maybeSingle();
        if (existsAny) {
          logger.warn('address_not_owned_by_client', {
            clientId: clientId?.slice(0, 8),
            addressId,
            owner: existsAny.profile_id?.slice?.(0, 8) || 'unknown',
          });
          return NextResponse.json(
            { error: 'Endereço não pertence a este cliente', code: 'E_ADDRESS_NOT_OWNED' },
            { status: 400 }
          );
        }
        logger.warn('address_not_found', { clientId: clientId?.slice(0, 8), addressId });
        return NextResponse.json(
          { error: 'Endereço não encontrado', code: 'E_ADDRESS_NOT_FOUND' },
          { status: 400 }
        );
      }
      logger.info('address_ownership_verified', {
        clientId: clientId.slice(0, 8),
        addressId: addressRow.id?.slice?.(0, 8),
      });
      addr = addressRow as any;
    }

    // 4) Criar delivery_request + event
    const { error: insErr, data: inserted } = await admin
      .from('delivery_requests')
      .insert({
        vehicle_id: vehicleId,
        service_order_id: serviceOrderId,
        client_id: clientId,
        address_id: mode === 'delivery' ? addressId : null,
        status: 'requested',
        desired_date: desiredDate,
        created_by: clientId,
      })
      .select('*')
      .single();

    if (insErr || !inserted) {
      logger.error('delivery_insert_failed', { error: insErr?.message });
      return NextResponse.json(
        { error: 'Falha ao criar entrega', code: 'E_DELIVERY_INSERT_FAILED' },
        { status: 500 }
      );
    }

    await admin.from('delivery_request_events').insert({
      request_id: inserted.id,
      event_type: mode === 'pickup' ? 'pickup_requested' : 'created',
      status_from: null,
      status_to: 'requested',
      actor_id: clientId,
      actor_role: 'client',
      notes: mode === 'pickup' ? 'Retirada no pátio solicitada' : null,
    });

    // 5) Escrever timeline básica (sem PII)
    try {
      if (mode === 'pickup') {
        await admin.from('vehicle_history').insert({
          vehicle_id: vehicleId,
          status: 'Retirada no Pátio Solicitada',
          partner_service: null,
          notes: 'Retirada no Pátio Solicitada',
        });
        // Não alterar status do veículo aqui; próximo status será 'Aguardando Retirada' após aceite do admin
      } else if (addr) {
        const label =
          addr.label || `${addr.street || ''} ${addr.number || ''} - ${addr.city || ''}`.trim();
        await admin.from('vehicle_history').insert({
          vehicle_id: vehicleId,
          status: 'Entrega Solicitada',
          partner_service: null,
          notes: label ? `Entrega Solicitada — ${label}` : 'Entrega Solicitada',
        });
        // Atualizar status do veículo para refletir a solicitação de entrega
        try {
          const { error: vUpdErr } = await admin
            .from('vehicles')
            .update({ status: 'Finalizado: Entrega solicitada' })
            .eq('id', vehicleId)
            .eq('client_id', clientId);
          if (vUpdErr) {
            logger.warn('vehicle_status_update_failed_on_request', {
              vehicleId: vehicleId.slice(0, 8),
              error: vUpdErr.message,
            });
          } else {
            logger.info('vehicle_status_updated_on_request', {
              vehicleId: vehicleId.slice(0, 8),
              newStatus: 'Finalizado: Entrega solicitada',
            });
          }
        } catch (e) {
          logger.warn('vehicle_status_update_exception', { e });
        }
      }
    } catch (e) {
      logger.warn('vehicle_history_insert_failed', { e });
    }

    return NextResponse.json({ success: true, request: inserted }, { status: 201 });
  } catch (e) {
    logger.error('unexpected_error', { e });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
});
