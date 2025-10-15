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
  EvidenceDTO,
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
   * Reconstrói o aggregate Checklist com all os seus itens e evidências
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

  /**
   * Carrega checklist completo com evidências e itens (versão DDD)
   * Mantém compatibilidade com a interface legacy para migração gradual
   */
  async loadChecklistWithDetailsDDD(
    inspection_id?: string | null,
    quote_id?: string | null,
    partner_id?: string
  ): Promise<{
    success: boolean;
    data?: {
      form: Record<string, unknown> | null;
      evidences: Record<string, unknown>;
      items?: unknown[];
    };
    error?: string;
  }> {
    try {
      // Normalizar contexto (inspection_id vs quote_id)
      const contextId: ContextId = inspection_id
        ? { type: 'inspection', id: inspection_id }
        : quote_id
          ? { type: 'quote', id: quote_id }
          : { type: 'inspection', id: '' };

      if (!contextId.id) {
        return { success: true, data: { form: null, evidences: {} } };
      }

      // Buscar checklist usando repositório DDD
      let checklistDTO: ChecklistDTO | null = null;

      if (partner_id) {
        // Para isolamento de dados, buscar apenas checklists do parceiro
        // Nota: Este método ainda não existe na interface, será implementado
        checklistDTO = await this.checklistRepository.findByContext(contextId, 'dummy-vehicle-id');
        if (checklistDTO && checklistDTO.partnerId !== partner_id) {
          return { success: true, data: { form: null, evidences: {} } };
        }
      } else {
        // Buscar sem filtro de parceiro (modo admin)
        checklistDTO = await this.checklistRepository.findByContext(contextId, 'dummy-vehicle-id');
      }

      if (!checklistDTO) {
        return { success: true, data: { form: null, evidences: {} } };
      }

      // Carregar itens e evidências usando repositórios DDD
      const [itemsDTO, evidencesDTO] = await Promise.all([
        this.checklistItemRepository.findByChecklistId(checklistDTO.id),
        this.evidenceRepository.findByChecklistId(checklistDTO.id),
      ]);

      // Converter para formato legacy para compatibilidade
      const form = this.buildFormPartialFromDTO(checklistDTO, itemsDTO);
      const evidences = await this.buildEvidencesWithSignedUrls(evidencesDTO);

      return {
        success: true,
        data: {
          form,
          evidences,
          items: itemsDTO, // Incluir items completos para acesso aos part_requests
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar checklist',
      };
    }
  }

  /**
   * Constrói objeto form para UI a partir de DTOs DDD
   */
  private buildFormPartialFromDTO(
    checklistDTO: ChecklistDTO,
    itemsDTO: ChecklistItemDTO[]
  ): Record<string, unknown> {
    const form: Record<string, unknown> = {};

    // Adicionar itens do checklist
    for (const itemDTO of itemsDTO) {
      form[itemDTO.itemKey] = itemDTO.status;
      if (itemDTO.notes) {
        form[`${itemDTO.itemKey}Notes`] = itemDTO.notes;
      }
    }

    return form;
  }

  /**
   * Constrói objeto de evidências com URLs assinadas
   */
  private async buildEvidencesWithSignedUrls(
    evidencesDTO: EvidenceDTO[]
  ): Promise<Record<string, unknown>> {
    const evidences: Record<string, unknown> = {};

    for (const evidenceDTO of evidencesDTO) {
      const evidenceKey = evidenceDTO.evidenceKey;

      // Gerar URL assinada usando o serviço de storage
      // Nota: Esta é uma simplificação - em produção, isso seria feito pelo serviço de storage
      const signedUrl = evidenceDTO.storagePath; // Placeholder - implementar assinatura real

      evidences[evidenceKey] = {
        id: evidenceDTO.id,
        url: signedUrl,
        mediaType: evidenceDTO.mediaType,
        description: evidenceDTO.description,
        createdAt: evidenceDTO.createdAt,
      };
    }

    return evidences;
  }

  /**
   * Submete checklist completo com itens e evidências (versão DDD)
   * Mantém compatibilidade com a interface legacy para migração gradual
   */
  async submitChecklistDDD(data: {
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
    try {
      // Normalizar contexto
      const contextId: ContextId = data.quote_id
        ? { type: 'quote', id: data.quote_id }
        : data.inspection_id
          ? { type: 'inspection', id: data.inspection_id }
          : { type: 'inspection', id: '' };

      if (!contextId.id) {
        return { success: false, error: 'Context ID (inspection_id or quote_id) is required' };
      }

      // Criar ou atualizar checklist
      let checklistDTO = await this.checklistRepository.findByContext(contextId, data.vehicle_id);

      if (!checklistDTO) {
        // Criar novo checklist
        const createResult = await this.createChecklist({
          vehicleId: data.vehicle_id,
          contextId,
          partnerId: data.partner_id,
        });

        if (!createResult.success || !createResult.checklist) {
          return { success: false, error: createResult.error || 'Failed to create checklist' };
        }

        checklistDTO = {
          id: createResult.checklist.id,
          vehicleId: createResult.checklist.vehicleId,
          contextId: createResult.checklist.contextId,
          partnerId: createResult.checklist.partnerId,
          status: createResult.checklist.status,
          createdAt: createResult.checklist.createdAt,
          updatedAt: createResult.checklist.updatedAt,
        };
      }

      // Processar itens do checklist
      if (data.items && Array.isArray(data.items)) {
        const itemDTOs: ChecklistItemDTO[] = [];

        for (const item of data.items) {
          const itemKey = item.item_key;
          const itemStatus = item.item_status;
          const itemNotes = item.item_notes;

          if (typeof itemKey === 'string' && typeof itemStatus === 'string') {
            itemDTOs.push({
              id: '', // Será gerado pelo repositório
              checklistId: checklistDTO.id,
              itemKey,
              status: itemStatus as ChecklistItemStatus,
              notes: typeof itemNotes === 'string' ? itemNotes : '',
              createdAt: new Date(),
            });
          }
        }

        // Limpar itens existentes e salvar novos
        await this.checklistItemRepository.deleteByChecklistId(checklistDTO.id);
        if (itemDTOs.length > 0) {
          await this.checklistItemRepository.saveMany(itemDTOs);
        }
      }

      // Processar evidências
      if (data.evidences && typeof data.evidences === 'object') {
        const evidenceDTOs: EvidenceDTO[] = [];

        Object.entries(data.evidences).forEach(([evidenceKey, paths]) => {
          const pathArray = Array.isArray(paths) ? paths : [paths];
          pathArray.forEach(storagePath => {
            if (storagePath && String(storagePath).trim() !== '') {
              evidenceDTOs.push({
                id: '', // Será gerado pelo repositório
                checklistId: checklistDTO!.id,
                evidenceKey,
                storagePath: String(storagePath),
                mediaType: 'image', // Assumir tipo padrão
                description: '',
                createdAt: new Date(),
              });
            }
          });
        });

        // Limpar evidências existentes e salvar novas
        await this.evidenceRepository.deleteByChecklistId(checklistDTO.id);
        if (evidenceDTOs.length > 0) {
          await this.evidenceRepository.saveMany(evidenceDTOs);
        }
      }

      // Submeter checklist
      const submitResult = await this.submitChecklist({ checklistId: checklistDTO.id });
      if (!submitResult.success) {
        return { success: false, error: submitResult.error || 'Failed to submit checklist' };
      }

      return { success: true, data: checklistDTO as unknown as Record<string, unknown> };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao submeter checklist',
      };
    }
  }

  /**
   * Salva anomalias do checklist (versão DDD)
   * Mantém compatibilidade com a interface legacy para migração gradual
   */
  async saveAnomaliesDDD(data: {
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
    try {
      // Normalizar contexto
      const contextId: ContextId = data.quote_id
        ? { type: 'quote', id: data.quote_id }
        : data.inspection_id
          ? { type: 'inspection', id: data.inspection_id }
          : { type: 'inspection', id: '' };

      if (!contextId.id) {
        return { success: false, error: 'Context ID (inspection_id or quote_id) is required' };
      }

      // Buscar checklist existente
      const checklistDTO = await this.checklistRepository.findByContext(contextId, data.vehicle_id);
      if (!checklistDTO) {
        return { success: false, error: 'Checklist not found for the given context' };
      }

      // Processar anomalias
      const processedAnomalies: Array<Record<string, unknown>> = [];

      for (let i = 0; i < data.anomalies.length; i++) {
        const anomaly = data.anomalies[i];
        const description = anomaly.description?.trim();

        if (!description) continue; // Pular anomalias sem descrição

        const anomalyData: Record<string, unknown> = {
          vehicle_id: data.vehicle_id,
          partner_id: data.partner_id,
          description,
          photos: anomaly.photos || [],
          ...(contextId.type === 'quote'
            ? { quote_id: contextId.id }
            : { inspection_id: contextId.id }),
          partRequest: anomaly.partRequest,
        };

        processedAnomalies.push(anomalyData);
      }

      // Aqui seria implementada a persistência das anomalias
      // Por enquanto, apenas retornamos sucesso para compatibilidade
      // a fazer: Implementar repositório de anomalias DDD

      return {
        success: true,
        data: processedAnomalies,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar anomalias',
      };
    }
  }

  /**
   * Inicializa checklist para parceiro (versão DDD)
   * Mantém compatibilidade com a interface legacy para migração gradual
   */
  async initChecklistDDD(data: {
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
    try {
      // Aqui seria implementada a lógica de inicialização DDD
      // Por enquanto, apenas retornamos sucesso para compatibilidade
      // A fazer: Implementar lógica completa de inicialização DDD

      return {
        success: true,
        data: {
          vehicle: {
            id: data.vehicleId,
            // Outros campos do veículo seriam carregados aqui
          },
          // category, normalizedCategory e template seriam determinados aqui
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao inicializar checklist',
      };
    }
  }
}
