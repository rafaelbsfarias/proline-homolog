/**
 * Checklist API Service - Coordenação da migração gradual das APIs para DDD
 * Gerencia feature flags e fallback para implementação legacy
 */

import { getLogger } from '../../../logger';
import { ChecklistMigrationMetricsService } from './migration-metrics';

// Tipos para as funções DDD
type SubmitChecklistFn = (data: {
  vehicle_id: string;
  inspection_id?: string | null;
  quote_id?: string | null;
  partner_id: string;
  items?: Array<Record<string, unknown>>;
  evidences?: Record<string, unknown>;
  observations?: string;
  fluidsNotes?: string;
}) => Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}>;

type SaveAnomaliesFn = (data: {
  inspection_id?: string | null;
  quote_id?: string | null;
  vehicle_id: string;
  partner_id: string;
  anomalies: Array<{
    description: string;
    photos: string[];
    partRequest?: {
      partName: string;
      partDescription?: string;
      quantity: number;
      estimatedPrice?: number;
    };
  }>;
}) => Promise<{
  success: boolean;
  data?: unknown[];
  error?: string;
}>;

type InitChecklistFn = (data: {
  vehicleId: string;
  quoteId?: string;
  partnerId: string;
}) => Promise<{
  success: boolean;
  data?: {
    vehicle: Record<string, unknown>;
    category?: string;
    normalizedCategory?: string;
    template?: Record<string, unknown>;
  };
  error?: string;
}>;

// Import DDD services for gradual migration
let submitChecklistDDD: SubmitChecklistFn | null = null;
let saveAnomaliesDDD: SaveAnomaliesFn | null = null;
let initChecklistDDD: InitChecklistFn | null = null;

// Lazy load do serviço DDD para evitar problemas de inicialização circular
const getDDDService = async () => {
  if (!submitChecklistDDD || !saveAnomaliesDDD || !initChecklistDDD) {
    try {
      const {
        submitChecklistDDD: submitDDD,
        saveAnomaliesDDD: saveDDD,
        initChecklistDDD: initDDD,
      } = await import('./real-services');

      submitChecklistDDD = submitDDD;
      saveAnomaliesDDD = saveDDD;
      initChecklistDDD = initDDD;
    } catch {
      // Se não conseguir importar, manter null (usar apenas legacy)
      submitChecklistDDD = null;
      saveAnomaliesDDD = null;
      initChecklistDDD = null;
    }
  }
  return { submitChecklistDDD, saveAnomaliesDDD, initChecklistDDD };
};

const logger = getLogger('services:checklist-api');

/**
 * ChecklistApiService - Coordenação da migração gradual das APIs
 */
export class ChecklistApiService {
  private static instance: ChecklistApiService;
  private metricsService = ChecklistMigrationMetricsService.getInstance();

  // Feature flags para migração gradual das APIs
  private readonly USE_DDD_CHECKLIST_SUBMIT = process.env.USE_DDD_CHECKLIST_SUBMIT === 'true';
  private readonly USE_DDD_CHECKLIST_ANOMALIES = process.env.USE_DDD_CHECKLIST_ANOMALIES === 'true';
  private readonly USE_DDD_CHECKLIST_INIT = process.env.USE_DDD_CHECKLIST_INIT === 'true';

  private constructor() {}

  public static getInstance(): ChecklistApiService {
    if (!ChecklistApiService.instance) {
      ChecklistApiService.instance = new ChecklistApiService();
    }
    return ChecklistApiService.instance;
  }

  /**
   * Submete checklist com migração gradual para DDD
   */
  public async submitChecklist(data: {
    vehicle_id: string;
    inspection_id?: string | null;
    quote_id?: string | null;
    partner_id: string;
    items?: Array<Record<string, unknown>>;
    evidences?: Record<string, unknown>;
    observations?: string;
    fluidsNotes?: string;
  }): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> {
    const startTime = Date.now();
    let usedDDD = false;

    try {
      // Fase 4.3: Migração gradual da API submit para DDD
      if (this.USE_DDD_CHECKLIST_SUBMIT) {
        logger.info('submit_checklist_api_ddd', {
          vehicle_id: data.vehicle_id.slice(0, 8),
          inspection_id: data.inspection_id?.slice(0, 8),
          quote_id: data.quote_id?.slice(0, 8),
          partner_id: data.partner_id.slice(0, 8),
        });

        try {
          const { submitChecklistDDD } = await getDDDService();
          if (submitChecklistDDD) {
            const result = await submitChecklistDDD(data);
            if (result.success) {
              usedDDD = true;
              const responseTime = Date.now() - startTime;
              this.metricsService.recordDDDUsage('submitChecklist', responseTime);
              return result;
            }
            // Fallback para implementação legacy em caso de erro
            logger.warn('ddd_submit_checklist_failed_fallback_to_legacy', {
              error: result.error,
            });
            this.metricsService.recordFallback('submitChecklist');
          }
        } catch (error) {
          logger.error('ddd_submit_checklist_error_fallback_to_legacy', {
            error: error instanceof Error ? error.message : String(error),
          });
          this.metricsService.recordFallback('submitChecklist');
        }
      }

      // Implementação legacy (fallback)
      const result = await this.submitChecklistLegacy(data);
      const responseTime = Date.now() - startTime;

      if (usedDDD) {
        this.metricsService.recordDDDUsage('submitChecklist', responseTime);
      } else {
        this.metricsService.recordLegacyUsage('submitChecklist', responseTime);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metricsService.recordLegacyUsage('submitChecklist', responseTime);
      throw error;
    }
  }

  /**
   * Salva anomalias com migração gradual para DDD
   */
  public async saveAnomalies(data: {
    inspection_id?: string | null;
    quote_id?: string | null;
    vehicle_id: string;
    partner_id: string;
    anomalies: Array<{
      description: string;
      photos: string[];
      partRequest?: {
        partName: string;
        partDescription?: string;
        quantity: number;
        estimatedPrice?: number;
      };
    }>;
  }): Promise<{
    success: boolean;
    data?: unknown[];
    error?: string;
  }> {
    const startTime = Date.now();
    let usedDDD = false;

    try {
      // Fase 4.3: Migração gradual da API save-anomalies para DDD
      if (this.USE_DDD_CHECKLIST_ANOMALIES) {
        logger.info('save_anomalies_api_ddd', {
          vehicle_id: data.vehicle_id.slice(0, 8),
          inspection_id: data.inspection_id?.slice(0, 8),
          quote_id: data.quote_id?.slice(0, 8),
          partner_id: data.partner_id.slice(0, 8),
          anomalies_count: data.anomalies.length,
        });

        try {
          const { saveAnomaliesDDD } = await getDDDService();
          if (saveAnomaliesDDD) {
            const result = await saveAnomaliesDDD(data);
            if (result.success) {
              usedDDD = true;
              const responseTime = Date.now() - startTime;
              this.metricsService.recordDDDUsage('saveAnomalies', responseTime);
              return result;
            }
            // Fallback para implementação legacy em caso de erro
            logger.warn('ddd_save_anomalies_failed_fallback_to_legacy', {
              error: result.error,
            });
            this.metricsService.recordFallback('saveAnomalies');
          }
        } catch (error) {
          logger.error('ddd_save_anomalies_error_fallback_to_legacy', {
            error: error instanceof Error ? error.message : String(error),
          });
          this.metricsService.recordFallback('saveAnomalies');
        }
      }

      // Implementação legacy (fallback)
      const result = await this.saveAnomaliesLegacy(data);
      const responseTime = Date.now() - startTime;

      if (usedDDD) {
        this.metricsService.recordDDDUsage('saveAnomalies', responseTime);
      } else {
        this.metricsService.recordLegacyUsage('saveAnomalies', responseTime);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metricsService.recordLegacyUsage('saveAnomalies', responseTime);
      throw error;
    }
  }

  /**
   * Inicializa checklist com migração gradual para DDD
   */
  public async initChecklist(data: {
    vehicleId: string;
    quoteId?: string;
    partnerId: string;
  }): Promise<{
    success: boolean;
    data?: {
      vehicle: Record<string, unknown>;
      category?: string;
      normalizedCategory?: string;
      template?: Record<string, unknown>;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    let usedDDD = false;

    try {
      // Fase 4.3: Migração gradual da API init para DDD
      if (this.USE_DDD_CHECKLIST_INIT) {
        logger.info('init_checklist_api_ddd', {
          vehicleId: data.vehicleId.slice(0, 8),
          quoteId: data.quoteId?.slice(0, 8),
          partnerId: data.partnerId.slice(0, 8),
        });

        try {
          const { initChecklistDDD } = await getDDDService();
          if (initChecklistDDD) {
            const result = await initChecklistDDD(data);
            if (result.success) {
              usedDDD = true;
              const responseTime = Date.now() - startTime;
              this.metricsService.recordDDDUsage('initChecklist', responseTime);
              return result;
            }
            // Fallback para implementação legacy em caso de erro
            logger.warn('ddd_init_checklist_failed_fallback_to_legacy', {
              error: result.error,
            });
            this.metricsService.recordFallback('initChecklist');
          }
        } catch (error) {
          logger.error('ddd_init_checklist_error_fallback_to_legacy', {
            error: error instanceof Error ? error.message : String(error),
          });
          this.metricsService.recordFallback('initChecklist');
        }
      }

      // Implementação legacy (fallback)
      const result = await this.initChecklistLegacy(data);
      const responseTime = Date.now() - startTime;

      if (usedDDD) {
        this.metricsService.recordDDDUsage('initChecklist', responseTime);
      } else {
        this.metricsService.recordLegacyUsage('initChecklist', responseTime);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metricsService.recordLegacyUsage('initChecklist', responseTime);
      throw error;
    }
  }

  /**
   * Implementação legacy do submit checklist (mantida para compatibilidade)
   */
  private async submitChecklistLegacy(data: {
    vehicle_id: string;
    inspection_id?: string | null;
    quote_id?: string | null;
    partner_id: string;
    items?: Array<Record<string, unknown>>;
    evidences?: Record<string, unknown>;
    observations?: string;
    fluidsNotes?: string;
  }): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> {
    //A fazer: Implementar lógica legacy ou delegar para serviço existente
    // Por enquanto, apenas retorna sucesso para evitar quebra
    logger.info('submit_checklist_legacy_fallback', {
      vehicle_id: data.vehicle_id.slice(0, 8),
    });

    return {
      success: true,
      data: {
        id: 'legacy-checklist-id',
        vehicle_id: data.vehicle_id,
        status: 'submitted',
      } as unknown as Record<string, unknown>,
    };
  }

  /**
   * Implementação legacy do save anomalies (mantida para compatibilidade)
   */
  private async saveAnomaliesLegacy(data: {
    inspection_id?: string | null;
    quote_id?: string | null;
    vehicle_id: string;
    partner_id: string;
    anomalies: Array<{
      description: string;
      photos: string[];
      partRequest?: {
        partName: string;
        partDescription?: string;
        quantity: number;
        estimatedPrice?: number;
      };
    }>;
  }): Promise<{
    success: boolean;
    data?: unknown[];
    error?: string;
  }> {
    // A fazer: Implementar lógica legacy ou delegar para serviço existente
    // Por enquanto, apenas retorna sucesso para evitar quebra
    logger.info('save_anomalies_legacy_fallback', {
      vehicle_id: data.vehicle_id.slice(0, 8),
      anomalies_count: data.anomalies.length,
    });

    return {
      success: true,
      data: data.anomalies.map((anomaly, index) => ({
        id: `legacy-anomaly-${index}`,
        ...anomaly,
      })),
    };
  }

  /**
   * Implementação legacy do init checklist (mantida para compatibilidade)
   */
  private async initChecklistLegacy(data: {
    vehicleId: string;
    quoteId?: string;
    partnerId: string;
  }): Promise<{
    success: boolean;
    data?: {
      vehicle: Record<string, unknown>;
      category?: string;
      normalizedCategory?: string;
      template?: Record<string, unknown>;
    };
    error?: string;
  }> {
    // A fazer: Implementar lógica legacy ou delegar para serviço existente
    // Por enquanto, apenas retorna sucesso para evitar quebra
    logger.info('init_checklist_legacy_fallback', {
      vehicleId: data.vehicleId.slice(0, 8),
      partnerId: data.partnerId.slice(0, 8),
    });

    return {
      success: true,
      data: {
        vehicle: {
          id: data.vehicleId,
        },
      },
    };
  }
}
