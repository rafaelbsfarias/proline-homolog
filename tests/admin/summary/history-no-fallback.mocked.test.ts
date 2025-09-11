import { describe, it, expect, vi } from 'vitest';

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

// History service returns NO detailed records -> summary must return empty history (no fallback)
vi.mock('@/modules/common/services/CollectionHistoryService', () => ({
  CollectionHistoryService: class {
    static getInstance() {
      return new CollectionHistoryService();
    }
    async getClientHistoryDetailed() {
      return [];
    }
    async getClientHistory() {
      return [];
    }
  },
}));

import { getClientCollectionsSummary } from '@/modules/admin/services/clientCollectionsSummary';

describe('clientCollectionsSummary - no fallback for history', () => {
  it('keeps collectionHistory empty when no detailed snapshot exists', async () => {
    const res = await getClientCollectionsSummary('client1');
    expect(Array.isArray(res.collectionHistory)).toBe(true);
    expect(res.collectionHistory.length).toBe(0);
  });
});
