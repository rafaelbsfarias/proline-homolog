// ========================================================================================
// INTEGRATION TESTS - INFRASTRUCTURE LAYER
// ========================================================================================
// Testes de integração para serviços de infraestrutura
// ========================================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SupabaseUserRepository,
  BcryptPasswordHashService,
  JwtTokenService,
  DomainEventPublisher,
} from '../infrastructure/SupabaseInfrastructure';
import { User, UserRegistrationData } from '../models/User';
import { Password } from '../../../app/value-objects/Password';

// Mock do Supabase
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
};

// Mock dos módulos externos
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password: string, rounds: number) => `hashed_${password}_${rounds}`),
    compare: vi.fn((password: string, hash: string) => hash.startsWith(`hashed_${password}`)),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(
      (payload: any, secret: string, options: any) =>
        `token_${JSON.stringify(payload)}_${secret}_${options.expiresIn}`
    ),
    verify: vi.fn((token: string, secret: string) => {
      if (token.includes('invalid')) throw new Error('Invalid token');
      return { userId: 'user-123', role: 'client', type: 'access' };
    }),
  },
}));

describe('Infrastructure Layer', () => {
  describe('SupabaseUserRepository', () => {
    let repository: SupabaseUserRepository;
    let mockUser: User;

    beforeEach(() => {
      repository = new SupabaseUserRepository(mockSupabaseClient as any);

      const userData: UserRegistrationData = {
        email: 'test@example.com',
        password: 'senha123',
        role: 'client',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockUser = User.createForRegistration(userData);

      // Reset mocks
      vi.clearAllMocks();
    });

    describe('findById', () => {
      it('should find user by id successfully', async () => {
        const userData = {
          id: 'user-123',
          email: 'test@example.com',
          password_hash: 'hashed-password',
          role: 'client',
          status: 'active',
          profile: { firstName: 'Test', lastName: 'User' },
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          version: 1,
        };

        mockSupabaseClient.single.mockResolvedValue({ data: userData, error: null });

        const result = await repository.findById('user-123');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
        expect(result).toBeInstanceOf(User);
        expect(result?.id).toBe('user-123');
      });

      it('should return null when user not found', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        const result = await repository.findById('non-existent');

        expect(result).toBeNull();
      });

      it('should handle database errors gracefully', async () => {
        mockSupabaseClient.single.mockRejectedValue(new Error('Database error'));

        const result = await repository.findById('user-123');

        expect(result).toBeNull();
      });
    });

    describe('findByEmail', () => {
      it('should find user by email successfully', async () => {
        const userData = {
          id: 'user-123',
          email: 'test@example.com',
          password_hash: 'hashed-password',
          role: 'client',
          status: 'active',
          profile: { firstName: 'Test', lastName: 'User' },
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          version: 1,
        };

        mockSupabaseClient.single.mockResolvedValue({ data: userData, error: null });

        const result = await repository.findByEmail('test@example.com');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('email', 'test@example.com');
        expect(result).toBeInstanceOf(User);
        expect(result?.email.getValue()).toBe('test@example.com');
      });
    });

    describe('save', () => {
      it('should save user successfully', async () => {
        const savedData = {
          id: mockUser.id,
          email: 'test@example.com',
          password_hash: 'hashed-password',
          role: 'client',
          status: 'pending',
          profile: mockUser.profile,
          created_at: mockUser.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
          version: 2,
        };

        mockSupabaseClient.single.mockResolvedValue({ data: savedData, error: null });

        const result = await repository.save(mockUser);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.upsert).toHaveBeenCalled();
        expect(result).toBeInstanceOf(User);
      });

      it('should throw error when save fails', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: { message: 'Save failed' },
        });

        await expect(repository.save(mockUser)).rejects.toThrow('Error saving user');
      });
    });

    describe('delete', () => {
      it('should delete user successfully', async () => {
        mockSupabaseClient.delete.mockResolvedValue({ error: null });

        await expect(repository.delete('user-123')).resolves.not.toThrow();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
      });

      it('should throw error when delete fails', async () => {
        mockSupabaseClient.delete.mockResolvedValue({
          error: { message: 'Delete failed' },
        });

        await expect(repository.delete('user-123')).rejects.toThrow('Error deleting user');
      });
    });

    describe('findAll', () => {
      it('should find all users successfully', async () => {
        const usersData = [
          {
            id: 'user-1',
            email: 'user1@example.com',
            password_hash: 'hash1',
            role: 'client',
            status: 'active',
            profile: { firstName: 'User', lastName: 'One' },
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            version: 1,
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            password_hash: 'hash2',
            role: 'admin',
            status: 'active',
            profile: { firstName: 'User', lastName: 'Two' },
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            version: 1,
          },
        ];

        mockSupabaseClient.order.mockResolvedValue({ data: usersData, error: null });

        const result = await repository.findAll();

        expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(User);
        expect(result[1]).toBeInstanceOf(User);
      });
    });
  });

  describe('BcryptPasswordHashService', () => {
    let passwordService: BcryptPasswordHashService;

    beforeEach(() => {
      passwordService = new BcryptPasswordHashService();
    });

    it('should hash password successfully', async () => {
      const password = Password.create('senha123');

      const hash = await passwordService.hash(password);

      expect(hash).toBe('hashed_senha123_12');
    });

    it('should verify password successfully', async () => {
      const password = Password.create('senha123');
      const hash = 'hashed_senha123_12';

      const isValid = await passwordService.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it('should fail verification for wrong password', async () => {
      const password = Password.create('senhaerrada');
      const hash = 'hashed_senha123_12';

      const isValid = await passwordService.verify(password, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JwtTokenService', () => {
    let tokenService: JwtTokenService;

    beforeEach(() => {
      tokenService = new JwtTokenService();

      // Mock environment variables
      process.env.JWT_ACCESS_SECRET = 'access-secret';
      process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    });

    it('should generate access token successfully', async () => {
      const token = await tokenService.generateAccessToken('user-123', 'client');

      expect(token).toContain('token_');
      expect(token).toContain('user-123');
      expect(token).toContain('client');
      expect(token).toContain('access-secret');
    });

    it('should generate refresh token successfully', async () => {
      const token = await tokenService.generateRefreshToken('user-123');

      expect(token).toContain('token_');
      expect(token).toContain('user-123');
      expect(token).toContain('refresh-secret');
    });

    it('should verify valid token successfully', async () => {
      const token = 'valid-token';

      const result = await tokenService.verifyToken(token);

      expect(result).toEqual({
        userId: 'user-123',
        role: 'client',
      });
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid-token';

      const result = await tokenService.verifyToken(token);

      expect(result).toBeNull();
    });

    it('should return null for non-access token', async () => {
      // Mock do jwt.verify para retornar um token que não é de acesso
      const jwt = await import('jsonwebtoken');
      vi.mocked(jwt.default.verify).mockReturnValueOnce({
        userId: 'user-123',
        type: 'refresh',
      } as any);

      const token = 'refresh-token';

      const result = await tokenService.verifyToken(token);

      expect(result).toBeNull();
    });
  });

  describe('DomainEventPublisher', () => {
    let eventPublisher: DomainEventPublisher;

    beforeEach(() => {
      eventPublisher = new DomainEventPublisher();
    });

    it('should publish events to subscribed handlers', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      eventPublisher.subscribe('UserRegistered', handler1);
      eventPublisher.subscribe('UserRegistered', handler2);

      const event = {
        eventName: 'UserRegistered',
        userId: 'user-123',
        timestamp: new Date(),
      };

      await eventPublisher.publish([event]);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should handle errors in event handlers gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = vi.fn().mockResolvedValue(undefined);

      eventPublisher.subscribe('UserRegistered', errorHandler);
      eventPublisher.subscribe('UserRegistered', successHandler);

      const event = {
        eventName: 'UserRegistered',
        userId: 'user-123',
      };

      await eventPublisher.publish([event]);

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error handling event UserRegistered'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should unsubscribe handlers correctly', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);

      eventPublisher.subscribe('UserRegistered', handler);
      eventPublisher.unsubscribe('UserRegistered', handler);

      const event = {
        eventName: 'UserRegistered',
        userId: 'user-123',
      };

      await eventPublisher.publish([event]);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle events with no subscribed handlers', async () => {
      const event = {
        eventName: 'UnsubscribedEvent',
        userId: 'user-123',
      };

      await expect(eventPublisher.publish([event])).resolves.not.toThrow();
    });
  });
});
