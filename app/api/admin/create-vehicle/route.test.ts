import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createVehicleHandler } from './route';

// Mock do Supabase e dependências
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { id: 'client-1', full_name: 'Cliente Teste', role: 'client' },
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        if (table === 'vehicles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: null, error: null })),
              })),
            })),
            insert: vi.fn(async () => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: 'veh-1',
                    plate: 'ABC1234',
                    brand: 'Fiat',
                    model: 'Uno',
                    color: 'Branco',
                    year: 2020,
                    status: 'ativo',
                    client: {
                      id: 'client-1',
                      full_name: 'Cliente Teste',
                      email: 'cliente@mock.com',
                    },
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        return {};
      }),
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'admin-1' } }, error: null })),
      },
    })),
  };
});

describe('POST /api/admin/create-vehicle', () => {
  it('adiciona veículo para cliente com sucesso (admin)', async () => {
    const req = {
      json: async () => ({
        clientId: 'client-1',
        Plate: 'ABC1234',
        brand: 'Fiat',
        model: 'Uno',
        color: 'Branco',
        year: 2020,
      }),
      headers: {
        get: (key: string) => (key === 'authorization' ? 'Bearer admin-token' : undefined),
      },
    } as unknown as NextRequest;

    const res = await createVehicleHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.vehicle).toMatchObject({
      plate: 'ABC1234',
      brand: 'Fiat',
      model: 'Uno',
      color: 'Branco',
      year: 2020,
      status: 'ativo',
      client: { id: 'client-1', full_name: 'Cliente Teste', email: 'cliente@mock.com' },
    });
    expect(body.message).toBe('Veículo cadastrado com sucesso!');
  });
});
