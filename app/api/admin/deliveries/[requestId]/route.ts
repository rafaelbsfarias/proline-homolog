import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:deliveries:update');

export const PATCH = withAdminAuth(
  async (req: AuthenticatedRequest, ctx: { params: Promise<{ requestId: string }> }) => {
    try {
      const { requestId } = await ctx.params;
      const body = await req.json();
      const { action, windowStart, windowEnd } = body || {};

      if (!requestId || !action) {
        return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
      }

      const admin = SupabaseService.getInstance().getAdminClient();

      const { data: reqRow, error: reqErr } = await admin
        .from('delivery_requests')
        .select('id, vehicle_id, status, address_id')
        .eq('id', requestId)
        .single();
      if (reqErr || !reqRow)
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

      let nextStatus: string | null = null;
      const notes: string | null = null;
      const updates: Record<string, any> = {};

      if (action === 'approve') nextStatus = 'approved';
      else if (action === 'reject') nextStatus = 'rejected';
      else if (action === 'schedule') {
        if (!windowStart || !windowEnd) {
          return NextResponse.json(
            { error: 'windowStart/windowEnd são obrigatórios' },
            { status: 400 }
          );
        }
        updates.window_start = windowStart;
        updates.window_end = windowEnd;
        updates.scheduled_at = new Date().toISOString();
        nextStatus = 'scheduled';
      } else if (action === 'mark_in_transit') nextStatus = 'in_transit';
      else if (action === 'mark_delivered') nextStatus = 'delivered';
      else if (action === 'cancel') nextStatus = 'canceled';
      else return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

      const { error: upErr, data: updated } = await admin
        .from('delivery_requests')
        .update({ ...updates, status: nextStatus })
        .eq('id', requestId)
        .select('*')
        .single();
      if (upErr || !updated) throw upErr;

      await admin.from('delivery_request_events').insert({
        request_id: requestId,
        event_type: action === 'schedule' ? 'scheduled' : action.replace('mark_', ''),
        status_from: reqRow.status,
        status_to: nextStatus,
        actor_id: req.user.id,
        actor_role: 'admin',
        notes,
      });

      // Atualizar status do veículo conforme ação e tipo (retirada vs entrega)
      try {
        const isPickup = !reqRow.address_id;
        if (nextStatus === 'scheduled' && isPickup) {
          await admin
            .from('vehicles')
            .update({ status: 'Finalizado: Aguardando Retirada' })
            .eq('id', reqRow.vehicle_id);
        }
      } catch (e) {
        logger.warn('vehicle_status_update_failed', { e, action, nextStatus });
      }

      // timeline básica
      try {
        let vhStatus: string | null = null;
        const isPickup = !reqRow.address_id; // address_id null => retirada no pátio
        if (nextStatus === 'scheduled') vhStatus = isPickup ? null : 'Entrega Agendada';
        else if (nextStatus === 'in_transit') vhStatus = isPickup ? null : 'Saiu para Entrega';
        else if (nextStatus === 'delivered')
          vhStatus = isPickup ? 'Veículo Retirado' : 'Veículo Entregue';
        if (vhStatus) {
          await admin.from('vehicle_history').insert({
            vehicle_id: reqRow.vehicle_id,
            status: vhStatus,
            partner_service: null,
            notes: null,
          });
        }
      } catch (e) {
        logger.warn('vehicle_history_update_failed', { e });
      }

      return NextResponse.json({ success: true, request: updated });
    } catch (e) {
      logger.error('update_error', { e });
      return NextResponse.json({ error: 'Erro ao atualizar entrega' }, { status: 500 });
    }
  }
);
