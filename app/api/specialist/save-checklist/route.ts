import { NextResponse } from 'next/server';
import { withSpecialistAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { getLogger } from '@/modules/logger';

interface ChecklistPayload {
  vehicleId: string;
  date: string; // YYYY-MM-DD
  odometer: number;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  observations?: string;
  services?: {
    mechanics?: { required?: boolean; notes?: string };
    bodyPaint?: { required?: boolean; notes?: string };
    washing?: { required?: boolean; notes?: string };
    tires?: { required?: boolean; notes?: string };
  };
  mediaPaths?: string[]; // Supabase Storage paths already uploaded from client
}

const logger = getLogger('api:specialist:save-checklist');

export const POST = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    logger.info('request_received', { requestId, userId: req.user?.id });

    const body = (await req.json()) as ChecklistPayload;
    const vehicleId = String(body.vehicleId || '');
    if (!validateUUID(vehicleId)) {
      logger.warn('validation_error', { requestId, field: 'vehicleId' });
      return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(body.date || '')) {
      logger.warn('validation_error', { requestId, field: 'date', value: body.date });
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }
    if (typeof body.odometer !== 'number' || body.odometer < 0) {
      logger.warn('validation_error', { requestId, field: 'odometer', value: body.odometer });
      return NextResponse.json({ error: 'Quilometragem inválida' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Authorization: ensure this specialist is linked to the client's vehicle
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('id, client_id, status')
      .eq('id', vehicleId)
      .maybeSingle();
    if (vehErr) {
      logger.error('db_error_vehicle_load', { requestId, error: vehErr.message });
      return NextResponse.json({ error: 'Erro ao carregar veículo' }, { status: 500 });
    }
    if (!veh) {
      logger.warn('not_found_vehicle', { requestId, vehicleId });
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    const { data: link, error: linkErr } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('client_id', veh.client_id)
      .eq('specialist_id', req.user.id)
      .maybeSingle();
    if (linkErr) {
      logger.error('db_error_check_link', { requestId, error: linkErr.message });
      return NextResponse.json({ error: 'Erro de autorização' }, { status: 500 });
    }
    if (!link) {
      logger.warn('access_denied', { requestId, userId: req.user.id, clientId: veh.client_id });
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Enforce vehicle status before allowing checklist
    if (String((veh as any).status || '').toUpperCase() !== 'CHEGADA CONFIRMADA') {
      logger.warn('invalid_vehicle_status', { requestId, vehicleId, status: (veh as any).status });
      return NextResponse.json({ error: 'Checklist disponível apenas após "Chegada confirmada"' }, { status: 400 });
    }

    // Find existing non-finalized inspection for this vehicle (collaborative)
    const { data: existing } = await supabase
      .from('inspections')
      .select('id, finalized')
      .eq('vehicle_id', vehicleId)
      .eq('finalized', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let inspectionId: string;
    if (existing?.id) {
      // Update existing
      const { error: updInsErr } = await supabase
        .from('inspections')
        .update({
          specialist_id: req.user.id, // last editor
          inspection_date: body.date,
          odometer: body.odometer,
          fuel_level: body.fuelLevel,
          observations: body.observations || null,
        })
        .eq('id', existing.id);
      if (updInsErr) {
        logger.error('db_error_update_inspection', { requestId, error: updInsErr.message });
        return NextResponse.json({ error: 'Erro ao salvar inspeção' }, { status: 500 });
      }
      inspectionId = existing.id;
      // Clear services to re-insert snapshot
      const { error: delSvcErr } = await supabase
        .from('inspection_services')
        .delete()
        .eq('inspection_id', inspectionId);
      if (delSvcErr) {
        logger.error('db_error_delete_services', { requestId, error: delSvcErr.message });
        return NextResponse.json({ error: 'Erro ao salvar serviços' }, { status: 500 });
      }
    } else {
      // Insert new inspection
      const { data: ins, error: insErr } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: vehicleId,
          specialist_id: req.user.id,
          inspection_date: body.date,
          odometer: body.odometer,
          fuel_level: body.fuelLevel,
          observations: body.observations || null,
          finalized: false,
        })
        .select()
        .single();
      if (insErr) {
        logger.error('db_error_insert_inspection', { requestId, error: insErr.message });
        return NextResponse.json({ error: 'Erro ao salvar inspeção' }, { status: 500 });
      }
      inspectionId = ins.id;
    }

    // Insert services flags (only required or with notes)
    const services = body.services || {};
    const toInsert: { inspection_id: string; category: string; required: boolean; notes?: string | null }[] = [];
    const pushService = (key: keyof NonNullable<ChecklistPayload['services']>, category: string) => {
      const s = services[key];
      if (!s) return;
      const required = !!s.required;
      const notes = (s.notes || '').trim();
      if (required || notes) toInsert.push({ inspection_id: inspectionId, category, required, notes: notes || null });
    };
    pushService('mechanics', 'mechanics');
    pushService('bodyPaint', 'bodyPaint');
    pushService('washing', 'washing');
    pushService('tires', 'tires');

    if (toInsert.length) {
      const { error: svcErr } = await supabase.from('inspection_services').insert(toInsert.map(s => ({ ...s, inspection_id: inspectionId })));
      if (svcErr) {
        logger.error('db_error_insert_services', { requestId, error: svcErr.message });
        return NextResponse.json({ error: 'Erro ao salvar serviços' }, { status: 500 });
      }
    }

    // Insert media references, if any
    const media = (body.mediaPaths || []).filter(Boolean).map(p => ({
      inspection_id: inspectionId,
      storage_path: p,
      uploaded_by: req.user.id,
    }));
    if (media.length) {
      const { error: mediaErr } = await supabase.from('inspection_media').insert(media);
      if (mediaErr) {
        logger.error('db_error_insert_media', { requestId, error: mediaErr.message });
        return NextResponse.json({ error: 'Erro ao registrar mídias' }, { status: 500 });
      }
    }

    // Optionally update vehicle snapshot info
    await supabase
      .from('vehicles')
      .update({ current_odometer: body.odometer, fuel_level: body.fuelLevel })
      .eq('id', vehicleId);
    logger.info('success', { requestId, inspectionId, vehicleId });
    return NextResponse.json({ success: true, inspectionId });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('unhandled_error', { error: message });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
