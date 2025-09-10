import { describe, it, expect, vi } from 'vitest';

// Mock heavy builders to avoid DB plumbing
vi.mock('@/modules/admin/services/client-collections/groups/approved', () => ({
  buildApprovedGroups: vi.fn(async () => ({ approvedGroups: [], approvedTotal: 0 })),
}));
vi.mock('@/modules/admin/services/client-collections/groups/pricing', () => ({
  buildPricingRequests: vi.fn(async () => []),
}));
vi.mock('@/modules/admin/services/client-collections/groups/pendingApproval', () => ({
  buildPendingApprovalGroups: vi.fn(async () => ({ approvalGroups: [], approvalTotal: 0 })),
}));
vi.mock('@/modules/admin/services/client-collections/groups/reschedule', () => ({
  buildRescheduleGroups: vi.fn(async () => []),
}));
vi.mock('@/modules/admin/services/client-collections/statusTotals', () => ({
  getStatusTotals: vi.fn(async () => []),
}));

// Mock Supabase service to provide dummy admin client
vi.mock('@/modules/common/services/SupabaseService', () => {
  class MockSupabaseService {
    static getInstance() {
      return new MockSupabaseService();
    }
    getAdminClient() {
      return {
        from() {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            in() {
              return this;
            },
            not() {
              return this;
            },
            order() {
              return this;
            },
            maybeSingle: async () => ({ data: null }),
          };
        },
      } as any;
    }
    getClient() {
      return this.getAdminClient();
    }
  }
  return { SupabaseService: MockSupabaseService };
});

// Mock CollectionHistoryService to return detailed snapshot with vehicles
vi.mock('@/modules/common/services/CollectionHistoryService', () => ({
  CollectionHistoryService: class {
    static getInstance() {
      return new CollectionHistoryService();
    }
    async getClientHistoryDetailed() {
      return [
        {
          id: 'h1',
          client_id: 'client1',
          collection_id: 'c1',
          collection_address: 'Rua A, 1 - X',
          collection_fee_per_vehicle: 100,
          collection_date: '2024-08-01',
          finalized_at: '2024-08-02T00:00:00Z',
          payment_received: false,
          vehicle_count: 1,
          total_amount: 100,
          created_at: '2024-08-02T00:00:00Z',
          updated_at: '2024-08-02T00:00:00Z',
          client_name: 'Client X',
          client_email: 'x@example.com',
          current_status: 'COLETA APROVADA',
          vehicles: [
            {
              plate: 'AAA-0001',
              status: 'AGUARDANDO COLETA',
              estimated_arrival_date: '2024-08-01',
            },
          ],
        },
      ];
    }
    async getClientHistory() {
      return [];
    }
  },
}));

// Now import the function under test after mocks are in place
import { getClientCollectionsSummary } from '@/modules/admin/services/clientCollectionsSummary';

describe('clientCollectionsSummary - uses detailed immutable history', () => {
  it('preserves vehicles/plates from detailed snapshot without enrich()', async () => {
    const res = await getClientCollectionsSummary('client1');
    expect(res.collectionHistory).toHaveLength(1);
    expect(res.collectionHistory[0].vehicles?.map(v => v.plate)).toEqual(['AAA-0001']);
    expect(res.collectionHistory[0].status).toBe('COLETA APROVADA');
  });
});
