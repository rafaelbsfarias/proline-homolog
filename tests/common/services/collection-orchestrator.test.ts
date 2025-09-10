import { describe, it, expect, vi } from 'vitest';
import { CollectionOrchestrator } from '@/modules/common/services/CollectionOrchestrator';
import { STATUS } from '@/modules/common/constants/status';

function makeAdminMock(initial?: Partial<{ vehicles: any[]; vehicle_collections: any[] }>) {
  const store = {
    vehicles: initial?.vehicles || [],
    vehicle_collections: initial?.vehicle_collections || [],
  } as Record<string, any[]>;

  function query(table: string) {
    let where: any[] = [];
    let pendingUpdate: any | null = null;
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
      order() {
        return this;
      },
      limit() {
        return this;
      },
      maybeSingle: async () => {
        const data =
          (store[table] || []).find(r =>
            where.every(f =>
              f.type === 'eq'
                ? r[f.col] === f.val
                : f.type === 'in'
                  ? f.vals.includes(r[f.col])
                  : true
            )
          ) || null;
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
            const match = where.every(f =>
              f.type === 'eq'
                ? r[f.col] === f.val
                : f.type === 'in'
                  ? f.vals.includes(r[f.col])
                  : true
            );
            if (match) Object.assign(r, pendingUpdate);
          });
          pendingUpdate = null;
          where = [];
          return Promise.resolve(onFulfilled({ error: null }));
        };
        return upd;
      },
    };
    // Make awaitable for selects (returns all rows, but our tests only use maybeSingle/updates)
    (chain as any).then = (onFulfilled: any) =>
      Promise.resolve(onFulfilled({ data: store[table], error: null }));
    return chain;
  }

  const admin = {
    from: (table: string) => query(table),
    __store: store,
  } as any;

  return admin;
}

describe('CollectionOrchestrator', () => {
  it('upserts a requested collection and prevents overwriting approved', async () => {
    const admin = makeAdminMock({
      vehicle_collections: [
        {
          id: 'approved1',
          client_id: 'c1',
          collection_address: 'Rua X, 1 - Y',
          collection_date: '2025-09-10',
          collection_fee_per_vehicle: 100,
          status: STATUS.APPROVED,
        },
      ],
    });

    // Trying to upsert existing approved must throw
    await expect(
      CollectionOrchestrator.upsertCollection(admin, {
        clientId: 'c1',
        addressLabel: 'Rua X, 1 - Y',
        dateIso: '2025-09-10',
        feePerVehicle: 120,
      })
    ).rejects.toThrow();

    // Different date should create requested
    const res = await CollectionOrchestrator.upsertCollection(admin, {
      clientId: 'c1',
      addressLabel: 'Rua X, 1 - Y',
      dateIso: '2025-09-11',
      feePerVehicle: 120,
    });
    expect(res.collectionId).toBeTruthy();
    const created = admin.__store.vehicle_collections.find((r: any) => r.id === res.collectionId);
    expect(created.status).toBe(STATUS.REQUESTED);
  });

  it('syncs vehicle dates only for allowed statuses', async () => {
    const admin = makeAdminMock({
      vehicles: [
        {
          id: 'v1',
          client_id: 'c1',
          pickup_address_id: 'a1',
          status: STATUS.AGUARDANDO_APROVACAO,
          estimated_arrival_date: '2025-09-10',
        },
        {
          id: 'v2',
          client_id: 'c1',
          pickup_address_id: 'a1',
          status: 'COLETA APROVADA',
          estimated_arrival_date: '2025-09-10',
        },
      ],
    });

    await CollectionOrchestrator.syncVehicleDates(admin, {
      clientId: 'c1',
      addressId: 'a1',
      newDateIso: '2025-09-12',
    });

    const v1 = admin.__store.vehicles.find((x: any) => x.id === 'v1');
    const v2 = admin.__store.vehicles.find((x: any) => x.id === 'v2');
    expect(v1.estimated_arrival_date).toBe('2025-09-12');
    expect(v2.estimated_arrival_date).toBe('2025-09-10'); // unchanged
  });

  it('links vehicles to a collection by address/date and allowed statuses', async () => {
    const admin = makeAdminMock({
      vehicles: [
        {
          id: 'v1',
          client_id: 'c1',
          pickup_address_id: 'a1',
          status: STATUS.AGUARDANDO_APROVACAO,
          estimated_arrival_date: '2025-09-12',
        },
        {
          id: 'v2',
          client_id: 'c1',
          pickup_address_id: 'a1',
          status: 'COLETA APROVADA',
          estimated_arrival_date: '2025-09-12',
        },
      ],
      vehicle_collections: [
        {
          id: 'req1',
          client_id: 'c1',
          collection_address: 'Rua X, 1 - Y',
          collection_date: '2025-09-12',
          status: STATUS.REQUESTED,
          collection_fee_per_vehicle: 120,
        },
      ],
    });

    await CollectionOrchestrator.linkVehiclesToCollection(admin, {
      clientId: 'c1',
      addressId: 'a1',
      dateIso: '2025-09-12',
      collectionId: 'req1',
    });

    const v1 = admin.__store.vehicles.find((x: any) => x.id === 'v1');
    const v2 = admin.__store.vehicles.find((x: any) => x.id === 'v2');
    expect(v1.collection_id).toBe('req1');
    expect(v2.collection_id).toBeUndefined(); // status not allowed
  });

  it('approves a requested collection', async () => {
    const admin = makeAdminMock({
      vehicle_collections: [
        {
          id: 'req2',
          client_id: 'c1',
          collection_address: 'Rua X, 1 - Y',
          collection_date: '2025-09-15',
          status: STATUS.REQUESTED,
          collection_fee_per_vehicle: 150,
        },
      ],
    });

    await CollectionOrchestrator.approveCollection(admin, 'req2');
    const row = admin.__store.vehicle_collections.find((r: any) => r.id === 'req2');
    expect(row.status).toBe(STATUS.APPROVED);
  });
});
