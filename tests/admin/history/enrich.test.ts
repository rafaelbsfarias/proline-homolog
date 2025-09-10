import { describe, it, expect } from 'vitest';
import { enrichHistoryWithVehicleStatus } from '@/modules/admin/services/client-collections/history/enrich';
import type { HistoryRow } from '@/modules/admin/services/client-collections/types';

// Minimal mock of Supabase admin client for our queries
function makeAdminMock(opts: { addresses: any[]; vehicles: any[] }) {
  return {
    from(table: string) {
      const ctx: any = {
        _table: table,
        _select: null,
        select(_sel: string) {
          this._select = _sel;
          return this;
        },
        eq() {
          // In this simplified mock, filters are ignored and we return all rows per table
          if (this._table === 'addresses') return Promise.resolve({ data: opts.addresses });
          if (this._table === 'vehicles') return Promise.resolve({ data: opts.vehicles });
          return Promise.resolve({ data: [] });
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
        maybeSingle() {
          return Promise.resolve({ data: null });
        },
      };
      return ctx;
    },
  } as any;
}

describe('enrichHistoryWithVehicleStatus', () => {
  it('keeps plate under same collection when vehicles.collection_id is set', async () => {
    const admin = makeAdminMock({
      addresses: [{ id: 'addr1', street: 'Rua A', number: '1', city: 'X', profile_id: 'client1' }],
      vehicles: [
        {
          collection_id: 'c1',
          pickup_address_id: 'addr1',
          estimated_arrival_date: '2024-08-01',
          status: 'AGUARDANDO COLETA',
          plate: 'AAA-0001',
          client_id: 'client1',
        },
      ],
    });

    const base: HistoryRow[] = [
      {
        collection_id: 'c1',
        collection_address: 'Rua A, 1 - X',
        collection_fee_per_vehicle: 100,
        collection_date: '2024-08-01',
        status: 'COLETA APROVADA',
      },
    ];

    const out = await enrichHistoryWithVehicleStatus(admin, 'client1', base);
    expect(out).toHaveLength(1);
    expect(out[0].vehicles?.map(v => v.plate)).toEqual(['AAA-0001']);
  });

  it('demonstrates jumping: when vehicles.collection_id is missing and date moved, enrichment assigns plate to the new date row', async () => {
    const admin = makeAdminMock({
      addresses: [{ id: 'addr1', street: 'Rua A', number: '1', city: 'X', profile_id: 'client1' }],
      vehicles: [
        {
          collection_id: null,
          pickup_address_id: 'addr1',
          estimated_arrival_date: '2024-08-15', // moved from 2024-08-01 to 2024-08-15
          status: 'APROVAÇÃO NOVA DATA',
          plate: 'AAA-0001',
          client_id: 'client1',
        },
      ],
    });

    const base: HistoryRow[] = [
      {
        collection_id: 'c1',
        collection_address: 'Rua A, 1 - X',
        collection_fee_per_vehicle: 100,
        collection_date: '2024-08-01',
        status: 'COLETA APROVADA',
      },
      {
        collection_id: 'c2',
        collection_address: 'Rua A, 1 - X',
        collection_fee_per_vehicle: 100,
        collection_date: '2024-08-15',
        status: 'COLETA APROVADA',
      },
    ];

    const out = await enrichHistoryWithVehicleStatus(admin, 'client1', base);
    const r1 = out.find(r => r.collection_date === '2024-08-01');
    const r2 = out.find(r => r.collection_date === '2024-08-15');
    expect(r1?.vehicles || []).toHaveLength(0);
    expect(r2?.vehicles?.map(v => v.plate)).toEqual(['AAA-0001']);
  });

  it('one-plate-per-line formatting: single vehicle produces a single-plate row; multiple can be grouped', async () => {
    const admin = makeAdminMock({
      addresses: [{ id: 'addr1', street: 'Rua A', number: '1', city: 'X', profile_id: 'client1' }],
      vehicles: [
        {
          collection_id: 'c3',
          pickup_address_id: 'addr1',
          estimated_arrival_date: '2024-09-01',
          status: 'AGUARDANDO COLETA',
          plate: 'AAA-0001',
          client_id: 'client1',
        },
        {
          collection_id: 'c3',
          pickup_address_id: 'addr1',
          estimated_arrival_date: '2024-09-01',
          status: 'AGUARDANDO COLETA',
          plate: 'BBB-0002',
          client_id: 'client1',
        },
      ],
    });

    const base: HistoryRow[] = [
      {
        collection_id: 'c3',
        collection_address: 'Rua A, 1 - X',
        collection_fee_per_vehicle: 100,
        collection_date: '2024-09-01',
        status: 'COLETA APROVADA',
      },
    ];

    const out = await enrichHistoryWithVehicleStatus(admin, 'client1', base);
    // Since there are two vehicles sharing same collection/date, we keep them grouped in one row
    expect(out).toHaveLength(1);
    expect(out[0].vehicles?.map(v => v.plate)).toEqual(['AAA-0001', 'BBB-0002']);
  });
});
