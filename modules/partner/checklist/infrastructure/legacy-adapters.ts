/**
 * Adaptadores para Fase 2 - Ponte entre arquitetura antiga e nova
 * Permite que os serviços existentes usem a nova arquitetura DDD
 */

import type { ContextId } from '../utils/contextNormalizer';
import type {
  ChecklistRepository,
  ChecklistItemRepository,
  EvidenceRepository,
  ChecklistDTO,
  ChecklistItemDTO,
  EvidenceDTO,
  ChecklistStatus,
  ChecklistItemStatus,
} from '../interfaces';
import {
  getLatestChecklistByVehicle,
  getItemsByContext,
  getEvidencesByContext,
} from '../repositories/MechanicsChecklistRepository';
import { getAnomaliesByVehicle } from '../repositories/AnomaliesRepository';
import type { ChecklistItemRow, EvidenceRow } from '../../checklist/schemas';

/**
 * Adaptador para ChecklistRepository - usa repositórios antigos
 */
export class LegacyChecklistRepositoryAdapter implements ChecklistRepository {
  async findById(id: string): Promise<ChecklistDTO | null> {
    // Para compatibilidade, vamos buscar por vehicle_id já que o ID pode ser 'direct-items'
    if (id === 'direct-items') return null;

    const checklist = await getLatestChecklistByVehicle(id);
    if (!checklist) return null;

    return {
      id: checklist.id as string,
      vehicleId: checklist.vehicle_id as string,
      contextId: {
        type: checklist.quote_id ? 'quote' : 'inspection',
        id: (checklist.quote_id || checklist.inspection_id) as string,
      },
      partnerId: 'legacy-partner', // Será determinado pelo contexto
      status: checklist.status as ChecklistStatus,
      createdAt: new Date(checklist.created_at as string),
      updatedAt: new Date((checklist.updated_at as string) || (checklist.created_at as string)),
    };
  }

  async findByContext(contextId: ContextId, vehicleId: string): Promise<ChecklistDTO | null> {
    const checklist = await getLatestChecklistByVehicle(vehicleId);
    if (!checklist) return null;

    // Verificar se o contexto corresponde
    const checklistContextId = checklist.quote_id ? 'quote' : 'inspection';
    const checklistContextValue = checklist.quote_id || checklist.inspection_id;

    if (checklistContextId !== contextId.type || checklistContextValue !== contextId.id) {
      return null;
    }

    return {
      id: checklist.id as string,
      vehicleId: checklist.vehicle_id as string,
      contextId,
      partnerId: 'legacy-partner',
      status: checklist.status as ChecklistStatus,
      createdAt: new Date(checklist.created_at as string),
      updatedAt: new Date((checklist.updated_at as string) || (checklist.created_at as string)),
    };
  }

  async save(checklist: Omit<ChecklistDTO, 'id'>): Promise<ChecklistDTO> {
    // Para Fase 2, vamos apenas retornar o que foi passado
    // A persistência real continua sendo feita pelos repositórios antigos
    const now = new Date();
    return {
      id: `temp-${Date.now()}`,
      ...checklist,
      createdAt: checklist.createdAt || now,
      updatedAt: checklist.updatedAt || now,
    };
  }

  async updateStatus(_id: string, _status: string): Promise<void> {
    // Para Fase 2, não implementamos atualização real
  }
}

/**
 * Adaptador para ChecklistItemRepository - usa repositórios antigos
 */
export class LegacyChecklistItemRepositoryAdapter implements ChecklistItemRepository {
  async findByChecklistId(checklistId: string): Promise<ChecklistItemDTO[]> {
    // Para compatibilidade, checklistId pode ser vehicleId ou 'direct-items'
    let items: ChecklistItemRow[] = [];

    if (checklistId === 'direct-items') {
      // Buscar por vehicle_id diretamente
      // Como não temos acesso direto, vamos buscar por contexto vazio
      items = await getItemsByContext({ vehicle_id: checklistId });
    } else {
      // Buscar checklist para obter contexto
      const checklist = await getLatestChecklistByVehicle(checklistId);
      if (checklist) {
        items = await getItemsByContext({
          quote_id: checklist.quote_id as string | null,
          inspection_id: checklist.inspection_id as string | null,
          vehicle_id:
            checklist.quote_id || checklist.inspection_id
              ? undefined
              : (checklist.vehicle_id as string),
        });
      }
    }

    return items.map(item => ({
      id: item.id,
      checklistId: checklistId,
      itemKey: item.item_key,
      status: item.item_status as ChecklistItemStatus,
      notes: item.item_notes || undefined,
      createdAt: new Date(item.created_at || Date.now()),
    }));
  }

  async saveMany(items: Omit<ChecklistItemDTO, 'id'>[]): Promise<ChecklistItemDTO[]> {
    // Para Fase 2, apenas retornamos os itens com IDs temporários
    // A persistência real continua sendo feita pelos repositórios antigos
    return items.map(item => ({
      id: `temp-item-${Date.now()}-${Math.random()}`,
      ...item,
      createdAt: item.createdAt || new Date(),
    }));
  }

  async deleteByChecklistId(checklistId: string): Promise<void> {
    // Para Fase 2, não implementamos deleção real
  }
}

/**
 * Adaptador para EvidenceRepository - usa repositórios antigos
 */
export class LegacyEvidenceRepositoryAdapter implements EvidenceRepository {
  async findByChecklistId(checklistId: string): Promise<EvidenceDTO[]> {
    let evidences: EvidenceRow[] = [];

    if (checklistId === 'direct-items') {
      // Não temos evidências diretas por vehicle_id
      return [];
    } else {
      // Buscar checklist para obter contexto
      const checklist = await getLatestChecklistByVehicle(checklistId);
      if (checklist) {
        evidences = await getEvidencesByContext({
          quote_id: checklist.quote_id as string | null,
          inspection_id: checklist.inspection_id as string | null,
        });
      }
    }

    return evidences.map(evidence => ({
      id: evidence.id,
      checklistId: checklistId,
      evidenceKey: evidence.item_key,
      storagePath: evidence.storage_path,
      mediaType: evidence.media_type || undefined,
      description: evidence.description || undefined,
      createdAt: new Date(), // EvidenceRow pode não ter created_at
    }));
  }

  async saveMany(evidences: Omit<EvidenceDTO, 'id'>[]): Promise<EvidenceDTO[]> {
    // Para Fase 2, apenas retornamos as evidências com IDs temporários
    return evidences.map(evidence => ({
      id: `temp-evidence-${Date.now()}-${Math.random()}`,
      ...evidence,
      createdAt: evidence.createdAt || new Date(),
    }));
  }

  async deleteByChecklistId(checklistId: string): Promise<void> {
    // Para Fase 2, não implementamos deleção real
  }
}

/**
 * Adaptador para Anomalies - mapeia anomalias como checklists
 */
export class LegacyAnomaliesRepositoryAdapter implements ChecklistRepository {
  async findById(id: string): Promise<ChecklistDTO | null> {
    // Anomalies não têm ID específico, sempre retorna null para findById
    return null;
  }

  async findByContext(contextId: ContextId, vehicleId: string): Promise<ChecklistDTO | null> {
    // Anomalies são sempre por vehicle, não por contexto específico
    const anomalies = await getAnomaliesByVehicle(vehicleId);
    if (!anomalies || anomalies.length === 0) return null;

    return {
      id: `anomalies-${vehicleId}`,
      vehicleId,
      contextId,
      partnerId: 'anomalies-partner',
      status: 'draft', // Anomalies não têm status específico
      createdAt: new Date(anomalies[0].created_at),
      updatedAt: new Date(anomalies[0].created_at),
    };
  }

  async save(checklist: Omit<ChecklistDTO, 'id'>): Promise<ChecklistDTO> {
    // Anomalies são read-only na arquitetura atual
    const now = new Date();
    return {
      id: `anomalies-${checklist.vehicleId}`,
      ...checklist,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateStatus(id: string, status: string): Promise<void> {
    // Anomalies não têm status para atualizar
  }
}
