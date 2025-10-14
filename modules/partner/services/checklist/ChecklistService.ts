import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { ChecklistRepository } from './core/ChecklistRepository';
import { ChecklistMapper } from './core/ChecklistMapper';
import { EvidenceService } from './evidences/EvidenceService';
import { AnomalyService } from './anomalies/AnomalyService';
import { ChecklistItemService } from './items/ChecklistItemService';
import { ChecklistSubmissionData, ChecklistSubmissionResult, LoadChecklistOptions } from './types';

const logger = getLogger('services:checklist');

/**
 * ChecklistService - Orquestrador principal
 *
 * Responsável por:
 * - Coordenar operações entre serviços especializados
 * - Expor API unificada para consumidores
 * - Manter compatibilidade com código existente
 */
export class ChecklistService {
  private static instance: ChecklistService;
  private readonly supabase = SupabaseService.getInstance().getAdminClient();

  // Serviços especializados
  private readonly repository: ChecklistRepository;
  private readonly evidenceService: EvidenceService;
  private readonly anomalyService: AnomalyService;
  private readonly itemService: ChecklistItemService;

  private constructor() {
    this.repository = new ChecklistRepository(this.supabase);
    this.evidenceService = new EvidenceService(this.supabase);
    this.anomalyService = new AnomalyService(this.supabase);
    this.itemService = new ChecklistItemService(this.supabase);
  }

  public static getInstance(): ChecklistService {
    if (!ChecklistService.instance) {
      ChecklistService.instance = new ChecklistService();
    }
    return ChecklistService.instance;
  }

  /**
   * Submete um checklist completo
   */
  public async submitChecklist(data: ChecklistSubmissionData): Promise<ChecklistSubmissionResult> {
    try {
      const { vehicle_id, inspection_id, partner_id } = data;

      logger.info('submit_checklist_start', {
        vehicle_id: vehicle_id.slice(0, 8),
        inspection_id: inspection_id.slice(0, 8),
      });

      // Mapear dados
      const mapped = ChecklistMapper.toDatabase(data, partner_id);

      // Verificar se já existe
      const existing = await this.repository.findOne({
        vehicle_id,
        inspection_id,
      });

      let result;
      if (existing?.id) {
        result = await this.repository.update(existing.id, mapped);
      } else {
        result = await this.repository.create(mapped);
      }

      logger.info('submit_checklist_success', {
        vehicle_id: vehicle_id.slice(0, 8),
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('submit_checklist_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro ao processar checklist' };
    }
  }

  /**
   * Salva itens individuais do checklist
   */
  public async saveChecklistItems(
    inspection_id: string,
    vehicle_id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: Array<Record<string, any>>
  ): Promise<{ success: boolean; error?: string }> {
    return this.itemService.saveItems(inspection_id, vehicle_id, items);
  }

  /**
   * Carrega checklist completo com evidências e itens
   */
  public async loadChecklistWithDetails(
    inspection_id?: string | null,
    quote_id?: string | null,
    partner_id?: string
  ) {
    try {
      const options: LoadChecklistOptions = { inspection_id, quote_id };

      // Garantir escopo do parceiro: se partner_id foi informado, validar ownership.
      // Se não há registro do parceiro, retornar dados vazios para evitar vazamento.
      let checklist = null as unknown as Awaited<ReturnType<typeof this.repository.findOne>>;
      if (partner_id) {
        checklist = await this.repository.findOneForPartner(options, partner_id);
        if (!checklist) {
          return { success: true, data: { form: null, evidences: {} } };
        }
      } else {
        checklist = await this.repository.findOne(options);
      }

      // Carregar itens e evidências somente após validar o escopo
      const [evidences, items] = await Promise.all([
        this.evidenceService.loadWithSignedUrls(options),
        this.itemService.loadItems(options),
      ]);

      // Construir formPartial
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formPartial = this.buildFormPartial(checklist as any, items);

      return {
        success: true,
        data: {
          form: formPartial,
          evidences,
        },
      };
    } catch (error) {
      logger.error('load_checklist_with_details_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro ao carregar checklist' };
    }
  }

  /**
   * Carrega anomalias com URLs assinadas
   */
  public async loadAnomaliesWithSignedUrls(
    inspection_id: string | null,
    vehicle_id: string,
    quote_id?: string | null
  ) {
    try {
      const options: LoadChecklistOptions = { inspection_id, quote_id };
      const anomalies = await this.anomalyService.loadWithSignedUrls(vehicle_id, options);

      return {
        success: true,
        data: anomalies,
      };
    } catch (error) {
      logger.error('load_anomalies_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro ao carregar anomalias' };
    }
  }

  /**
   * Verifica se existe checklist
   */
  public async checklistExists(vehicle_id: string, inspection_id: string): Promise<boolean> {
    return this.repository.exists(vehicle_id, inspection_id);
  }

  /**
   * Verifica se existe checklist submetido
   * Suporta inspection_id (legacy) ou quote_id (novo)
   */
  public async hasSubmittedChecklist(
    vehicle_id: string,
    inspection_id?: string | null | undefined,
    quote_id?: string | null
  ): Promise<boolean> {
    try {
      const options: LoadChecklistOptions = {};

      // Priorizar quote_id se fornecido
      if (quote_id) {
        options.quote_id = quote_id;
      } else if (inspection_id) {
        options.inspection_id = inspection_id;
      } else {
        // Se nenhum ID foi fornecido, retornar false
        return false;
      }

      options.vehicle_id = vehicle_id;

      const checklist = await this.repository.findOne(options);
      return !!checklist && checklist.status === 'submitted';
    } catch {
      return false;
    }
  }

  /**
   * Normaliza status do front (2 estados: 'ok' | 'nok') e variações legadas
   * Exposto para uso em endpoints que precisam mapear status manualmente
   */
  public mapStatus(status?: string): string | null {
    if (!status) return null;
    const normalized = String(status).toLowerCase();

    // Mapeamento de status legados
    const legacyMap: Record<string, string> = {
      ok: 'ok',
      good: 'ok',
      nok: 'nok',
      poor: 'nok',
      regular: 'nok',
      attention: 'nok',
      critical: 'nok',
    };

    return legacyMap[normalized] || null;
  }

  /**
   * Constrói objeto form para UI
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildFormPartial(checklist: any, items: any[]): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form: Record<string, any> = {};

    if (checklist) {
      form.observations = checklist.general_observations || '';
      form.fluidsNotes = checklist.fluids_notes || '';
    }

    if (Array.isArray(items)) {
      for (const item of items) {
        form[item.item_key] = item.item_status;
        form[`${item.item_key}Notes`] = item.item_notes || '';
      }
    }

    return form;
  }

  /**
   * @deprecated Use ChecklistMapper.toDatabase() diretamente
   * Mantido apenas para compatibilidade com código legado
   */
  public mapChecklistToMechanicsSchema(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: any,
    partnerId: string
  ): Record<string, unknown> {
    return ChecklistMapper.toDatabase(input, partnerId);
  }

  /**
   * Carrega um checklist existente (backward compatibility)
   */
  public async loadChecklist(vehicle_id: string, inspection_id: string) {
    try {
      return await this.repository.findOne({ vehicle_id, inspection_id });
    } catch (error) {
      logger.error('load_checklist_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

// Re-exportar tipos para backward compatibility
export type { ChecklistSubmissionData, ChecklistSubmissionResult } from './types';
export type { ChecklistStatus } from './types';
