import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { getLogger } from '@/modules/logger';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { authorizeSpecialistForVehicle } from '@/modules/specialist/utils/authorization';

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

    // Authorization: ensure this specialist is linked to the client's vehicle
    const authResult = await authorizeSpecialistForVehicle(req.user.id, vehicleId);
    if (!authResult.authorized) {
      logger.warn('authorization_failed', { requestId, userId: req.user.id, vehicleId });
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Enforce vehicle status before allowing checklist (allow CHEGADA CONFIRMADA or EM ANÁLISE)
    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (vehErr || !veh) {
      logger.error('db_error_vehicle_load_status', { requestId, error: vehErr?.message });
      return NextResponse.json({ error: 'Erro ao carregar status do veículo' }, { status: 500 });
    }

    {
      const s = String(veh.status || '').toUpperCase();
      const allowed = s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE;
      if (!allowed) {
        logger.warn('invalid_vehicle_status', { requestId, vehicleId, status: veh.status });
        return NextResponse.json(
          { error: 'Checklist disponível apenas após Chegada Confirmada ou em Análise' },
          { status: 400 }
        );
      }
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
    const toInsert: {
      inspection_id: string;
      category: string;
      required: boolean;
      notes?: string | null;
    }[] = [];
    const pushService = (
      key: keyof NonNullable<ChecklistPayload['services']>,
      category: string
    ) => {
      const s = services[key];
      if (!s) return;
      const required = !!s.required;
      const notes = (s.notes || '').trim();
      if (required || notes)
        toInsert.push({ inspection_id: inspectionId, category, required, notes: notes || null });
    };
    pushService('mechanics', 'mechanics');
    pushService('bodyPaint', 'bodyPaint');
    pushService('washing', 'washing');
    pushService('tires', 'tires');

    if (toInsert.length) {
      const { error: svcErr } = await supabase
        .from('inspection_services')
        .insert(toInsert.map(s => ({ ...s, inspection_id: inspectionId })));
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

    // Optionally update vehicle snapshot info and set status to EM ANÁLISE while not finalized
    await supabase
      .from('vehicles')
      .update({
        current_odometer: body.odometer,
        fuel_level: body.fuelLevel,
        status: VehicleStatus.EM_ANALISE,
      })
      .eq('id', vehicleId);

    // Record history snapshot
    try {
      const snapshot = {
        date: body.date,
        odometer: body.odometer,
        fuelLevel: body.fuelLevel,
        observations: body.observations || null,
        services: {
          mechanics: {
            required: !!services.mechanics?.required,
            notes: services.mechanics?.notes || '',
          },
          bodyPaint: {
            required: !!services.bodyPaint?.required,
            notes: services.bodyPaint?.notes || '',
          },
          washing: { required: !!services.washing?.required, notes: services.washing?.notes || '' },
          tires: { required: !!services.tires?.required, notes: services.tires?.notes || '' },
        },
        mediaPaths: body.mediaPaths || [],
      };
      await supabase.from('inspection_history').insert({
        inspection_id: inspectionId,
        vehicle_id: vehicleId,
        edited_by: req.user.id,
        snapshot,
      });
    } catch (histErr) {
      logger.warn('history_insert_failed', {
        requestId,
        error: histErr instanceof Error ? histErr.message : String(histErr),
      });
    }
    logger.info('success', { requestId, inspectionId, vehicleId });
    return NextResponse.json({ success: true, inspectionId });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('unhandled_error', { error: message });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
