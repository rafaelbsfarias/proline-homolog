import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:accept-vehicle-pickup-date');

function toWindowIso(dateIso: string, startHour = 9, endHour = 18) {
  const [y, m, d] = dateIso.split('-').map(Number);
  const start = new Date(Date.UTC(y, (m - 1) as number, d as number, startHour, 0, 0));
  const end = new Date(Date.UTC(y, (m - 1) as number, d as number, endHour, 0, 0));
  return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
}

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { clientId, vehicleId } = body || {};

    if (!clientId || !vehicleId) {
      return NextResponse.json({ error: 'clientId e vehicleId são obrigatórios' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Encontrar a última solicitação de retirada (address_id null) em estado requested
    const { data: request, error: reqErr } = await admin
      .from('delivery_requests')
      .select('id, status, desired_date, vehicle_id, client_id, address_id')
      .eq('client_id', clientId)
      .eq('vehicle_id', vehicleId)
      .is('address_id', null)
      .eq('status', 'requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (reqErr || !request) {
      return NextResponse.json(
        { error: 'Solicitação de retirada não encontrada' },
        { status: 404 }
      );
    }

    const desiredDate = (request.desired_date || '').toString().slice(0, 10);
    if (!desiredDate) {
      return NextResponse.json(
        { error: 'Solicitação sem data desejada para retirada' },
        { status: 400 }
      );
    }

    const { windowStart, windowEnd } = toWindowIso(desiredDate);

    // Atualizar request para scheduled com janela padrão
    const { error: upErr, data: updated } = await admin
      .from('delivery_requests')
      .update({
        status: 'scheduled',
        window_start: windowStart,
        window_end: windowEnd,
        scheduled_at: new Date().toISOString(),
      })
      .eq('id', request.id)
      .select('id, vehicle_id')
      .single();

    if (upErr || !updated) {
      logger.error('update_request_failed', { error: upErr?.message, requestId: request.id });
      return NextResponse.json({ error: 'Falha ao agendar retirada' }, { status: 500 });
    }

    // Evento
    await admin.from('delivery_request_events').insert({
      request_id: request.id,
      event_type: 'scheduled',
      status_from: 'requested',
      status_to: 'scheduled',
      actor_id: req.user.id,
      actor_role: 'admin',
      notes: null,
    });

    // Atualizar status do veículo e timeline
    try {
      await admin
        .from('vehicles')
        .update({ status: 'Aguardando Retirada' })
        .eq('id', updated.vehicle_id);
    } catch (e) {
      logger.warn('vehicle_status_update_failed', { e });
    }
    // Não escrever manualmente 'Retirada Agendada'; rely no trigger do vehicles.status para timeline 'Aguardando Retirada'

    return NextResponse.json({ success: true, requestId: request.id });
  } catch (e) {
    logger.error('unexpected_error', { e });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
