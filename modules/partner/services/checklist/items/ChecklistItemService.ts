import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/modules/common/constants/database';
import { getLogger } from '@/modules/logger';
import { LoadChecklistOptions } from '../types';
import { applyIdFilters } from '../utils/checklistQueries';

const logger = getLogger('services:checklist-items');

/* eslint-disable @typescript-eslint/no-explicit-any */
export class ChecklistItemService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Salva itens individuais do checklist
   */
  async saveItems(
    inspection_id: string,
    vehicle_id: string,
    items: Array<Record<string, any>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST_ITEMS)
        .upsert(items, { onConflict: 'inspection_id,item_key' });

      if (error) {
        logger.error('save_checklist_items_error', { error: error.message });
        return { success: false, error: 'Erro ao salvar itens do checklist' };
      }

      logger.info('save_checklist_items_success', {
        count: items.length,
        inspection_id: inspection_id.slice(0, 8),
        vehicle_id: vehicle_id.slice(0, 8),
      });

      return { success: true };
    } catch (error) {
      logger.error('save_checklist_items_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: 'Erro inesperado ao salvar itens' };
    }
  }

  /**
   * Carrega itens do checklist
   */
  async loadItems(options: LoadChecklistOptions): Promise<any[]> {
    try {
      const base = this.supabase
        .from(TABLES.MECHANICS_CHECKLIST_ITEMS)
        .select('item_key, item_status, item_notes, part_request');

      const tryQuery = async (opts: LoadChecklistOptions) => {
        let q = base;
        q = applyIdFilters(q, opts) as typeof q;
        const { data, error } = await q;
        if (error) {
          logger.error('load_items_error', { error: error.message });
          return [] as any[];
        }
        return (data as any[]) || [];
      };

      // Prefer quote_id, fallback to inspection_id if empty and both provided
      let data: any[] = [];
      if (options.quote_id) {
        data = await tryQuery({ quote_id: options.quote_id });
        if (data.length === 0 && options.inspection_id) {
          data = await tryQuery({ inspection_id: options.inspection_id });
        }
      } else if (options.inspection_id) {
        data = await tryQuery({ inspection_id: options.inspection_id });
      }

      // Nota: Itens não possuem partner_id neste schema.
      // O escopo por parceiro já foi garantido ao selecionar o checklist do parceiro.

      logger.info('load_items_success', {
        count: data?.length || 0,
        with_part_requests: data?.filter(item => item.part_request).length || 0,
      });

      return data || [];
    } catch (error) {
      logger.error('load_items_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
