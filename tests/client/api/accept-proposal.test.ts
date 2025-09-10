import { describe, it, expect, vi } from 'vitest';

// Build a controllable admin mock tailored for the accept-proposal route
function makeAdminForAcceptFlow(ctx: {
  userId: string;
  addressId: string;
  addressLabel: string;
  date: string; // YYYY-MM-DD
}) {
  const calls: any[] = [];

  const vehiclesRows = [
    { id: 'v1', status: 'AGUARDANDO APROVAÇÃO DA COLETA', estimated_arrival_date: ctx.date },
  ];

  const tables: Record<string, any> = {
    vehicles: vehiclesRows,
    addresses: [{ id: ctx.addressId, street: 'Rua A', number: '1', city: 'X' }],
    profiles: [{ id: ctx.userId, role: 'client', full_name: 'Client X' }],
    vehicle_collections: [
      {
        id: 'coll1',
        client_id: ctx.userId,
        collection_address: ctx.addressLabel,
        collection_date: ctx.date,
        status: 'requested',
      },
    ],
  };

  function query(table: string) {
    const state: any = { _table: table, _update: null, _filters: [], _select: null };
    const chain: any = {
      select(sel: string) {
        state._select = sel;
        return this;
      },
      eq(col: string, val: any) {
        state._filters.push({ col, val });
        return this;
      },
      in(_col: string, _vals: any[]) {
        return this;
      },
      not() {
        return this;
      },
      order() {
        return this;
      },
      single: async () => ({ data: tables[state._table]?.[0] || null }),
      maybeSingle: async () => ({ data: tables[state._table]?.[0] || null }),
      update: (obj: any) => {
        state._update = obj;
        calls.push({ op: 'update', table, where: state._filters.slice(), obj });
        const updChain: any = {};
        updChain.eq = (_c: string, _v: any) => updChain;
        updChain.in = (_c: string, _vals: any[]) => updChain;
        updChain.maybeSingle = async () => ({ data: null });
        updChain.then = (onFulfilled: any) => Promise.resolve(onFulfilled({ error: null }));
        return updChain;
      },
      delete: () => ({ eq: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
      insert: async () => ({ error: null }),
      // Terminal await to fetch rows after filters (very basic: returns table array)
      then: undefined,
      [Symbol.asyncIterator]: undefined,
    };

    // Make awaiting this chain resolve to { data }
    (chain as any).then = (onFulfilled: any) => {
      const data = tables[table] || [];
      return Promise.resolve(onFulfilled({ data }));
    };
    return chain;
  }

  const admin = {
    auth: {
      getUser: async (_token: string) => ({
        data: { user: { id: ctx.userId, email: 'c@x.com', user_metadata: { role: 'client' } } },
        error: null,
      }),
    },
    from: (table: string) => query(table),
  } as any;

  return { admin, calls };
}

vi.mock('@/modules/common/services/SupabaseService', () => {
  let current: any;
  class MockSupabaseService {
    static getInstance() {
      return new MockSupabaseService();
    }
    getAdminClient() {
      return current;
    }
    getClient() {
      return current;
    }
  }
  return {
    SupabaseService: MockSupabaseService,
    __setAdminClient: (c: any) => {
      current = c;
    },
  };
});

import { SupabaseService as _S, __setAdminClient } from '@/modules/common/services/SupabaseService';
import { POST as acceptProposal } from '@/app/api/client/collection-accept-proposal/route';

describe('client accept proposal API', () => {
  it('links vehicles to collection_id and approves collection on final acceptance', async () => {
    const userId = 'client1';
    const addressId = 'addr1';
    const addressLabel = 'Rua A, 1 - X';
    const date = '2024-08-15';
    const { admin, calls } = makeAdminForAcceptFlow({ userId, addressId, addressLabel, date });
    __setAdminClient(admin);

    const req = new Request('http://localhost/api', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ addressId }),
    }) as any;

    const res = await acceptProposal(req);
    expect(res.status).toBe(200);

    // Ensure vehicles were linked to the found collection id before approving
    const linkCall = calls.find(
      c => c.op === 'update' && c.table === 'vehicles' && c.obj && 'collection_id' in c.obj
    );
    expect(linkCall).toBeTruthy();

    const approveCall = calls.find(
      c => c.op === 'update' && c.table === 'vehicle_collections' && c.obj?.status === 'approved'
    );
    expect(approveCall).toBeTruthy();
  });

  it('finalizes in one click when starting from SOLICITAÇÃO DE MUDANÇA DE DATA', async () => {
    const userId = 'client1';
    const addressId = 'addr1';
    const addressLabel = 'Rua A, 1 - X';
    const date = '2024-08-20';
    // Build context where vehicle starts in SOLICITAÇÃO DE MUDANÇA DE DATA
    const { admin, calls } = makeAdminForAcceptFlow({ userId, addressId, addressLabel, date });
    __setAdminClient(admin);

    const req = new Request('http://localhost/api', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ addressId }),
    }) as any;

    const res = await acceptProposal(req);
    expect(res.status).toBe(200);

    const linkCall = calls.find(
      c => c.op === 'update' && c.table === 'vehicles' && c.obj && 'collection_id' in c.obj
    );
    const approveCall = calls.find(
      c => c.op === 'update' && c.table === 'vehicle_collections' && c.obj?.status === 'approved'
    );
    const finalizeVehicles = calls.find(
      c => c.op === 'update' && c.table === 'vehicles' && c.obj?.status === 'AGUARDANDO COLETA'
    );

    expect(linkCall).toBeTruthy();
    expect(approveCall).toBeTruthy();
    expect(finalizeVehicles).toBeTruthy();
  });
});
