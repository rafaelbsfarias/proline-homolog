import { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { AnomalyRecord, LoadChecklistOptions } from '../types';
import { applyIdFilters } from '../utils/checklistQueries';

const logger = getLogger('repositories:anomaly');

export class AnomalyRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Busca anomalias com part_requests por vehicle_id e inspection_id/quote_id
   */
  async findWithPartRequests(
    vehicle_id: string,
    options: LoadChecklistOptions,
    partner_id?: string
  ): Promise<AnomalyRecord[]> {
    try {
      let query = this.supabase
        .from('vehicle_anomalies')
        .select(
          `
          *,
          part_requests (
            id,
            part_name,
            part_description,
            quantity,
            estimated_price,
            status
          )
        `
        )
        .eq('vehicle_id', vehicle_id)
        .order('created_at', { ascending: true });

      query = applyIdFilters(query, options) as typeof query;

      // Restringir por parceiro quando informado
      if (partner_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query as any).eq('partner_id', partner_id);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('find_with_part_requests_error', { error: error.message });
        throw error;
      }

      return (data as AnomalyRecord[]) || [];
    } catch (error) {
      logger.error('find_with_part_requests_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verifica se existem anomalias para o checklist
   */
  async existsAnomalies(
    vehicle_id: string,
    options: LoadChecklistOptions,
    partner_id?: string
  ): Promise<boolean> {
    try {
      let query = this.supabase
        .from('vehicle_anomalies')
        .select('id', { count: 'exact', head: true })
        .eq('vehicle_id', vehicle_id)
        .eq('status', 'submitted'); // Apenas anomalias submetidas contam

      query = applyIdFilters(query, options) as typeof query;

      // Restringir por parceiro quando informado
      if (partner_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query as any).eq('partner_id', partner_id);
      }

      const { count, error } = await query;

      if (error) {
        logger.error('exists_anomalies_error', { error: error.message });
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      logger.error('exists_anomalies_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
