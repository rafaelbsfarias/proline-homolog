import { describe, it, expect, vi } from 'vitest';
import { createUserHandler } from './route';
import { NextRequest } from 'next/server';

// Mock do Supabase
vi.mock('@/modules/common/services/SupabaseService', () => {
  const mockSupabaseClient = {
    auth: {
      admin: {
        inviteUserByEmail: vi.fn(async () => ({
          data: { user: { id: 'mock-user-id' } },
          error: null,
        })),
      },
    },
    from: vi.fn(() => ({
      insert: vi.fn(async () => ({ error: null })),
    })),
  };
  return {
    SupabaseService: {
      getInstance: vi.fn(() => ({
        getAdminClient: vi.fn(() => mockSupabaseClient),
      })),
    },
  };
});

describe('Botão Administrador', () => {
  it('cria usuário administrador com sucesso', async () => {
    const req = {
      json: async () => ({
        name: 'Admin Teste',
        email: 'admin@mock.com',
        role: 'admin',
      }),
      headers: new Headers(),
    } as unknown as NextRequest;

    const res = await createUserHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.userId).toBe('mock-user-id');
  });
});
