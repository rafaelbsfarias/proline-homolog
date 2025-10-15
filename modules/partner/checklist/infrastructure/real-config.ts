/**
 * Configuração da Infraestrutura Real para Checklist
 * Conecta as implementações reais aos serviços de aplicação
 */

import { SupabaseChecklistRepository } from './real-repositories';
import { SupabaseChecklistItemRepository } from './real-repositories';
import { SupabaseEvidenceRepository } from './real-repositories';
import { SupabaseStorageSigner } from './real-services';
import { SupabaseStorageUploader } from './real-services';
import { SupabaseTimelinePublisher } from './real-services';
import { SupabaseVehicleStatusWriter } from './real-services';

// Instâncias singleton das implementações reais
export const checklistRepository = new SupabaseChecklistRepository();
export const checklistItemRepository = new SupabaseChecklistItemRepository();
export const evidenceRepository = new SupabaseEvidenceRepository();
export const storageSigner = new SupabaseStorageSigner();
export const storageUploader = new SupabaseStorageUploader();
export const timelinePublisher = new SupabaseTimelinePublisher();
export const vehicleStatusWriter = new SupabaseVehicleStatusWriter();

// Configuração completa da infraestrutura
export const realInfrastructure = {
  repositories: {
    checklist: checklistRepository,
    checklistItem: checklistItemRepository,
    evidence: evidenceRepository,
  },
  services: {
    storageSigner,
    storageUploader,
    timelinePublisher,
    vehicleStatusWriter,
  },
} as const;
