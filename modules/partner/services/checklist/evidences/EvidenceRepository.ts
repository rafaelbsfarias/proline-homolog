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
      // Tentar por quote_id; caso vazio e haja inspection_id, tentar fallback
      const base = this.supabase
        .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
        .select('item_key, media_url, inspection_id, quote_id');

      const tryQuery = async (opts: LoadChecklistOptions) => {
        let q = base;
        q = applyIdFilters(q, opts) as typeof q;
        const { data, error } = await q;
        if (error) {
          logger.error('find_by_checklist_error', { error: error.message });
          throw error;
        }
        return (data as EvidenceRecord[]) || [];
      };

      // Preferir quote_id se existir
      if (options.quote_id) {
        const byQuote = await tryQuery({ quote_id: options.quote_id });
        if (byQuote.length > 0 || !options.inspection_id) return byQuote;
        // Fallback
        const byInspection = await tryQuery({ inspection_id: options.inspection_id });
        return byInspection;
      }

      // Sem quote_id, usar inspection_id
      const byInspection = await tryQuery({ inspection_id: options.inspection_id });
      return byInspection;
    } catch (error) {
      logger.error('find_by_checklist_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
