import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:submit');

// Schema de validação
const SubmitChecklistSchema = z
  .object({
    vehicle_id: z.string().uuid('ID do veículo inválido'),
    inspection_id: z.string().uuid('ID da inspeção inválido'),
    // Demais campos são opcionais
  })
  .passthrough(); // Permite campos adicionais

// Normaliza status do front (2 estados: 'ok' | 'nok') e variações legadas
// para persistir também em 2 estados no banco ('ok' | 'nok')
function mapStatus(status?: string) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  if (s === 'ok' || s === 'good') return 'ok';
  if (s === 'nok' || s === 'attention' || s === 'poor' || s === 'regular' || s === 'critical')
    return 'nok';
  return null;
}

// Agregação binária: se qualquer item for 'nok', retorna 'nok'; caso contrário 'ok'
function worstStatus(values: (string | undefined)[]): string | null {
  const mapped = values.map(mapStatus).filter(Boolean) as string[];
  if (mapped.length === 0) return null;
  return mapped.some(v => v === 'nok') ? 'nok' : 'ok';
}

function concatNotes(notes: (string | undefined)[]) {
  return notes.filter(n => !!n && String(n).trim() !== '').join(' | ');
}

// Mapeia o payload atual do front para o schema mechanics_checklist
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapChecklistToMechanicsSchema(input: any, partnerId: string) {
  const motor_condition = worstStatus([
    input.engine,
    input.radiator,
    input.sparkPlugs,
    input.belts,
    input.exhaust,
  ]);
  const motor_notes = concatNotes([
    input.engineNotes,
    input.radiatorNotes,
    input.sparkPlugsNotes,
    input.beltsNotes,
    input.exhaustNotes,
  ]);

  const transmission_condition = mapStatus(input.clutch);
  const transmission_notes = input.clutchNotes || null;

  const brakes_condition = worstStatus([input.brakePads, input.brakeDiscs]);
  const brakes_notes = concatNotes([input.brakePadsNotes, input.brakeDiscsNotes]);

  const suspension_condition = worstStatus([input.suspension, input.frontShocks, input.rearShocks]);
  const suspension_notes = concatNotes([
    input.suspensionNotes,
    input.frontShocksNotes,
    input.rearShocksNotes,
  ]);

  const tires_condition = mapStatus(input.tires);
  const tires_notes = input.tiresNotes || null;

  const electrical_condition = worstStatus([
    input.electricalActuationGlass,
    input.electricalActuationMirror,
    input.electricalActuationSocket,
    input.electricalActuationLock,
    input.electricalActuationTrunk,
    input.electricalActuationWiper,
    input.electricalActuationKey,
    input.electricalActuationAlarm,
    input.electricalActuationInteriorLight,
    input.dashboardPanel,
    input.lights,
    input.battery,
    input.airConditioning,
    input.airConditioningCompressor,
    input.airConditioningCleaning,
  ]);
  const electrical_notes = concatNotes([
    input.electricalActuationGlassNotes,
    input.electricalActuationMirrorNotes,
    input.electricalActuationSocketNotes,
    input.electricalActuationLockNotes,
    input.electricalActuationTrunkNotes,
    input.electricalActuationWiperNotes,
    input.electricalActuationKeyNotes,
    input.electricalActuationAlarmNotes,
    input.electricalActuationInteriorLightNotes,
    input.dashboardPanelNotes,
    input.lightsNotes,
    input.batteryNotes,
    input.airConditioningNotes,
    input.airConditioningCompressorNotes,
    input.airConditioningCleaningNotes,
  ]);

  return {
    // Identificação
    vehicle_id: input.vehicle_id,
    inspection_id: input.inspection_id || null,
    partner_id: partnerId,

    // Status geral do checklist
    status: input.status || 'submitted',
    created_at: input.created_at || undefined,
    updated_at: new Date().toISOString(),

    // Motor
    motor_condition,
    motor_notes: motor_notes || null,

    // Transmissão
    transmission_condition,
    transmission_notes: transmission_notes || null,

    // Freios
    brakes_condition,
    brake_pads_front: input.brake_pads_front ?? null,
    brake_pads_rear: input.brake_pads_rear ?? null,
    brake_discs_front_condition: null,
    brake_discs_rear_condition: null,
    brakes_notes: brakes_notes || null,

    // Suspensão
    suspension_condition,
    suspension_front_left: null,
    suspension_front_right: null,
    suspension_rear_left: null,
    suspension_rear_right: null,
    suspension_notes: suspension_notes || null,

    // Pneus
    tires_condition,
    tire_front_left_depth: null,
    tire_front_right_depth: null,
    tire_rear_left_depth: null,
    tire_rear_right_depth: null,
    tire_front_left_condition: null,
    tire_front_right_condition: null,
    tire_rear_left_condition: null,
    tire_rear_right_condition: null,
    tires_notes: tires_notes || null,

    // Elétrico
    electrical_condition,
    battery_voltage: null,
    alternator_condition: null,
    electrical_notes: electrical_notes || null,

    // Fluidos
    oil_condition: null,
    oil_level: null,
    coolant_condition: null,
    coolant_level: null,
    brake_fluid_condition: null,
    brake_fluid_level: null,
    fluids_notes: input.fluidsNotes || null,

    // Carroceria / Interior (não coletado na UI atual)
    body_condition: null,
    paint_condition: null,
    rust_spots: null,
    dents: null,
    scratches: null,
    body_notes: null,
    interior_condition: null,
    seats_condition: null,
    dashboard_condition: null,
    interior_notes: null,

    // Gerais
    documents_ok: null,
    maintenance_history: null,
    general_observations: input.observations || null,
    recommended_repairs: null,
    estimated_repair_cost: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function submitChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const checklistData = await req.json();

    // Validar entrada
    const validation = SubmitChecklistSchema.safeParse(checklistData);
    if (!validation.success) {
      logger.warn('validation_error', { errors: validation.error.errors });
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const supabase = SupabaseService.getInstance().getAdminClient();
    const partnerId = req.user.id;

    logger.info('submit_start', {
      vehicle_id: checklistData.vehicle_id,
      inspection_id: checklistData.inspection_id,
    });

    // Mapear dados do front para o schema do banco (sem salvar imagens na tabela principal)
    const mapped = mapChecklistToMechanicsSchema(checklistData, partnerId);
    logger.debug('mapped_payload', {
      vehicle_id: mapped.vehicle_id,
      inspection_id: mapped.inspection_id,
      status: mapped.status,
    });

    // Upsert vinculado por (vehicle_id, inspection_id)
    const { data, error } = await supabase
      .from('mechanics_checklist')
      .upsert(mapped, { onConflict: 'vehicle_id,inspection_id' })
      .select('*');

    if (error) {
      logger.error('mechanics_checklist_upsert_error', { error: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    logger.info('mechanics_checklist_upsert_ok', { rows: Array.isArray(data) ? data.length : 0 });

    // Persistir status e notas por item em mechanics_checklist_items
    const itemDefs: { key: string; notesKey: string }[] = [
      { key: 'clutch', notesKey: 'clutchNotes' },
      { key: 'sparkPlugs', notesKey: 'sparkPlugsNotes' },
      { key: 'belts', notesKey: 'beltsNotes' },
      { key: 'radiator', notesKey: 'radiatorNotes' },
      { key: 'frontShocks', notesKey: 'frontShocksNotes' },
      { key: 'rearShocks', notesKey: 'rearShocksNotes' },
      { key: 'suspension', notesKey: 'suspensionNotes' },
      { key: 'tires', notesKey: 'tiresNotes' },
      { key: 'brakePads', notesKey: 'brakePadsNotes' },
      { key: 'brakeDiscs', notesKey: 'brakeDiscsNotes' },
      { key: 'engine', notesKey: 'engineNotes' },
      { key: 'steeringBox', notesKey: 'steeringBoxNotes' },
      { key: 'electricSteeringBox', notesKey: 'electricSteeringBoxNotes' },
      { key: 'exhaust', notesKey: 'exhaustNotes' },
      { key: 'fluids', notesKey: 'fluidsNotes' },
      { key: 'airConditioning', notesKey: 'airConditioningNotes' },
      { key: 'airConditioningCompressor', notesKey: 'airConditioningCompressorNotes' },
      { key: 'airConditioningCleaning', notesKey: 'airConditioningCleaningNotes' },
      { key: 'electricalActuationGlass', notesKey: 'electricalActuationGlassNotes' },
      { key: 'electricalActuationMirror', notesKey: 'electricalActuationMirrorNotes' },
      { key: 'electricalActuationSocket', notesKey: 'electricalActuationSocketNotes' },
      { key: 'electricalActuationLock', notesKey: 'electricalActuationLockNotes' },
      { key: 'electricalActuationTrunk', notesKey: 'electricalActuationTrunkNotes' },
      { key: 'electricalActuationWiper', notesKey: 'electricalActuationWiperNotes' },
      { key: 'electricalActuationKey', notesKey: 'electricalActuationKeyNotes' },
      { key: 'electricalActuationAlarm', notesKey: 'electricalActuationAlarmNotes' },
      {
        key: 'electricalActuationInteriorLight',
        notesKey: 'electricalActuationInteriorLightNotes',
      },
      { key: 'dashboardPanel', notesKey: 'dashboardPanelNotes' },
      { key: 'lights', notesKey: 'lightsNotes' },
      { key: 'battery', notesKey: 'batteryNotes' },
    ];

    const itemRows = itemDefs
      .map(({ key, notesKey }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (checklistData as any)?.[key];
        const mappedStatus = mapStatus(status);
        if (!mappedStatus) return null;
        return {
          inspection_id: checklistData.inspection_id,
          vehicle_id: checklistData.vehicle_id,
          item_key: key,
          item_status: mappedStatus,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          item_notes: (checklistData as any)?.[notesKey] || null,
        };
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(Boolean) as any[];

    logger.debug('mechanics_checklist_items_prepared', { count: itemRows.length });

    if (itemRows.length > 0) {
      const { error: itemsError } = await supabase
        .from('mechanics_checklist_items')
        .upsert(itemRows, { onConflict: 'inspection_id,item_key' });
      if (itemsError) {
        logger.error('mechanics_checklist_items_upsert_error', { error: itemsError.message });
      }
      logger.info('mechanics_checklist_items_upsert_ok', { count: itemRows.length });
    }

    // Persistir referências das evidências em tabela separada (uma por item), sem blobs
    if (checklistData.evidences && typeof checklistData.evidences === 'object') {
      const entries = Object.entries(checklistData.evidences) as [string, string][];
      const rows = entries
        .filter(([, path]) => !!path && String(path).trim() !== '')
        .map(([item_key, storage_path]) => ({
          inspection_id: checklistData.inspection_id,
          vehicle_id: checklistData.vehicle_id,
          item_key,
          storage_path,
        }));

      if (rows.length > 0) {
        const { error: evError } = await supabase
          .from('mechanics_checklist_evidences')
          .upsert(rows, { onConflict: 'inspection_id,item_key' });
        if (evError) {
          // Não falhar a requisição principal por causa das evidências
          logger.error('mechanics_checklist_evidences_upsert_error', { error: evError.message });
        }
        logger.info('mechanics_checklist_evidences_upsert_ok', { count: rows.length });
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) && data[0] ? data[0] : mapped,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error('submit_unexpected_error', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const PUT = withPartnerAuth(submitChecklistHandler);
