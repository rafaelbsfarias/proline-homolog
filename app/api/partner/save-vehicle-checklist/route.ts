import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { getLogger } from '@/modules/logger';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';

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
    loja?: { required?: boolean; notes?: string };
    patioAtacado?: { required?: boolean; notes?: string };
  };
  mediaPaths?: string[];
}

const logger = getLogger('api:partner:save-vehicle-checklist');

async function saveVehicleChecklistHandler(req: AuthenticatedRequest) {
  try {
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    logger.info('request_received', { requestId, userId: req.user?.id });

    const body = (await req.json()) as ChecklistPayload;
    const vehicleId = String(body.vehicleId || '');

    // Validation
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

    // Verify vehicle exists and belongs to partner's client
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, client_id, status')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      logger.warn('vehicle_not_found', { requestId, vehicleId });
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    // Check if partner has access to this client's vehicles
    const { data: partnerClient, error: partnerError } = await supabase
      .from('partner_clients')
      .select('id')
      .eq('partner_id', req.user.id)
      .eq('client_id', vehicle.client_id)
      .single();

    if (partnerError || !partnerClient) {
      logger.warn('unauthorized_access', { requestId, userId: req.user.id, vehicleId });
      return NextResponse.json({ error: 'Acesso não autorizado a este veículo' }, { status: 403 });
    }

    // Check vehicle status - allow checklist for vehicles in certain states
    const allowedStatuses = [
      VehicleStatus.AGUARDANDO_COLETA,
      VehicleStatus.AGUARDANDO_CHEGADA,
      VehicleStatus.CHEGADA_CONFIRMADA,
      VehicleStatus.EM_ANALISE,
    ];

    if (!allowedStatuses.includes(vehicle.status)) {
      logger.warn('invalid_vehicle_status', { requestId, vehicleId, status: vehicle.status });
      return NextResponse.json(
        { error: 'Status do veículo não permite checklist neste momento' },
        { status: 400 }
      );
    }

    // Find existing non-finalized inspection for this vehicle
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
      // Update existing inspection
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          inspection_date: body.date,
          odometer: body.odometer,
          fuel_level: body.fuelLevel,
          observations: body.observations || null,
        })
        .eq('id', existing.id);

      if (updateError) {
        logger.error('db_error_update_inspection', { requestId, error: updateError.message });
        return NextResponse.json({ error: 'Erro ao atualizar inspeção' }, { status: 500 });
      }

      inspectionId = existing.id;

      // Clear existing services to re-insert
      const { error: deleteError } = await supabase
        .from('inspection_services')
        .delete()
        .eq('inspection_id', inspectionId);

      if (deleteError) {
        logger.error('db_error_delete_services', { requestId, error: deleteError.message });
        return NextResponse.json({ error: 'Erro ao atualizar serviços' }, { status: 500 });
      }
    } else {
      // Create new inspection
      const { data: inspection, error: insertError } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: vehicleId,
          inspection_date: body.date,
          odometer: body.odometer,
          fuel_level: body.fuelLevel,
          observations: body.observations || null,
          finalized: false,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('db_error_insert_inspection', { requestId, error: insertError.message });
        return NextResponse.json({ error: 'Erro ao criar inspeção' }, { status: 500 });
      }

      inspectionId = inspection.id;
    }

    // Insert services flags (only required or with notes)
    const services = body.services || {};
    const servicesToInsert: {
      inspection_id: string;
      category: string;
      required: boolean;
      notes?: string | null;
    }[] = [];

    const addService = (key: keyof NonNullable<ChecklistPayload['services']>, category: string) => {
      const service = services[key];
      if (!service) return;

      const required = !!service.required;
      const notes = (service.notes || '').trim();

      if (required || notes) {
        servicesToInsert.push({
          inspection_id: inspectionId,
          category,
          required,
          notes: notes || null,
        });
      }
    };

    addService('mechanics', 'mechanics');
    addService('bodyPaint', 'body_paint');
    addService('washing', 'washing');
    addService('tires', 'tires');
    addService('loja', 'loja');
    addService('patioAtacado', 'patio_atacado');

    if (servicesToInsert.length > 0) {
      const { error: servicesError } = await supabase
        .from('inspection_services')
        .insert(servicesToInsert);

      if (servicesError) {
        logger.error('db_error_insert_services', { requestId, error: servicesError.message });
        return NextResponse.json({ error: 'Erro ao salvar serviços' }, { status: 500 });
      }
    }

    // Removido: não inserir mais mídias de parceiros em inspection_media

    // Update vehicle status to EM_ANALISE if not already
    if (vehicle.status !== VehicleStatus.EM_ANALISE) {
      await supabase
        .from('vehicles')
        .update({
          current_odometer: body.odometer,
          fuel_level: body.fuelLevel,
          status: VehicleStatus.EM_ANALISE,
        })
        .eq('id', vehicleId);
    }

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
          washing: {
            required: !!services.washing?.required,
            notes: services.washing?.notes || '',
          },
          tires: {
            required: !!services.tires?.required,
            notes: services.tires?.notes || '',
          },
          loja: {
            required: !!services.loja?.required,
            notes: services.loja?.notes || '',
          },
          patioAtacado: {
            required: !!services.patioAtacado?.required,
            notes: services.patioAtacado?.notes || '',
          },
        },
        mediaPaths: body.mediaPaths || [],
      };

      await supabase.from('inspection_history').insert({
        inspection_id: inspectionId,
        vehicle_id: vehicleId,
        edited_by: req.user.id,
        snapshot,
      });
    } catch (historyError) {
      logger.warn('history_insert_failed', {
        requestId,
        error: historyError instanceof Error ? historyError.message : String(historyError),
      });
      // Don't fail the request if history recording fails
    }

    logger.info('success', { requestId, inspectionId, vehicleId });
    return NextResponse.json({
      success: true,
      inspectionId,
      message: 'Checklist salvo com sucesso',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('unhandled_error', { error: message });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(saveVehicleChecklistHandler);
