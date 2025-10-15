/**
 * Implementações da Infraestrutura para Checklist
 * Adaptadores que implementam as interfaces do domínio
 */

import type { ContextId } from '../utils/contextNormalizer';
import type {
  ChecklistRepository,
  ChecklistItemRepository,
  EvidenceRepository,
  ChecklistDTO,
  ChecklistItemDTO,
  EvidenceDTO,
} from '../interfaces';

// Implementação do repositório usando Supabase
export class SupabaseChecklistRepository implements ChecklistRepository {
  // @ts-ignore - Supabase client typing
  constructor(private readonly supabaseClient: any) {}

  async findById(id: string): Promise<ChecklistDTO | null> {
    const { data, error } = await this.supabaseClient
      .from('checklists')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      contextId: data.context_id,
      partnerId: data.partner_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async findByContext(contextId: ContextId, vehicleId: string): Promise<ChecklistDTO | null> {
    const queryParams = contextToQueryParams(contextId);

    let query = this.supabaseClient.from('checklists').select('*').eq('vehicle_id', vehicleId);

    if ('quote_id' in queryParams) {
      query = query.eq('quote_id', queryParams.quote_id);
    } else {
      query = query.eq('inspection_id', queryParams.inspection_id);
    }

    const { data, error } = await query.single();

    if (error || !data) return null;

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      contextId: contextId,
      partnerId: data.partner_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async save(checklist: Omit<ChecklistDTO, 'id'>): Promise<ChecklistDTO> {
    const queryParams = contextToQueryParams(checklist.contextId);

    const insertData = {
      vehicle_id: checklist.vehicleId,
      partner_id: checklist.partnerId,
      status: checklist.status,
      created_at: checklist.createdAt.toISOString(),
      updated_at: checklist.updatedAt.toISOString(),
      ...queryParams,
    };

    const { data, error } = await this.supabaseClient
      .from('checklists')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      contextId: checklist.contextId,
      partnerId: data.partner_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('checklists')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }
}

export class SupabaseChecklistItemRepository implements ChecklistItemRepository {
  // @ts-ignore - Supabase client typing
  constructor(private readonly supabaseClient: any) {}

  async findByChecklistId(checklistId: string): Promise<ChecklistItemDTO[]> {
    const { data, error } = await this.supabaseClient
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', checklistId);

    if (error) return [];

    return data.map((item: any) => ({
      id: item.id,
      checklistId: item.checklist_id,
      itemKey: item.item_key,
      status: item.status,
      notes: item.notes,
      createdAt: new Date(item.created_at),
    }));
  }

  async saveMany(items: Omit<ChecklistItemDTO, 'id'>[]): Promise<ChecklistItemDTO[]> {
    const insertData = items.map(item => ({
      checklist_id: item.checklistId,
      item_key: item.itemKey,
      status: item.status,
      notes: item.notes,
      created_at: item.createdAt.toISOString(),
    }));

    const { data, error } = await this.supabaseClient
      .from('checklist_items')
      .insert(insertData)
      .select();

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      checklistId: item.checklist_id,
      itemKey: item.item_key,
      status: item.status,
      notes: item.notes,
      createdAt: new Date(item.created_at),
    }));
  }

  async deleteByChecklistId(checklistId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('checklist_items')
      .delete()
      .eq('checklist_id', checklistId);

    if (error) throw error;
  }
}

export class SupabaseEvidenceRepository implements EvidenceRepository {
  constructor(private readonly supabaseClient: any) {}

  async findByChecklistId(checklistId: string): Promise<EvidenceDTO[]> {
    const { data, error } = await this.supabaseClient
      .from('checklist_evidences')
      .select('*')
      .eq('checklist_id', checklistId);

    if (error) return [];

    return data.map((evidence: any) => ({
      id: evidence.id,
      checklistId: evidence.checklist_id,
      evidenceKey: evidence.evidence_key,
      storagePath: evidence.storage_path,
      mediaType: evidence.media_type,
      description: evidence.description,
      createdAt: new Date(evidence.created_at),
    }));
  }

  async saveMany(evidences: Omit<EvidenceDTO, 'id'>[]): Promise<EvidenceDTO[]> {
    const insertData = evidences.map(evidence => ({
      checklist_id: evidence.checklistId,
      evidence_key: evidence.evidenceKey,
      storage_path: evidence.storagePath,
      media_type: evidence.mediaType,
      description: evidence.description,
      created_at: evidence.createdAt.toISOString(),
    }));

    const { data, error } = await this.supabaseClient
      .from('checklist_evidences')
      .insert(insertData)
      .select();

    if (error) throw error;

    return data.map((evidence: any) => ({
      id: evidence.id,
      checklistId: evidence.checklist_id,
      evidenceKey: evidence.evidence_key,
      storagePath: evidence.storage_path,
      mediaType: evidence.media_type,
      description: evidence.description,
      createdAt: new Date(evidence.created_at),
    }));
  }

  async deleteByChecklistId(checklistId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('checklist_evidences')
      .delete()
      .eq('checklist_id', checklistId);

    if (error) throw error;
  }
}

// Utilitário para converter ContextId para parâmetros de query
function contextToQueryParams(
  context: ContextId
): { quote_id: string } | { inspection_id: string } {
  if (context.type === 'quote') {
    return { quote_id: context.id };
  } else {
    return { inspection_id: context.id };
  }
}
