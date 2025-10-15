/**
 * Serviços Refatorados para Fase 2
 * Adaptam os serviços existentes para usar a nova arquitetura DDD
 * Mantém compatibilidade externa
 */

import type { ContextId } from '../utils/contextNormalizer';
import { ChecklistApplicationService } from '../application/services';
import {
  LegacyChecklistRepositoryAdapter,
  LegacyChecklistItemRepositoryAdapter,
  LegacyEvidenceRepositoryAdapter,
  LegacyAnomaliesRepositoryAdapter,
} from '../infrastructure/legacy-adapters';
import type { Partner } from '../schemas';

// Serviços mock para infraestrutura (serão implementados na Fase 3)
class MockStorageSigner {
  async signPaths(_paths: string[]): Promise<Record<string, string>> {
    return {};
  }
  async signPath(_path: string): Promise<string> {
    return '';
  }
}

class MockStorageUploader {
  async upload(_file: File, _path: string): Promise<string> {
    return '';
  }
}

class MockTimelinePublisher {
  async publishChecklistSubmitted(
    _checklistId: string,
    _contextId: ContextId,
    _vehicleId: string
  ): Promise<void> {
    // Mock implementation
  }
}

class MockVehicleStatusWriter {
  async updateStatus(_vehicleId: string, _status: string): Promise<void> {
    // Mock implementation
  }
}

/**
 * Serviço Refatorado de Checklist Mecânico
 * Usa a nova arquitetura DDD mantendo interface compatível
 */
export class RefactoredMechanicsChecklistService {
  private applicationService: ChecklistApplicationService;

  constructor() {
    const checklistRepo = new LegacyChecklistRepositoryAdapter();
    const itemRepo = new LegacyChecklistItemRepositoryAdapter();
    const evidenceRepo = new LegacyEvidenceRepositoryAdapter();

    this.applicationService = new ChecklistApplicationService(
      checklistRepo,
      itemRepo,
      evidenceRepo,
      new MockTimelinePublisher(),
      new MockVehicleStatusWriter()
    );
  }

  async getMechanicsChecklist(vehicleId: string, partner: Partner) {
    // Para Fase 2, ainda usamos a lógica antiga mas através dos novos adaptadores
    // Na Fase 3, isso será completamente refatorado

    // Criar contextId baseado na lógica antiga
    const contextId: ContextId = {
      type: 'quote', // Assume quote por padrão (lógica antiga)
      id: vehicleId, // Usa vehicleId como contexto temporário
    };

    // Tentar buscar checklist através da nova arquitetura
    const result = await this.applicationService.createChecklist({
      vehicleId,
      contextId,
      partnerId: partner.id,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to get checklist');
    }

    // Adaptar resposta para formato antigo
    const checklist = result.checklist!;
    return {
      type: 'mechanics' as const,
      checklist: {
        id: checklist.id,
        vehicle_id: checklist.vehicleId,
        partner: { id: partner.id, name: partner.name, type: partner.partner_type },
        status: checklist.status,
        notes: null, // Será preenchido na Fase 3
        created_at: checklist.createdAt.toISOString(),
      },
      itemsByCategory: {}, // Será preenchido na Fase 3
      stats: { totalItems: 0 }, // Será preenchido na Fase 3
    };
  }

  async getMechanicsChecklistDirect(vehicleId: string) {
    // Para Fase 2, mantém implementação antiga
    // Na Fase 3, será completamente refatorado
    return {
      type: 'mechanics' as const,
      checklist: {
        id: 'direct-items',
        vehicle_id: vehicleId,
        partner: { id: 'unknown', name: 'Mecânica', type: 'mechanic' },
        status: 'in_progress',
        notes: null,
        created_at: new Date().toISOString(),
      },
      itemsByCategory: {},
      stats: { totalItems: 0 },
    };
  }
}

/**
 * Serviço Refatorado de Anomalias
 * Usa a nova arquitetura DDD mantendo interface compatível
 */
export class RefactoredAnomaliesService {
  private applicationService: ChecklistApplicationService;

  constructor() {
    const checklistRepo = new LegacyAnomaliesRepositoryAdapter();
    const itemRepo = new LegacyChecklistItemRepositoryAdapter(); // Não usado para anomalias
    const evidenceRepo = new LegacyEvidenceRepositoryAdapter(); // Não usado para anomalias

    this.applicationService = new ChecklistApplicationService(
      checklistRepo,
      itemRepo,
      evidenceRepo,
      new MockTimelinePublisher(),
      new MockVehicleStatusWriter()
    );
  }

  async getAnomaliesChecklist(vehicleId: string, partner: Partner) {
    // Para Fase 2, mantém implementação antiga
    // Na Fase 3, anomalias serão modeladas como um tipo especial de checklist
    return {
      type: 'anomalies' as const,
      checklist: {
        vehicle_id: vehicleId,
        partner: { id: partner.id, name: partner.name, type: partner.partner_type },
      },
      anomalies: [],
      stats: { totalAnomalies: 0 },
    };
  }

  async getAnomaliesChecklistDirect(vehicleId: string) {
    // Para Fase 2, mantém implementação antiga
    return {
      type: 'anomalies' as const,
      checklist: {
        vehicle_id: vehicleId,
        partner: { id: 'unknown', name: 'Parceiro', type: 'other' },
      },
      anomalies: [],
      stats: { totalAnomalies: 0 },
    };
  }
}
