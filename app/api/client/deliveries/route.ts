import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:deliveries:create');

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { vehicleId, addressId, desiredDate } = body || {};

    if (!vehicleId || !addressId || !desiredDate) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes (vehicleId, addressId, desiredDate)' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();
    const clientId = req.user.id;

    // 1) Validar que o veículo pertence ao cliente e está Finalizado
    const { data: vehicleRow, error: vehErr } = await admin
      .from('vehicles')
      .select('id, status, service_orders(id, quotes(status))')
      .eq('id', vehicleId)
      .single();
    if (vehErr || !vehicleRow) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    // Verifica propriedade via service_orders -> vehicles has client? If vehicles table has client_id, prefer that
    // Tentativa 1: vehicles has client_id
    const { data: vehicleOwner } = await admin
      .from('vehicles')
      .select('client_id')
      .eq('id', vehicleId)
      .single();
    if (vehicleOwner?.client_id !== clientId) {
      return NextResponse.json({ error: 'Veículo não pertence ao cliente' }, { status: 403 });
    }

    const statusUpper = String(vehicleRow.status || '').toUpperCase();
    if (statusUpper !== 'FINALIZADO' && statusUpper !== 'EXECUÇÃO FINALIZADA') {
      return NextResponse.json({ error: 'Veículo não está finalizado' }, { status: 400 });
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

    const { data: quotes } = await admin
      .from('quotes')
      .select('id, status')
      .eq('service_order_id', serviceOrderId);

    const hasPending = (quotes || []).some(q =>
      ['pending_admin_approval', 'admin_review', 'pending_client_approval', 'approved'].includes(
        q.status
      )
    );
    if (hasPending) {
      return NextResponse.json(
        { error: 'Há orçamentos pendentes ou em execução para este veículo' },
        { status: 400 }
      );
    }

    // 3) Validar endereço pertence ao cliente
    const { data: addr } = await admin
      .from('addresses')
      .select('id, street, number, city, label')
      .eq('id', addressId)
      .eq('client_id', clientId)
      .single();
    if (!addr) {
      return NextResponse.json({ error: 'Endereço inválido' }, { status: 400 });
    }

    // 4) Criar delivery_request + event
    const { error: insErr, data: inserted } = await admin
      .from('delivery_requests')
      .insert({
        vehicle_id: vehicleId,
        service_order_id: serviceOrderId,
        client_id: clientId,
        address_id: addressId,
        status: 'requested',
        desired_date: desiredDate,
        created_by: clientId,
      })
      .select('*')
      .single();

    if (insErr || !inserted) {
      logger.error('delivery_insert_failed', { error: insErr?.message });
      return NextResponse.json({ error: 'Falha ao criar entrega' }, { status: 500 });
    }

    await admin.from('delivery_request_events').insert({
      request_id: inserted.id,
      event_type: 'created',
      status_from: null,
      status_to: 'requested',
      actor_id: clientId,
      actor_role: 'client',
      notes: null,
    });

    // 5) Escrever timeline básica (sem PII)
    const label =
      addr.label || `${addr.street || ''} ${addr.number || ''} - ${addr.city || ''}`.trim();
    try {
      await admin.from('vehicle_history').insert({
        vehicle_id: vehicleId,
        status: 'Entrega Solicitada',
        partner_service: null,
        notes: label ? `Entrega Solicitada — ${label}` : 'Entrega Solicitada',
      });
    } catch (e) {
      logger.warn('vehicle_history_insert_failed', { e });
    }

    return NextResponse.json({ success: true, request: inserted }, { status: 201 });
  } catch (e) {
    logger.error('unexpected_error', { e });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
});
