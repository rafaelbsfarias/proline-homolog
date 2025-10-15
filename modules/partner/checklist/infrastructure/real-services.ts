/**
 * Serviços de Infraestrutura Reais para Checklist
 * Implementações concretas dos serviços de infraestrutura
 */

import { createClient } from '@/lib/supabase/server';
import type { ContextId } from '../utils/contextNormalizer';
import type {
  StorageSigner,
  StorageUploader,
  TimelinePublisher,
  VehicleStatusWriter,
} from '../interfaces';

/**
 * Implementação Real do StorageSigner usando Supabase Storage
 */
export class SupabaseStorageSigner implements StorageSigner {
  async signPaths(paths: string[]): Promise<Record<string, string>> {
    const supabase = await createClient();
    const signedUrls: Record<string, string> = {};

    for (const path of paths) {
      const { data, error } = await supabase.storage
        .from('checklist-evidences')
        .createSignedUrl(path, 3600);

      if (error) throw error;

      signedUrls[path] = data.signedUrl;
    }

    return signedUrls;
  }

  async signPath(path: string): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from('checklist-evidences')
      .createSignedUrl(path, 3600);

    if (error) throw error;

    return data.signedUrl;
  }
}

/**
 * Implementação Real do StorageUploader usando Supabase Storage
 */
export class SupabaseStorageUploader implements StorageUploader {
  async upload(file: File, path: string): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage.from('checklist-evidences').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw error;

    return data.path;
  }
}

/**
 * Implementação Real do TimelinePublisher usando Supabase
 */
export class SupabaseTimelinePublisher implements TimelinePublisher {
  async publishChecklistSubmitted(
    checklistId: string,
    contextId: ContextId,
    vehicleId: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.from('timeline_events').insert({
      entity_id: checklistId,
      entity_type: 'checklist',
      action: 'submitted',
      metadata: {
        context_type: contextId.type,
        context_id: contextId.id,
        vehicle_id: vehicleId,
      },
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  }
}

/**
 * Implementação Real do VehicleStatusWriter usando Supabase
 */
export class SupabaseVehicleStatusWriter implements VehicleStatusWriter {
  async updateStatus(vehicleId: string, status: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('vehicles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId);

    if (error) throw error;
  }
}
