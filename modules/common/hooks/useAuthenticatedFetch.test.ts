import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock do Supabase client
vi.mock('@/modules/common/services/supabaseClient', () => {
  const mockGetSession = vi.fn();
  return {
    supabase: {
      auth: {
        getSession: mockGetSession,
      },
    },
  };
});

// Mock do ErrorHandlerService
vi.mock('@/modules/common/services/ErrorHandlerService', () => ({
  ErrorHandlerService: {
    getInstance: vi.fn(() => ({
      handleError: vi.fn(),
    })),
  },
  ErrorType: {
    AUTHENTICATION: 'AUTHENTICATION',
    NETWORK: 'NETWORK',
    SERVER: 'SERVER',
  },
}));

describe('useAuthenticatedFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve fazer GET básico', async () => {
    // Importar o mock depois da configuração
    const { supabase } = await import('@/modules/common/services/supabaseClient');
    const mockGetSession = vi.mocked(supabase.auth.getSession);

    // Mock de sessão válida
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'valid-token',
        },
      },
      error: null,
    });

    // Mock da resposta do fetch
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const { result } = renderHook(() => useAuthenticatedFetch());

    const response = await result.current.get('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
    });
    expect(response.data).toEqual({ data: 'test' });
    expect(response.ok).toBe(true);
  });
});
