import type { HistoryRow } from '../types';
import { CollectionHistoryService } from '@/modules/common/services/CollectionHistoryService';
import { getLogger } from '@/modules/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = getLogger('CollectionHistoryLoader');
const collectionHistoryService = CollectionHistoryService.getInstance();

export async function loadHistory(admin: SupabaseClient, clientId: string): Promise<HistoryRow[]> {
  try {
    // First try to get immutable history records
    const immutableHistory = await collectionHistoryService.getClientHistory(clientId);

    if (immutableHistory.length > 0) {
      // Convert immutable history records to HistoryRow format
      return immutableHistory.map(record => ({
        collection_address: record.collection_address,
        collection_fee_per_vehicle: record.collection_fee_per_vehicle,
        collection_date: record.collection_date,
        status: 'approved', // All records in history are finalized
        vehicles: [], // Will be enriched separately
      }));
    }
  } catch (error) {
    // Log error but continue with fallback
    logger.warn('Failed to load immutable history, falling back to operational data', {
      error,
      clientId,
    });
  }

  // Fallback to operational data for backward compatibility
  // This should only be used during migration period
  const { data: coll } = await admin
    .from('vehicle_collections')
    .select('collection_address, collection_fee_per_vehicle, collection_date, status')
    .eq('client_id', clientId)
    .eq('status', 'approved') // Only load finalized collections
    .order('collection_date', { ascending: false });

  // Group by address maintaining only the most recent record (simplest for now)
  const byAddress = new Map<
    string,
    {
      collection_address: string;
      collection_fee_per_vehicle: number | null;
      collection_date: string | null;
      status?: string;
    }
  >();

  (coll || []).forEach(
    (r: {
      collection_address?: string;
      collection_fee_per_vehicle?: number;
      collection_date?: string;
      status?: string;
    }) => {
      const addr = String(r.collection_address || '');
      const fee =
        typeof r.collection_fee_per_vehicle === 'number'
          ? Number(r.collection_fee_per_vehicle)
          : null;
      const date = r.collection_date ? String(r.collection_date) : null;
      const prev = byAddress.get(addr);
      if (!prev) {
        byAddress.set(addr, {
          collection_address: addr,
          collection_fee_per_vehicle: fee,
          collection_date: date,
          status: r.status || undefined,
        });
      } else {
        // Choose the most recent date and preserve non-null fee when possible
        const prevDate = prev.collection_date || '';
        const currDate = date || '';
        if (currDate > prevDate) {
          byAddress.set(addr, {
            collection_address: addr,
            collection_fee_per_vehicle: fee ?? prev.collection_fee_per_vehicle ?? null,
            collection_date: date,
            status: r.status || undefined,
          });
        } else if (fee != null && prev.collection_fee_per_vehicle == null) {
          // Update fee if current has fee and previous didn't
          byAddress.set(addr, { ...prev, collection_fee_per_vehicle: fee });
        }
      }
    }
  );

  const rows: HistoryRow[] = Array.from(byAddress.values()).map(r => ({
    collection_address: r.collection_address,
    collection_fee_per_vehicle: r.collection_fee_per_vehicle,
    collection_date: r.collection_date,
    status: r.status,
  }));

  // Sort descending by date
  rows.sort((a, b) =>
    String(b.collection_date || '').localeCompare(String(a.collection_date || ''))
  );

  return rows;
}
