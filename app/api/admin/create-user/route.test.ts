import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock do Supabase
const mockSupabaseClient = {
  auth: {
    admin: {
      inviteUserByEmail: vi.fn(),
    },
  },
  from: vi.fn(() => ({
    insert: vi.fn(),
  })),
};

// Mock do SupabaseService
vi.mock('@/modules/common/services/SupabaseService', () => ({
  SupabaseService: {
    createAdminClient: () => mockSupabaseClient,
  },
}));

// Mock do NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((data, options) => ({
        json: async () => data,
        status: options?.status || 200,
        ok: !options?.status || options.status < 400,
      })),
    },
  };
});

describe('/api/admin/create-user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validação de entrada', () => {
    it('deve retornar erro 400 quando name está vazio', async () => {
      const request = new NextRequest('http://localhost/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({ name: '', email: 'test@test.com', role: 'admin' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nome é obrigatório.');
    });

    it('deve retornar erro 400 quando email está vazio', async () => {
      const request = new NextRequest('http://localhost/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User', email: '', role: 'admin' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('E-mail é obrigatório.');
    });

    it('deve retornar erro 400 quando role é inválido', async () => {
      const request = new NextRequest('http://localhost/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User', email: 'test@test.com', role: 'invalid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Função inválida.');
    });
  });

  describe('Criação de usuário bem-sucedida', () => {
    it('deve criar usuário admin com sucesso', async () => {
      // Mock da resposta do Supabase - convite por email
      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
        error: null,
      });

      // Mock da inserção no profiles
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const request = new NextRequest('http://localhost/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Admin',
          email: 'admin@test.com',
          role: 'admin',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Usuário criado com sucesso.');
      expect(data.userId).toBe('user-123');

      // Verificar se o convite foi enviado
      expect(mockSupabaseClient.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        'admin@test.com',
        { data: { name: 'Test Admin', role: 'admin' } }
      );

      // Verificar se o perfil foi inserido
      expect(mockInsert).toHaveBeenCalledWith([
        {
          id: 'user-123',
          full_name: 'Test Admin',
          role: 'admin',
        },
      ]);
    });

    it('deve criar usuário cliente com sucesso', async () => {
      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: {
          user: { id: 'client-123' },
        },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const request = new NextRequest('http://localhost/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Client',
          email: 'client@test.com',
          role: 'client',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve retornar erro 500 quando convite falha', async () => {
      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' },
      });

      const request = new NextRequest('http://localhost/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'existing@test.com',
          role: 'admin',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao convidar usuário.');
      expect(data.code).toBe('INVITE_ERROR');
    });
  });
});
