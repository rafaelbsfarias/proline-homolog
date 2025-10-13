import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/modules/common/constants/database';
import { getLogger } from '@/modules/logger';
import { EvidenceRecord, LoadChecklistOptions } from '../types';
import { applyIdFilters } from '../utils/checklistQueries';

const logger = getLogger('repositories:evidence');

export class EvidenceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Busca evidências por inspection_id/quote_id
   */
  async findByChecklist(options: LoadChecklistOptions): Promise<EvidenceRecord[]> {
    try {
      let query = this.supabase
        .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
        .select('item_key, storage_path');

      query = applyIdFilters(query, options) as typeof query;

      const { data, error } = await query;

      if (error) {
        logger.error('find_by_checklist_error', { error: error.message });
        throw error;
      }

      return (data as EvidenceRecord[]) || [];
    } catch (error) {
      logger.error('find_by_checklist_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
