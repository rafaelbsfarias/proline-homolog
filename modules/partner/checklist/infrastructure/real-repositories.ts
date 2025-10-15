/**
 * Implementações Reais da Infraestrutura para Checklist
 * Substitui os adaptadores da Fase 2 por implementações completas
 */

import { createClient } from '@/lib/supabase/server';
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
import { contextToQueryParams } from '../utils/contextNormalizer';

// Tipos para dados do Supabase
interface SupabaseChecklistRow {
  id: string;
  vehicle_id: string;
  quote_id: string | null;
  inspection_id: string | null;
  partner_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseChecklistItemRow {
  id: string;
  checklist_id: string;
  item_key: string;
  item_status: string;
  item_notes: string | null;
  created_at: string;
}

interface SupabaseEvidenceRow {
  id: string;
  checklist_id: string;
  evidence_key: string;
  storage_path: string;
  media_type: string | null;
  description: string | null;
  created_at: string;
}

/**
 * Implementação Real do ChecklistRepository usando Supabase
 */
export class SupabaseChecklistRepository implements ChecklistRepository {
  async findById(id: string): Promise<ChecklistDTO | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('checklists').select('*').eq('id', id).single();

    if (error || !data) return null;

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      contextId: {
        type: data.quote_id ? 'quote' : 'inspection',
        id: data.quote_id || data.inspection_id,
      },
      partnerId: data.partner_id,
      status: data.status as ChecklistStatus,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async findByContext(contextId: ContextId, vehicleId: string): Promise<ChecklistDTO | null> {
    const supabase = await createClient();
    const queryParams = contextToQueryParams(contextId);

    let query = supabase.from('checklists').select('*').eq('vehicle_id', vehicleId);

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
      contextId,
      partnerId: data.partner_id,
      status: data.status as ChecklistStatus,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async save(checklist: Omit<ChecklistDTO, 'id'>): Promise<ChecklistDTO> {
    const supabase = await createClient();
    const queryParams = contextToQueryParams(checklist.contextId);

    const insertData = {
      vehicle_id: checklist.vehicleId,
      partner_id: checklist.partnerId,
      status: checklist.status,
      created_at: checklist.createdAt.toISOString(),
      updated_at: checklist.updatedAt.toISOString(),
      ...queryParams,
    };

    const { data, error } = await supabase.from('checklists').insert(insertData).select().single();

    if (error) throw error;

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      contextId: checklist.contextId,
      partnerId: data.partner_id,
      status: data.status as ChecklistStatus,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateStatus(id: string, status: ChecklistStatus): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('checklists')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }
}

/**
 * Implementação Real do ChecklistItemRepository usando Supabase
 */
export class SupabaseChecklistItemRepository implements ChecklistItemRepository {
  async findByChecklistId(checklistId: string): Promise<ChecklistItemDTO[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('created_at', { ascending: true });

    if (error) return [];

    return data.map((item: SupabaseChecklistItemRow) => ({
      id: item.id,
      checklistId: item.checklist_id,
      itemKey: item.item_key,
      status: item.item_status as ChecklistItemStatus,
      notes: item.item_notes || undefined,
      createdAt: new Date(item.created_at),
    }));
  }

  async saveMany(items: Omit<ChecklistItemDTO, 'id'>[]): Promise<ChecklistItemDTO[]> {
    const supabase = await createClient();
    const insertData = items.map(item => ({
      checklist_id: item.checklistId,
      item_key: item.itemKey,
      item_status: item.status,
      item_notes: item.notes,
      created_at: item.createdAt.toISOString(),
    }));

    const { data, error } = await supabase.from('checklist_items').insert(insertData).select();

    if (error) throw error;

    return data.map((item: SupabaseChecklistItemRow) => ({
      id: item.id,
      checklistId: item.checklist_id,
      itemKey: item.item_key,
      status: item.item_status as ChecklistItemStatus,
      notes: item.item_notes || undefined,
      createdAt: new Date(item.created_at),
    }));
  }

  async deleteByChecklistId(checklistId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('checklist_id', checklistId);

    if (error) throw error;
  }
}

/**
 * Implementação Real do EvidenceRepository usando Supabase
 */
export class SupabaseEvidenceRepository implements EvidenceRepository {
  async findByChecklistId(checklistId: string): Promise<EvidenceDTO[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('checklist_evidences')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('created_at', { ascending: true });

    if (error) return [];

    return data.map((evidence: SupabaseEvidenceRow) => ({
      id: evidence.id,
      checklistId: evidence.checklist_id,
      evidenceKey: evidence.evidence_key,
      storagePath: evidence.storage_path,
      mediaType: evidence.media_type || undefined,
      description: evidence.description || undefined,
      createdAt: new Date(evidence.created_at),
    }));
  }

  async saveMany(evidences: Omit<EvidenceDTO, 'id'>[]): Promise<EvidenceDTO[]> {
    const supabase = await createClient();
    const insertData = evidences.map(evidence => ({
      checklist_id: evidence.checklistId,
      evidence_key: evidence.evidenceKey,
      storage_path: evidence.storagePath,
      media_type: evidence.mediaType,
      description: evidence.description,
      created_at: evidence.createdAt.toISOString(),
    }));

    const { data, error } = await supabase.from('checklist_evidences').insert(insertData).select();

    if (error) throw error;

    return data.map((evidence: SupabaseEvidenceRow) => ({
      id: evidence.id,
      checklistId: evidence.checklist_id,
      evidenceKey: evidence.evidence_key,
      storagePath: evidence.storage_path,
      mediaType: evidence.media_type || undefined,
      description: evidence.description || undefined,
      createdAt: new Date(evidence.created_at),
    }));
  }

  async deleteByChecklistId(checklistId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('checklist_evidences')
      .delete()
      .eq('checklist_id', checklistId);

    if (error) throw error;
  }
}
