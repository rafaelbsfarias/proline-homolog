/**
 * Ports/Interfaces para o domínio Checklist
 * Define contratos que o domínio usa, implementados pela infraestrutura
 */

import type { ContextId } from '../utils/contextNormalizer';

// Tipos base
export type ChecklistStatus = 'draft' | 'submitted';

export type ChecklistItemStatus = 'ok' | 'needs_repair' | 'needs_replacement' | 'not_applicable';

// DTOs para comunicação com domínio
export interface ChecklistDTO {
  id: string;
  vehicleId: string;
  contextId: ContextId;
  partnerId: string;
  status: ChecklistStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItemDTO {
  id: string;
  checklistId: string;
  itemKey: string;
  status: ChecklistItemStatus;
  notes?: string;
  createdAt: Date;
}

export interface EvidenceDTO {
  id: string;
  checklistId: string;
  evidenceKey: string;
  storagePath: string;
  mediaType?: string;
  description?: string;
  createdAt: Date;
}

// Ports para repositórios
export interface ChecklistRepository {
  findById(id: string): Promise<ChecklistDTO | null>;
  findByContext(contextId: ContextId, vehicleId: string): Promise<ChecklistDTO | null>;
  save(checklist: Omit<ChecklistDTO, 'id'>): Promise<ChecklistDTO>;
  updateStatus(id: string, status: ChecklistStatus): Promise<void>;
}

export interface ChecklistItemRepository {
  findByChecklistId(checklistId: string): Promise<ChecklistItemDTO[]>;
  saveMany(items: Omit<ChecklistItemDTO, 'id'>[]): Promise<ChecklistItemDTO[]>;
  deleteByChecklistId(checklistId: string): Promise<void>;
}

export interface EvidenceRepository {
  findByChecklistId(checklistId: string): Promise<EvidenceDTO[]>;
  saveMany(evidences: Omit<EvidenceDTO, 'id' | 'createdAt'>[]): Promise<EvidenceDTO[]>;
  deleteByChecklistId(checklistId: string): Promise<void>;
}

// Ports para serviços de infraestrutura
export interface StorageSigner {
  signPaths(paths: string[]): Promise<Record<string, string>>;
  signPath(path: string): Promise<string>;
}

export interface StorageUploader {
  upload(file: File, path: string): Promise<string>; // retorna storage_path
}

export interface TimelinePublisher {
  publishChecklistSubmitted(
    checklistId: string,
    contextId: ContextId,
    vehicleId: string
  ): Promise<void>;
}

export interface VehicleStatusWriter {
  updateStatus(vehicleId: string, status: string): Promise<void>;
}
