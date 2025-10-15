/**
 * Serviços da Camada de Aplicação para o Checklist
 * Casos de uso que orquestram as operações do domínio
 */

import type { ContextId } from '../utils/contextNormalizer';
import type {
  ChecklistRepository,
  ChecklistItemRepository,
  EvidenceRepository,
  TimelinePublisher,
  VehicleStatusWriter,
  ChecklistDTO,
  ChecklistItemDTO,
  ChecklistItemStatus,
} from '../interfaces';
import {
  Checklist,
  ChecklistItem,
  Evidence,
  ItemKey,
  EvidenceKey,
  StoragePath,
  Notes,
  MediaType,
  Description,
  ChecklistDomainService,
  ChecklistFactory,
} from '../domain';

// Comando para criar checklist
export interface CreateChecklistCommand {
  vehicleId: string;
  contextId: ContextId;
  partnerId: string;
}

// Comando para adicionar item ao checklist
export interface AddChecklistItemCommand {
  checklistId: string;
  itemKey: string;
  status: string;
  notes?: string;
}

// Comando para adicionar evidência ao checklist
export interface AddChecklistEvidenceCommand {
  checklistId: string;
  evidenceKey: string;
  storagePath: string;
  mediaType?: string;
  description?: string;
}

// Comando para submeter checklist
export interface SubmitChecklistCommand {
  checklistId: string;
}

// Resultado das operações
export interface ChecklistResult {
  success: boolean;
  checklist?: Checklist;
  error?: string;
}

// Serviço de aplicação para checklists
export class ChecklistApplicationService {
  constructor(
    private readonly checklistRepository: ChecklistRepository,
    private readonly checklistItemRepository: ChecklistItemRepository,
    private readonly evidenceRepository: EvidenceRepository,
    private readonly timelinePublisher: TimelinePublisher,
    private readonly vehicleStatusWriter: VehicleStatusWriter
  ) {}

  /**
   * Cria um novo checklist
   */
  async createChecklist(command: CreateChecklistCommand): Promise<ChecklistResult> {
    try {
      // Validação de negócio
      const validation = ChecklistDomainService.canCreateChecklist(
        command.vehicleId,
        command.contextId,
        command.partnerId
      );

      if (!validation.isValid) {
        return { success: false, error: validation.reason };
      }

      // Verifica se já existe um checklist para este contexto
      const existingChecklist = await this.checklistRepository.findByContext(
        command.contextId,
        command.vehicleId
      );

      if (existingChecklist) {
        return { success: false, error: 'Checklist already exists for this context' };
      }

      // Cria o checklist usando o factory
      const checklist = ChecklistFactory.createChecklist(
        command.vehicleId,
        command.contextId,
        command.partnerId
      );

      // Persiste o checklist
      const savedChecklist = await this.checklistRepository.save({
        vehicleId: checklist.vehicleId,
        contextId: checklist.contextId,
        partnerId: checklist.partnerId,
        status: checklist.status,
        createdAt: checklist.createdAt,
        updatedAt: checklist.updatedAt,
      });

      // Reconstrói o objeto de domínio com o ID salvo
      const domainChecklist = Checklist.create(
        savedChecklist.id,
        savedChecklist.vehicleId,
        savedChecklist.contextId,
        savedChecklist.partnerId,
        savedChecklist.status,
        savedChecklist.createdAt,
        savedChecklist.updatedAt
      );

      return { success: true, checklist: domainChecklist };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Adiciona um item ao checklist
   */
  async addChecklistItem(command: AddChecklistItemCommand): Promise<ChecklistResult> {
    try {
      // Busca o checklist
      const checklistDTO = await this.checklistRepository.findById(command.checklistId);
      if (!checklistDTO) {
        return { success: false, error: 'Checklist not found' };
      }

      // Reconstrói o aggregate
      const checklist = await this.reconstructChecklistAggregate(checklistDTO);

      // Validação de negócio
      const itemKeyVO = ItemKey.create(command.itemKey);
      const validation = ChecklistDomainService.canAddItemToChecklist(checklist, itemKeyVO);

      if (!validation.isValid) {
        return { success: false, error: validation.reason };
      }

      // Cria o item
      const item = ChecklistFactory.createChecklistItem(
        command.checklistId,
        command.itemKey,
        command.status as ChecklistItemStatus,
        command.notes
      );

      // Adiciona ao aggregate
      checklist.addItem(item);

      // Persiste o item
      await this.checklistItemRepository.saveMany([
        {
          checklistId: item.checklistId,
          itemKey: item.itemKey.value,
          status: item.status,
          notes: item.notes.value,
          createdAt: item.createdAt,
        },
      ]);

      // Atualiza o checklist
      await this.checklistRepository.updateStatus(checklist.id, checklist.status);

      return { success: true, checklist };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Submete um checklist
   */
  async submitChecklist(command: SubmitChecklistCommand): Promise<ChecklistResult> {
    try {
      // Busca o checklist
      const checklistDTO = await this.checklistRepository.findById(command.checklistId);
      if (!checklistDTO) {
        return { success: false, error: 'Checklist not found' };
      }

      // Reconstrói o aggregate
      const checklist = await this.reconstructChecklistAggregate(checklistDTO);

      // Validação de negócio
      const validation = ChecklistDomainService.canSubmitChecklist(checklist);
      if (!validation.isValid) {
        return { success: false, error: validation.reason };
      }

      // Submete o checklist
      checklist.submit();

      // Atualiza no repositório
      await this.checklistRepository.updateStatus(checklist.id, checklist.status);

      // Publica eventos
      await this.timelinePublisher.publishChecklistSubmitted(
        checklist.id,
        checklist.contextId,
        checklist.vehicleId
      );

      // Atualiza status do veículo se necessário
      const stats = ChecklistDomainService.calculateChecklistStats(checklist);
      if (stats.itemsNeedingAttention > 0) {
        await this.vehicleStatusWriter.updateStatus(checklist.vehicleId, 'needs_attention');
      }

      return { success: true, checklist };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Reconstrói o aggregate Checklist com todos os seus itens e evidências
   */
  private async reconstructChecklistAggregate(checklistDTO: ChecklistDTO): Promise<Checklist> {
    const checklist = Checklist.create(
      checklistDTO.id,
      checklistDTO.vehicleId,
      checklistDTO.contextId,
      checklistDTO.partnerId,
      checklistDTO.status,
      checklistDTO.createdAt,
      checklistDTO.updatedAt
    );

    // Carrega itens
    const itemsDTO = await this.checklistItemRepository.findByChecklistId(checklistDTO.id);
    for (const itemDTO of itemsDTO) {
      const item = ChecklistItem.create(
        itemDTO.id,
        itemDTO.checklistId,
        ItemKey.create(itemDTO.itemKey),
        itemDTO.status,
        Notes.create(itemDTO.notes),
        itemDTO.createdAt
      );
      checklist.addItem(item);
    }

    // Carrega evidências
    const evidencesDTO = await this.evidenceRepository.findByChecklistId(checklistDTO.id);
    for (const evidenceDTO of evidencesDTO) {
      const evidence = Evidence.create(
        evidenceDTO.id,
        evidenceDTO.checklistId,
        EvidenceKey.create(evidenceDTO.evidenceKey),
        StoragePath.create(evidenceDTO.storagePath),
        MediaType.create(evidenceDTO.mediaType),
        Description.create(evidenceDTO.description),
        evidenceDTO.createdAt
      );
      checklist.addEvidence(evidence);
    }

    return checklist;
  }
}
