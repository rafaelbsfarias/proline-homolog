import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { TABLES, BUCKETS } from '@/modules/common/constants/database';
import {
  CHECKLIST_STATUS,
  LEGACY_STATUS_MAP,
  UI_STATUS,
  WORKFLOW_STATUS,
} from '@/modules/partner/constants/checklist';
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
export type ChecklistStatus = (typeof CHECKLIST_STATUS)[keyof typeof CHECKLIST_STATUS] | null;

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
  public mapStatus(status?: string): ChecklistStatus {
    if (!status) return null;
    const normalized = String(status).toLowerCase();
    return LEGACY_STATUS_MAP[normalized] || null;
  }

  /**
   * Agregação binária: se qualquer item for 'nok', retorna 'nok'; caso contrário 'ok'
   */
  private worstStatus(values: (string | undefined)[]): ChecklistStatus {
    const mapped = values.map(v => this.mapStatus(v)).filter(Boolean) as string[];
    if (mapped.length === 0) return null;
    return mapped.some(v => v === CHECKLIST_STATUS.NOK)
      ? CHECKLIST_STATUS.NOK
      : CHECKLIST_STATUS.OK;
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
      status: input.status || WORKFLOW_STATUS.SUBMITTED,
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
        .from(TABLES.MECHANICS_CHECKLIST)
        .select('id')
        .eq('vehicle_id', vehicle_id)
        .eq('inspection_id', inspection_id)
        .maybeSingle();

      let result;
      if (existing) {
        // Atualizar existente
        const { data: updated, error: updateError } = await this.supabase
          .from(TABLES.MECHANICS_CHECKLIST)
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
          .from(TABLES.MECHANICS_CHECKLIST)
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
        .from(TABLES.MECHANICS_CHECKLIST_ITEMS)
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
        .from(TABLES.MECHANICS_CHECKLIST)
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
   * Carrega checklist completo com evidências e itens formatados para UI
   *
   * @param inspection_id - ID da inspeção
   */
  public async loadChecklistWithDetails(inspection_id: string) {
    try {
      // 1) Carregar mechanics_checklist por inspection_id
      const { data: checklist, error: checklistError } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST)
        .select('*')
        .eq('inspection_id', inspection_id)
        .single();

      if (checklistError && checklistError.code !== 'PGRST116') {
        logger.error('load_checklist_error', { error: checklistError.message });
        return { success: false, error: checklistError.message };
      }

      // 2) Carregar evidências e gerar URLs públicas
      const { data: evidences, error: evError } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
        .select('item_key, storage_path')
        .eq('inspection_id', inspection_id);

      if (evError) {
        logger.error('load_evidences_error', { error: evError.message });
        return { success: false, error: evError.message };
      }

      const evidenceMap: Record<string, { url: string }> = {};
      if (Array.isArray(evidences) && evidences.length > 0) {
        for (const row of evidences) {
          try {
            const { data: signed } = await this.supabase.storage
              .from(BUCKETS.VEHICLE_MEDIA)
              .createSignedUrl(row.storage_path, 60 * 60); // 1h
            const url = signed?.signedUrl || '';
            if (url) evidenceMap[row.item_key] = { url };
          } catch (err) {
            logger.error('create_signed_url_error', {
              item_key: row.item_key,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      }

      // 3) Carregar itens por inspeção e montar objeto para UI
      const { data: items, error: itemsError } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST_ITEMS)
        .select('item_key, item_status, item_notes')
        .eq('inspection_id', inspection_id);

      if (itemsError) {
        logger.error('load_items_error', { error: itemsError.message });
        return { success: false, error: itemsError.message };
      }

      // 4) Construir formPartial: observações gerais e itens persistidos
      const formPartial: Record<string, string | { url: string }> = {};

      if (checklist) {
        formPartial.observations = checklist.general_observations || '';
        formPartial.fluidsNotes = checklist.fluids_notes || '';
      }

      if (Array.isArray(items)) {
        for (const it of items) {
          formPartial[it.item_key] = this.toFrontStatus(it.item_status);
          // Mapear notesKey como `${item_key}Notes`
          const notesKey = `${it.item_key}Notes`;
          formPartial[notesKey] = it.item_notes || '';
        }
      }

      logger.info('load_checklist_with_details_ok', {
        inspection_id,
        hasChecklist: !!checklist,
        itemsCount: Array.isArray(items) ? items.length : 0,
        evidencesCount: Array.isArray(evidences) ? evidences.length : 0,
      });

      return {
        success: true,
        data: {
          form: formPartial,
          evidences: evidenceMap,
        },
      };
    } catch (error) {
      logger.error('load_checklist_with_details_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro ao carregar checklist' };
    }
  }

  /**
   * Converte status do DB para formato da UI
   */
  private toFrontStatus(db?: string): (typeof UI_STATUS)[keyof typeof UI_STATUS] {
    const s = (db || '').toLowerCase();
    if (s === CHECKLIST_STATUS.OK) return UI_STATUS.OK;
    if (s === CHECKLIST_STATUS.NOK) return UI_STATUS.ATTENTION;
    return UI_STATUS.OK;
  }

  /**
   * Carrega anomalias com URLs assinadas para as fotos
   *
   * @param inspection_id - ID da inspeção
   * @param vehicle_id - ID do veículo
   */
  public async loadAnomaliesWithSignedUrls(inspection_id: string, vehicle_id: string) {
    try {
      // Buscar anomalias existentes
      const { data: anomalies, error: anomaliesError } = await this.supabase
        .from('vehicle_anomalies')
        .select('*')
        .eq('inspection_id', inspection_id)
        .eq('vehicle_id', vehicle_id)
        .order('created_at', { ascending: true });

      if (anomaliesError) {
        logger.error('load_anomalies_error', {
          error: anomaliesError.message,
          inspection_id,
          vehicle_id,
        });
        return { success: false, error: 'Erro ao carregar anomalias' };
      }

      logger.info('anomalies_loaded_successfully', {
        count: anomalies?.length || 0,
        inspection_id,
        vehicle_id,
      });

      // Converter para o formato esperado pelo frontend
      // Gerar URLs assinadas para as imagens (válidas por 1 hora)
      const formattedAnomalies = await Promise.all(
        (anomalies || []).map(async anomaly => {
          const signedPhotos = await Promise.all(
            (anomaly.photos || []).map(async (photoPath: string) => {
              try {
                // Extrair o caminho da imagem (remover domínio/bucket se presente)
                let path = photoPath;

                // Se for uma URL completa, extrair apenas o path
                if (photoPath.includes('vehicle-media/')) {
                  const parts = photoPath.split('vehicle-media/');
                  path = parts[parts.length - 1];
                }

                // Se começar com barra, remover
                if (path.startsWith('/')) {
                  path = path.substring(1);
                }

                const { data: signedData, error: signedError } = await this.supabase.storage
                  .from(BUCKETS.VEHICLE_MEDIA)
                  .createSignedUrl(path, 3600); // 1 hora de validade

                if (signedError || !signedData) {
                  logger.warn('failed_to_sign_url', {
                    original: photoPath,
                    extracted_path: path,
                    error: signedError?.message,
                  });
                  return photoPath; // Retorna o path original como fallback
                }

                return signedData.signedUrl;
              } catch (error) {
                logger.error('sign_url_exception', {
                  path: photoPath,
                  error: error instanceof Error ? error.message : String(error),
                });
                return photoPath;
              }
            })
          );

          return {
            id: anomaly.id,
            description: anomaly.description,
            photos: signedPhotos,
          };
        })
      );

      return {
        success: true,
        data: formattedAnomalies,
      };
    } catch (error) {
      logger.error('load_anomalies_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro ao carregar anomalias' };
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
        .from(TABLES.MECHANICS_CHECKLIST)
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

  /**
   * Verifica se existe um checklist submetido para um veículo
   *
   * @param vehicle_id - ID do veículo
   */
  public async hasSubmittedChecklist(vehicle_id: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST)
        .select('id')
        .eq('vehicle_id', vehicle_id)
        .eq('status', WORKFLOW_STATUS.SUBMITTED)
        .limit(1)
        .maybeSingle();

      return !!data;
    } catch (error) {
      logger.error('has_submitted_checklist_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
