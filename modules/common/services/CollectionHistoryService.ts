import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('CollectionHistoryService');

export interface CollectionHistoryRecord {
  id: string;
  client_id: string;
  collection_id: string;
  collection_address: string;
  collection_fee_per_vehicle: number;
  collection_date: string;
  finalized_at: string;
  payment_received: boolean;
  payment_received_at?: string;
  vehicle_count: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionHistoryDetailed extends CollectionHistoryRecord {
  client_name: string;
  client_email: string;
  current_status: string;
  vehicles: Array<{
    plate: string;
    status: string;
    estimated_arrival_date: string;
  }>;
}

export class CollectionHistoryService {
  private static instance: CollectionHistoryService;
  private supabase = SupabaseService.getInstance();

  static getInstance(): CollectionHistoryService {
    if (!CollectionHistoryService.instance) {
      CollectionHistoryService.instance = new CollectionHistoryService();
    }
    return CollectionHistoryService.instance;
  }

  /**
   * Get immutable collection history for a client
   * This returns only finalized, immutable records from collection_history table
   */
  async getClientHistory(clientId: string): Promise<CollectionHistoryRecord[]> {
    try {
      const admin = this.supabase.getAdminClient();

      const { data, error } = await admin
        .from('collection_history')
        .select('*')
        .eq('client_id', clientId)
        .order('collection_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch collection history', { error: error.message, clientId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getClientHistory', { error, clientId });
      throw error;
    }
  }

  /**
   * Get detailed collection history with client and vehicle information
   * This uses the view that aggregates data from multiple tables
   */
  async getClientHistoryDetailed(clientId: string): Promise<CollectionHistoryDetailed[]> {
    try {
      const admin = this.supabase.getAdminClient();

      const { data, error } = await admin
        .from('collection_history_detailed')
        .select('*')
        .eq('client_id', clientId)
        .order('collection_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch detailed collection history', {
          error: error.message,
          clientId,
        });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getClientHistoryDetailed', { error, clientId });
      throw error;
    }
  }

  /**
   * Manually create a history record (for migration purposes)
   * This should only be used during data migration, not in normal operation
   */
  async createHistoryRecord(
    record: Omit<CollectionHistoryRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    try {
      const admin = this.supabase.getAdminClient();

      const { error } = await admin.from('collection_history').insert(record);

      if (error) {
        logger.error('Failed to create history record', { error: error.message, record });
        throw error;
      }

      logger.info('History record created successfully', { collection_id: record.collection_id });
    } catch (error) {
      logger.error('Error in createHistoryRecord', { error, record });
      throw error;
    }
  }

  /**
   * Get history records for a specific date range
   */
  async getHistoryByDateRange(
    clientId: string,
    startDate: string,
    endDate: string
  ): Promise<CollectionHistoryRecord[]> {
    try {
      const admin = this.supabase.getAdminClient();

      const { data, error } = await admin
        .from('collection_history')
        .select('*')
        .eq('client_id', clientId)
        .gte('collection_date', startDate)
        .lte('collection_date', endDate)
        .order('collection_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch history by date range', {
          error: error.message,
          clientId,
          startDate,
          endDate,
        });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getHistoryByDateRange', { error, clientId, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get total amount collected for a client within a date range
   */
  async getTotalCollected(clientId: string, startDate?: string, endDate?: string): Promise<number> {
    try {
      const admin = this.supabase.getAdminClient();

      let query = admin.from('collection_history').select('total_amount').eq('client_id', clientId);

      if (startDate) {
        query = query.gte('collection_date', startDate);
      }

      if (endDate) {
        query = query.lte('collection_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to calculate total collected', {
          error: error.message,
          clientId,
          startDate,
          endDate,
        });
        throw error;
      }

      const total = (data || []).reduce(
        (sum: number, record: { total_amount?: number }) => sum + (record.total_amount || 0),
        0
      );
      return total;
    } catch (error) {
      logger.error('Error in getTotalCollected', { error, clientId, startDate, endDate });
      throw error;
    }
  }
}
