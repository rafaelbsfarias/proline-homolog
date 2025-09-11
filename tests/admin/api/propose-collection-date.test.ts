import { describe, it, expect, vi } from 'vitest';

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

function makeAdminForPropose(ctx: {
  userId: string;
  clientId: string;
  addressId: string;
  addressLabel: string;
}) {
  const store = {
    profiles: [{ id: ctx.userId, user_role: 'admin', role: 'admin' }],
    addresses: [{ id: ctx.addressId, street: 'Rua X', number: '1', city: 'Y' }],
    vehicle_collections: [
      // seed fee lookup
      {
        id: 'prev1',
        client_id: ctx.clientId,
        collection_address: ctx.addressLabel,
        collection_date: '2025-09-10',
        collection_fee_per_vehicle: 120,
        status: 'approved',
        updated_at: '2025-09-01',
      },
    ],
    vehicles: [
      {
        id: 'v1',
        client_id: ctx.clientId,
        pickup_address_id: ctx.addressId,
        status: 'AGUARDANDO APROVAÇÃO DA COLETA',
        estimated_arrival_date: '2025-09-10',
      },
    ],
  } as Record<string, any[]>;

  function query(table: string) {
    let where: any[] = [];
    let pendingUpdate: any | null = null;
    const match = (r: any) =>
      where.every((f: any) =>
        f.type === 'eq'
          ? r[f.col] === f.val
          : f.type === 'in'
            ? f.vals.includes(r[f.col])
            : f.type === 'neq'
              ? r[f.col] !== f.val
              : true
      );
    const chain: any = {
      select() {
        return this;
      },
      eq(col: string, val: any) {
        where.push({ type: 'eq', col, val });
        return this;
      },
      in(col: string, vals: any[]) {
        where.push({ type: 'in', col, vals });
        return this;
      },
      neq(col: string, val: any) {
        where.push({ type: 'neq', col, val });
        return this;
      },
      gt() {
        return this;
      },
      order() {
        return this;
      },
      limit() {
        return this;
      },
      maybeSingle: async () => {
        const data = (store[table] || []).find(r => match(r)) || null;
        return { data };
      },
      upsert: (obj: any) => {
        const idx = (store[table] || []).findIndex(
          r =>
            r.client_id === obj.client_id &&
            r.collection_address === obj.collection_address &&
            r.collection_date === obj.collection_date
        );
        if (idx >= 0) store[table][idx] = { ...store[table][idx], ...obj };
        else store[table].push({ id: `c${store[table].length + 1}`, ...obj });
        const idVal = store[table][idx >= 0 ? idx : store[table].length - 1].id;
        return {
          select: () => ({
            limit: () => ({
              then: (onFulfilled: any) =>
                Promise.resolve(onFulfilled({ data: [{ id: idVal }], error: null })),
            }),
          }),
        } as any;
      },
      delete: () => {
        const del: any = {};
        del.eq = (c: string, v: any) => {
          where.push({ type: 'eq', col: c, val: v });
          return del;
        };
        del.then = (onFulfilled: any) => {
          const remaining = (store[table] || []).filter(
            r => !(where || []).every((f: any) => (f.type === 'eq' ? r[f.col] === f.val : true))
          );
          store[table] = remaining;
          where = [];
          return Promise.resolve(onFulfilled({ error: null }));
        };
        // Allow await pattern without then chaining
        (del as any).eq = del.eq;
        return del;
      },
      update: (obj: any) => {
        pendingUpdate = obj;
        const upd: any = {};
        upd.eq = (c: string, v: any) => {
          where.push({ type: 'eq', col: c, val: v });
          return upd;
        };
        upd.in = (c: string, vals: any[]) => {
          where.push({ type: 'in', col: c, vals });
          return upd;
        };
        upd.then = (onFulfilled: any) => {
          (store[table] || []).forEach(r => {
            if (match(r)) Object.assign(r, pendingUpdate);
          });
          pendingUpdate = null;
          where = [];
          return Promise.resolve(onFulfilled({ error: null }));
        };
        return upd;
      },
    };
    (chain as any).then = (onFulfilled: any) => {
      const data = (store[table] || []).filter(r => match(r));
      const res = { data, error: null };
      where = [];
      return Promise.resolve(onFulfilled(res));
    };
    return chain;
  }

  const admin = {
    auth: {
      getUser: async (_t: string) => ({
        data: { user: { id: ctx.userId, email: 'admin@x.com', user_metadata: { role: 'admin' } } },
        error: null,
      }),
    },
    from: (table: string) => query(table),
    __store: store,
  } as any;

  return admin;
}

import { __setAdminClient } from '@/modules/common/services/SupabaseService';
import { POST as proposeRoute } from '@/app/api/(admin)/(collections)/admin/propose-collection-date/route';

describe('admin propose-collection-date (integrated with orchestrator)', () => {
  it('upserts requested, syncs dates, links vehicles, and removes old requested orphans', async () => {
    const ctx = { userId: 'u1', clientId: 'c1', addressId: 'a1', addressLabel: 'Rua X, 1 - Y' };
    const admin = makeAdminForPropose(ctx);
    // Seed old requested orphan to be cleaned
    admin.__store.vehicle_collections.push({
      id: 'oldReq',
      client_id: ctx.clientId,
      collection_address: ctx.addressLabel,
      collection_date: '2025-09-12',
      status: 'requested',
      collection_fee_per_vehicle: 120,
    });
    __setAdminClient(admin);

    const req = new Request('http://localhost/api', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({
        clientId: ctx.clientId,
        addressId: ctx.addressId,
        new_date: '2025-09-15',
      }),
    }) as any;

    const res = await proposeRoute(req);
    expect(res.status).toBe(200);

    // Verify link after sync
    const linked = admin.__store.vehicles.find((v: any) => v.id === 'v1');
    const newCol = admin.__store.vehicle_collections.find(
      (c: any) => c.collection_date === '2025-09-15'
    );
    expect(newCol?.status).toBe('requested');
    expect(linked.collection_id).toBe(newCol.id);

    // Old requested orphan should be removed
    const orphanStill = admin.__store.vehicle_collections.find((c: any) => c.id === 'oldReq');
    expect(orphanStill).toBeUndefined();
  });
});
