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

function makeAdminForAccept(ctx: {
  userId: string;
  clientId: string;
  addressId: string;
  addressLabel: string;
  proposedDate: string;
}) {
  const store = {
    profiles: [{ id: ctx.userId, user_role: 'admin', role: 'admin' }],
    addresses: [{ id: ctx.addressId, street: 'Rua X', number: '1', city: 'Y' }],
    vehicle_collections: [
      // Seed an approved fee record for fee selection fallback
      {
        id: 'fee1',
        client_id: ctx.clientId,
        collection_address: ctx.addressLabel,
        collection_date: '2025-09-01',
        collection_fee_per_vehicle: 130,
        status: 'approved',
        updated_at: '2025-08-20',
      },
    ],
    vehicles: [
      {
        id: 'v1',
        client_id: ctx.clientId,
        pickup_address_id: ctx.addressId,
        status: 'APROVAÇÃO NOVA DATA',
        estimated_arrival_date: ctx.proposedDate,
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
      order() {
        return this;
      },
      limit() {
        return this;
      },
      maybeSingle: async () => ({ data: (store[table] || []).find(r => match(r)) || null }),
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
      delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
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
import { POST as acceptAdminRoute } from '@/app/api/(admin)/(collections)/admin/accept-client-proposed-date/route';

describe('admin accept-client-proposed-date (integrated with orchestrator)', () => {
  it('creates requested if missing, links vehicles, sets status, approves collection', async () => {
    const ctx = {
      userId: 'u1',
      clientId: 'c1',
      addressId: 'a1',
      addressLabel: 'Rua X, 1 - Y',
      proposedDate: '2025-09-20',
    };
    const admin = makeAdminForAccept(ctx);
    __setAdminClient(admin);

    const req = new Request('http://localhost/api', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ clientId: ctx.clientId, addressId: ctx.addressId }),
    }) as any;

    const res = await acceptAdminRoute(req);
    expect(res.status).toBe(200);

    const created = admin.__store.vehicle_collections.find(
      (c: any) => c.collection_date === ctx.proposedDate
    );
    expect(created?.status).toBe('approved');
    const veh = admin.__store.vehicles.find((v: any) => v.id === 'v1');
    expect(veh.collection_id).toBe(created.id);
    expect(veh.status).toBe('AGUARDANDO COLETA');
  });
});
