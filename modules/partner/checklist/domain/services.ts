/**
 * Serviços de domínio para o Checklist
 * Lógica de negócio pura que não pertence a uma entidade específica
 */

import type { ContextId } from '../utils/contextNormalizer';
import type { ChecklistItemStatus } from '../interfaces';
import { Checklist, ChecklistItem, Evidence } from './entities';
import { ItemKey, EvidenceKey, StoragePath, Notes, MediaType, Description } from './value-objects';

// Serviço para validação de regras de negócio do checklist
export class ChecklistDomainService {
  /**
   * Valida se um checklist pode ser criado para o contexto
   */
  static canCreateChecklist(
    vehicleId: string,
    contextId: ContextId,
    partnerId: string
  ): { isValid: boolean; reason?: string } {
    if (!vehicleId || vehicleId.trim().length === 0) {
      return { isValid: false, reason: 'Vehicle ID is required' };
    }

    if (!partnerId || partnerId.trim().length === 0) {
      return { isValid: false, reason: 'Partner ID is required' };
    }

    if (!contextId.id || contextId.id.trim().length === 0) {
      return { isValid: false, reason: 'Context ID is required' };
    }

    return { isValid: true };
  }

  /**
   * Valida se um item pode ser adicionado ao checklist
   */
  static canAddItemToChecklist(
    checklist: Checklist,
    itemKey: ItemKey
  ): { isValid: boolean; reason?: string } {
    if (checklist.status !== 'draft') {
      return { isValid: false, reason: 'Cannot add items to a submitted checklist' };
    }

    // Verifica se já existe um item com a mesma chave
    const existingItem = checklist.items.find(item => item.itemKey.equals(itemKey));

    if (existingItem) {
      return { isValid: false, reason: 'Item with this key already exists in the checklist' };
    }

    return { isValid: true };
  }

  /**
   * Valida se uma evidência pode ser adicionada ao checklist
   */
  static canAddEvidenceToChecklist(
    checklist: Checklist,
    evidenceKey: EvidenceKey
  ): { isValid: boolean; reason?: string } {
    if (checklist.status !== 'draft') {
      return { isValid: false, reason: 'Cannot add evidences to a submitted checklist' };
    }

    // Verifica se já existe uma evidência com a mesma chave
    const existingEvidence = checklist.evidences.find(evidence =>
      evidence.evidenceKey.equals(evidenceKey)
    );

    if (existingEvidence) {
      return { isValid: false, reason: 'Evidence with this key already exists in the checklist' };
    }

    return { isValid: true };
  }

  /**
   * Valida se um checklist pode ser submetido
   */
  static canSubmitChecklist(checklist: Checklist): { isValid: boolean; reason?: string } {
    if (checklist.status !== 'draft') {
      return { isValid: false, reason: 'Checklist is already submitted' };
    }

    if (checklist.items.length === 0) {
      return { isValid: false, reason: 'Cannot submit checklist without items' };
    }

    // Verifica se todos os itens obrigatórios estão preenchidos
    const incompleteItems = checklist.items.filter(item => !item.isCompleted());
    if (incompleteItems.length > 0) {
      return {
        isValid: false,
        reason: `Cannot submit checklist with ${incompleteItems.length} incomplete items`,
      };
    }

    return { isValid: true };
  }

  /**
   * Calcula estatísticas do checklist
   */
  static calculateChecklistStats(checklist: Checklist): {
    totalItems: number;
    completedItems: number;
    itemsNeedingAttention: number;
    completionPercentage: number;
  } {
    const totalItems = checklist.items.length;
    const completedItems = checklist.items.filter(item => item.isCompleted()).length;
    const itemsNeedingAttention = checklist.items.filter(item => item.needsAttention()).length;
    const completionPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      completedItems,
      itemsNeedingAttention,
      completionPercentage,
    };
  }
}

// Serviço para criação de entidades do domínio
export class ChecklistFactory {
  /**
   * Cria um novo checklist com validação
   */
  static createChecklist(vehicleId: string, contextId: ContextId, partnerId: string): Checklist {
    const validation = ChecklistDomainService.canCreateChecklist(vehicleId, contextId, partnerId);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    return Checklist.createNew(vehicleId, contextId, partnerId);
  }

  /**
   * Cria um novo item de checklist
   */
  static createChecklistItem(
    checklistId: string,
    itemKey: string,
    status: ChecklistItemStatus,
    notes?: string
  ): ChecklistItem {
    const itemKeyVO = ItemKey.create(itemKey);
    const notesVO = Notes.create(notes);

    return ChecklistItem.createNew(checklistId, itemKeyVO, status, notesVO);
  }

  /**
   * Cria uma nova evidência
   */
  static createEvidence(
    checklistId: string,
    evidenceKey: string,
    storagePath: string,
    mediaType?: string,
    description?: string
  ): Evidence {
    const evidenceKeyVO = EvidenceKey.create(evidenceKey);
    const storagePathVO = StoragePath.create(storagePath);
    const mediaTypeVO = MediaType.create(mediaType);
    const descriptionVO = Description.create(description);

    return Evidence.createNew(
      checklistId,
      evidenceKeyVO,
      storagePathVO,
      mediaTypeVO,
      descriptionVO
    );
  }
}
