// ========================================================================================
// UNIT TESTS - APPLICATION LAYER
// ========================================================================================
// Testes unitários para casos de uso
// ========================================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RegisterUserUseCase,
  AuthenticateUserUseCase,
  GetCurrentUserUseCase,
  GetAllUsersUseCase,
  ApproveUserRegistrationUseCase,
  IUserRepository,
  IPasswordHashService,
  ITokenService,
  IDomainEventPublisher,
} from '../services/UserApplicationService';
import { User, UserStatus, UserRegistrationData } from '../models/User';
import { Password } from '@/modules/common/domain/Password';

// ========================================================================================
// MOCKS
// ========================================================================================

class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email.getValue() === email) || null;
  }

  async save(user: User): Promise<User> {
    const existingIndex = this.users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findPending(): Promise<User[]> {
    return this.users.filter(u => u.status === UserStatus.PENDING);
  }
}

class MockPasswordHashService implements IPasswordHashService {
  async hash(password: Password): Promise<string> {
    return `hashed_${password.getValue()}`;
  }

  async verify(password: Password, hash: string): Promise<boolean> {
    return hash === `hashed_${password.getValue()}`;
  }
}

class MockTokenService implements ITokenService {
  async generateAccessToken(userId: string, role: string): Promise<string> {
    return `access_token_${userId}_${role}`;
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return `refresh_token_${userId}`;
  }

  async verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
    const parts = token.split('_');
    if (parts[0] === 'access' && parts[1] === 'token') {
      return { userId: parts[2], role: parts[3] };
    }
    return null;
  }
}

class MockDomainEventPublisher implements IDomainEventPublisher {
  public publishedEvents: any[] = [];

  async publish(events: any[]): Promise<void> {
    this.publishedEvents.push(...events);
  }
}

// ========================================================================================
// TESTS
// ========================================================================================

describe('User Application Services', () => {
  let userRepository: MockUserRepository;
  let passwordHashService: MockPasswordHashService;
  let tokenService: MockTokenService;
  let eventPublisher: MockDomainEventPublisher;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    passwordHashService = new MockPasswordHashService();
    tokenService = new MockTokenService();
    eventPublisher = new MockDomainEventPublisher();
  });

  describe('RegisterUserUseCase', () => {
    let registerUseCase: RegisterUserUseCase;

    beforeEach(() => {
      registerUseCase = new RegisterUserUseCase(
        userRepository,
        passwordHashService,
        eventPublisher
      );
    });

    it('should register user successfully', async () => {
      const userData: UserRegistrationData = {
        email: 'test@example.com',
        password: 'senha123',
        role: 'client',
        profile: {
          firstName: 'João',
          lastName: 'Silva',
          phone: '11999999999',
        },
      };

      const result = await registerUseCase.execute(userData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.role).toBe('client');
        expect(result.data.status).toBe(UserStatus.PENDING);
        expect(result.data.profile.firstName).toBe('João');
      }

      // Verificar se o usuário foi salvo
      const savedUser = await userRepository.findByEmail('test@example.com');
      expect(savedUser).toBeDefined();

      // Verificar se eventos foram publicados
      expect(eventPublisher.publishedEvents).toHaveLength(1);
      expect(eventPublisher.publishedEvents[0].eventName).toBe('UserRegistered');
    });

    it('should fail when user already exists', async () => {
      const userData: UserRegistrationData = {
        email: 'existing@example.com',
        password: 'senha123',
        role: 'client',
        profile: {
          firstName: 'Existing',
          lastName: 'User',
        },
      };

      // Criar usuário existente
      const existingUser = User.createForRegistration(userData);
      await userRepository.save(existingUser);

      const result = await registerUseCase.execute(userData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('já existe');
      }
    });

    it('should handle invalid user data', async () => {
      const invalidData: UserRegistrationData = {
        email: 'invalid-email',
        password: 'senha123',
        role: 'client',
        profile: {
          firstName: 'João',
          lastName: 'Silva',
        },
      };

      const result = await registerUseCase.execute(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid user data');
      }
    });
  });

  describe('AuthenticateUserUseCase', () => {
    let authUseCase: AuthenticateUserUseCase;
    let user: User;

    beforeEach(async () => {
      authUseCase = new AuthenticateUserUseCase(userRepository, passwordHashService, tokenService);

      // Criar usuário ativo para teste
      const userData: UserRegistrationData = {
        email: 'auth@example.com',
        password: 'senha123',
        role: 'client',
        profile: {
          firstName: 'Auth',
          lastName: 'User',
        },
      };

      user = User.createForRegistration(userData);
      user.activate();
      await userRepository.save(user);
    });

    it('should authenticate user successfully', async () => {
      const request = {
        email: 'auth@example.com',
        password: 'senha123',
      };

      const result = await authUseCase.execute(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(user.id);
        expect(result.data.email).toBe('auth@example.com');
        expect(result.data.role).toBe('client');
        expect(result.data.accessToken).toBeDefined();
        expect(result.data.refreshToken).toBeDefined();
      }
    });

    it('should fail for non-existent user', async () => {
      const request = {
        email: 'nonexistent@example.com',
        password: 'senha123',
      };

      const result = await authUseCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('não encontrado');
      }
    });

    it('should fail for inactive user', async () => {
      // Criar usuário inativo
      const inactiveData: UserRegistrationData = {
        email: 'inactive@example.com',
        password: 'senha123',
        role: 'client',
        profile: {
          firstName: 'Inactive',
          lastName: 'User',
        },
      };

      const inactiveUser = User.createForRegistration(inactiveData);
      await userRepository.save(inactiveUser);

      const request = {
        email: 'inactive@example.com',
        password: 'senha123',
      };

      const result = await authUseCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('não pode fazer login');
      }
    });

    it('should fail for wrong password', async () => {
      const request = {
        email: 'auth@example.com',
        password: 'senhaerrada',
      };

      const result = await authUseCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Senha inválida');
      }
    });
  });

  describe('GetCurrentUserUseCase', () => {
    let getCurrentUserUseCase: GetCurrentUserUseCase;
    let user: User;

    beforeEach(async () => {
      getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

      const userData: UserRegistrationData = {
        email: 'current@example.com',
        password: 'senha123',
        role: 'admin',
        profile: {
          firstName: 'Current',
          lastName: 'User',
        },
      };

      user = User.createForRegistration(userData);
      await userRepository.save(user);
    });

    it('should get current user successfully', async () => {
      const result = await getCurrentUserUseCase.execute(user.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(user.id);
        expect(result.data.email).toBe('current@example.com');
        expect(result.data.role).toBe('admin');
        expect(result.data.profile.firstName).toBe('Current');
      }
    });

    it('should fail for non-existent user', async () => {
      const result = await getCurrentUserUseCase.execute('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('não encontrado');
      }
    });
  });

  describe('GetAllUsersUseCase', () => {
    let getAllUsersUseCase: GetAllUsersUseCase;

    beforeEach(async () => {
      getAllUsersUseCase = new GetAllUsersUseCase(userRepository);

      // Criar múltiplos usuários
      const users = [
        { email: 'user1@example.com', role: 'client', firstName: 'User', lastName: 'One' },
        { email: 'user2@example.com', role: 'partner', firstName: 'User', lastName: 'Two' },
        { email: 'user3@example.com', role: 'admin', firstName: 'User', lastName: 'Three' },
      ];

      for (const userData of users) {
        const user = User.createForRegistration({
          email: userData.email,
          password: 'senha123',
          role: userData.role,
          profile: {
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
        });
        await userRepository.save(user);
      }
    });

    it('should get all users successfully', async () => {
      const result = await getAllUsersUseCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data.map(u => u.email)).toContain('user1@example.com');
        expect(result.data.map(u => u.email)).toContain('user2@example.com');
        expect(result.data.map(u => u.email)).toContain('user3@example.com');
      }
    });
  });

  describe('ApproveUserRegistrationUseCase', () => {
    let approveUseCase: ApproveUserRegistrationUseCase;
    let pendingUser: User;

    beforeEach(async () => {
      approveUseCase = new ApproveUserRegistrationUseCase(userRepository, eventPublisher);

      const userData: UserRegistrationData = {
        email: 'pending@example.com',
        password: 'senha123',
        role: 'client',
        profile: {
          firstName: 'Pending',
          lastName: 'User',
        },
      };

      pendingUser = User.createForRegistration(userData);
      await userRepository.save(pendingUser);
    });

    it('should approve user registration successfully', async () => {
      const result = await approveUseCase.execute(pendingUser.id);

      expect(result.success).toBe(true);

      // Verificar se o usuário foi ativado
      const updatedUser = await userRepository.findById(pendingUser.id);
      expect(updatedUser?.status).toBe(UserStatus.ACTIVE);

      // Verificar se eventos foram publicados
      expect(eventPublisher.publishedEvents).toHaveLength(1);
      expect(eventPublisher.publishedEvents[0].eventName).toBe('UserActivated');
    });

    it('should fail for non-existent user', async () => {
      const result = await approveUseCase.execute('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('não encontrado');
      }
    });
  });
});
