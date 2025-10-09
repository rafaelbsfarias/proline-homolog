import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('services:checklist');

/**
 * Dados de entrada para submissão de checklist
 */
export interface ChecklistSubmissionData {
  vehicle_id: string;
  inspection_id: string;
  partner_id: string;
  status?: string;
  created_at?: string;

  // Campos dinâmicos do checklist (motor, transmissão, etc.)
  [key: string]: unknown;
}

/**
 * Resultado da submissão de checklist
 */
export interface ChecklistSubmissionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Status normalizado do checklist (binário: ok ou nok)
 */
export type ChecklistStatus = 'ok' | 'nok' | null;

/**
 * ChecklistService - Serviço de domínio para gestão de checklists
 *
 * Responsável por:
 * - Inicialização de checklist
 * - Carga de dados de checklist
 * - Submissão e validação de checklist
 * - Mapeamento de dados para o schema do banco
 * - Gestão de anomalias
 */
export class ChecklistService {
  private static instance: ChecklistService;
  private readonly supabase = SupabaseService.getInstance().getAdminClient();

  private constructor() {}

  public static getInstance(): ChecklistService {
    if (!ChecklistService.instance) {
      ChecklistService.instance = new ChecklistService();
    }
    return ChecklistService.instance;
  }

  /**
   * Normaliza status do front (2 estados: 'ok' | 'nok') e variações legadas
   */
  private mapStatus(status?: string): ChecklistStatus {
    if (!status) return null;
    const s = String(status).toLowerCase();
    if (s === 'ok' || s === 'good') return 'ok';
    if (s === 'nok' || s === 'attention' || s === 'poor' || s === 'regular' || s === 'critical')
      return 'nok';
    return null;
  }

  /**
   * Agregação binária: se qualquer item for 'nok', retorna 'nok'; caso contrário 'ok'
   */
  private worstStatus(values: (string | undefined)[]): ChecklistStatus {
    const mapped = values.map(v => this.mapStatus(v)).filter(Boolean) as string[];
    if (mapped.length === 0) return null;
    return mapped.some(v => v === 'nok') ? 'nok' : 'ok';
  }

  /**
   * Concatena notas não-vazias com separador
   */
  private concatNotes(notes: (string | undefined)[]): string | null {
    const filtered = notes.filter(n => !!n && String(n).trim() !== '').join(' | ');
    return filtered || null;
  }

  /**
   * Mapeia o payload do front para o schema mechanics_checklist
   */
  public mapChecklistToMechanicsSchema(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: any,
    partnerId: string
  ): Record<string, unknown> {
    const motor_condition = this.worstStatus([
      input.engine,
      input.radiator,
      input.sparkPlugs,
      input.belts,
      input.exhaust,
    ]);
    const motor_notes = this.concatNotes([
      input.engineNotes,
      input.radiatorNotes,
      input.sparkPlugsNotes,
      input.beltsNotes,
      input.exhaustNotes,
    ]);

    const transmission_condition = this.mapStatus(input.clutch);
    const transmission_notes = input.clutchNotes || null;

    const brakes_condition = this.worstStatus([input.brakePads, input.brakeDiscs]);
    const brakes_notes = this.concatNotes([input.brakePadsNotes, input.brakeDiscsNotes]);

    const suspension_condition = this.worstStatus([
      input.suspension,
      input.frontShocks,
      input.rearShocks,
    ]);
    const suspension_notes = this.concatNotes([
      input.suspensionNotes,
      input.frontShocksNotes,
      input.rearShocksNotes,
    ]);

    const tires_condition = this.mapStatus(input.tires);
    const tires_notes = input.tiresNotes || null;

    const electrical_condition = this.worstStatus([
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
    const electrical_notes = this.concatNotes([
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
      motor_notes,

      // Transmissão
      transmission_condition,
      transmission_notes,

      // Freios
      brakes_condition,
      brake_pads_front: input.brake_pads_front ?? null,
      brake_pads_rear: input.brake_pads_rear ?? null,
      brake_discs_front_condition: null,
      brake_discs_rear_condition: null,
      brakes_notes,

      // Suspensão
      suspension_condition,
      suspension_front_left: null,
      suspension_front_right: null,
      suspension_rear_left: null,
      suspension_rear_right: null,
      suspension_notes,

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
      tires_notes,

      // Elétrico
      electrical_condition,
      battery_voltage: null,
      alternator_condition: null,
      electrical_notes,

      // Fluidos
      oil_condition: null,
      oil_level: null,
      coolant_condition: null,
      coolant_level: null,
      brake_fluid_condition: null,
      brake_fluid_level: null,
      fluids_notes: input.fluidsNotes || null,

      // Carroceria / Interior
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
    };
  }

  /**
   * Submete um checklist completo
   *
   * @param data - Dados do checklist
   * @returns Resultado da submissão
   */
  public async submitChecklist(data: ChecklistSubmissionData): Promise<ChecklistSubmissionResult> {
    try {
      const { vehicle_id, inspection_id, partner_id } = data;

      logger.info('submit_checklist_start', {
        vehicle_id: vehicle_id.slice(0, 8),
        inspection_id: inspection_id.slice(0, 8),
        partner_id: partner_id.slice(0, 8),
      });

      // Mapear dados para o schema do banco
      const mapped = this.mapChecklistToMechanicsSchema(data, partner_id);

      // Verificar se já existe checklist
      const { data: existing } = await this.supabase
        .from('mechanics_checklist')
        .select('id')
        .eq('vehicle_id', vehicle_id)
        .eq('inspection_id', inspection_id)
        .maybeSingle();

      let result;
      if (existing) {
        // Atualizar existente
        const { data: updated, error: updateError } = await this.supabase
          .from('mechanics_checklist')
          .update(mapped)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          logger.error('update_checklist_error', { error: updateError.message });
          return { success: false, error: 'Erro ao atualizar checklist' };
        }
        result = updated;
      } else {
        // Inserir novo
        const { data: inserted, error: insertError } = await this.supabase
          .from('mechanics_checklist')
          .insert(mapped)
          .select()
          .single();

        if (insertError) {
          logger.error('insert_checklist_error', { error: insertError.message });
          return { success: false, error: 'Erro ao inserir checklist' };
        }
        result = inserted;
      }

      logger.info('submit_checklist_success', {
        vehicle_id: vehicle_id.slice(0, 8),
        inspection_id: inspection_id.slice(0, 8),
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('submit_checklist_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro interno ao processar checklist' };
    }
  }

  /**
   * Salva itens individuais do checklist
   *
   * @param inspection_id - ID da inspeção
   * @param vehicle_id - ID do veículo
   * @param items - Array de itens do checklist
   */
  public async saveChecklistItems(
    inspection_id: string,
    vehicle_id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: Array<Record<string, any>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('mechanics_checklist_items')
        .upsert(items, { onConflict: 'inspection_id,item_key' });

      if (error) {
        logger.error('save_checklist_items_error', { error: error.message });
        return { success: false, error: 'Erro ao salvar itens do checklist' };
      }

      logger.info('save_checklist_items_success', {
        count: items.length,
        inspection_id: inspection_id.slice(0, 8),
        vehicle_id: vehicle_id.slice(0, 8),
      });

      return { success: true };
    } catch (error) {
      logger.error('save_checklist_items_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro inesperado ao salvar itens' };
    }
  }

  /**
   * Carrega um checklist existente
   *
   * @param vehicle_id - ID do veículo
   * @param inspection_id - ID da inspeção
   */
  public async loadChecklist(vehicle_id: string, inspection_id: string) {
    try {
      const { data, error } = await this.supabase
        .from('mechanics_checklist')
        .select('*')
        .eq('vehicle_id', vehicle_id)
        .eq('inspection_id', inspection_id)
        .maybeSingle();

      if (error) {
        logger.error('load_checklist_error', { error: error.message });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('load_checklist_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Verifica se um checklist existe
   *
   * @param vehicle_id - ID do veículo
   * @param inspection_id - ID da inspeção
   */
  public async checklistExists(vehicle_id: string, inspection_id: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('mechanics_checklist')
        .select('id')
        .eq('vehicle_id', vehicle_id)
        .eq('inspection_id', inspection_id)
        .maybeSingle();

      return !!data;
    } catch (error) {
      logger.error('checklist_exists_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
