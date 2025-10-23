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
        { error: 'Parâmetros obrigatórios ausentes (vehicleId, desiredDate)' },
        { status: 400 }
      );
    }
    if (mode === 'delivery' && !addressId) {
      return NextResponse.json({ error: 'addressId é obrigatório para entregas' }, { status: 400 });
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
    const isFinal = statusUpper === 'FINALIZADO' || statusUpper === 'EXECUÇÃO FINALIZADA';
    if (!isFinal) {
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
      const { data: addressRow } = await admin
        .from('addresses')
        .select('id, street, number, city, label')
        .eq('id', addressId)
        .eq('profile_id', clientId)
        .single();
      if (!addressRow) {
        return NextResponse.json({ error: 'Endereço inválido' }, { status: 400 });
      }
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
      return NextResponse.json({ error: 'Falha ao criar entrega' }, { status: 500 });
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
