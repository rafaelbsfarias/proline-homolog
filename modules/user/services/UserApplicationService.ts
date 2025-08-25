// ========================================================================================
// USER APPLICATION SERVICES - APPLICATION LAYER
// ========================================================================================
// Seguindo Clean Architecture - Cases de Uso e Orquestração
// ========================================================================================

import { UseCase, Result, createSuccess, createError } from '../../common/types/domain';
import { IUserModule, UserAuth, UserInfo } from '../../common/types/interfaces';
import { User, UserRegistrationData, UserStatus } from '../models/User';
import { Password } from '../../common/domain/Password';

/**
 * Interface para repositório de usuários
 * Abstração para camada de infraestrutura
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  findPending(): Promise<User[]>;
}

/**
 * Interface para serviço de hash de senhas
 * Abstração para infraestrutura de segurança
 */
export interface IPasswordHashService {
  hash(password: Password): Promise<string>;
  verify(password: Password, hash: string): Promise<boolean>;
}

/**
 * Interface para serviço de tokens JWT
 * Abstração para infraestrutura de autenticação
 */
export interface ITokenService {
  generateAccessToken(userId: string, role: string): Promise<string>;
  generateRefreshToken(userId: string): Promise<string>;
  verifyToken(token: string): Promise<{ userId: string; role: string } | null>;
}

/**
 * Interface para eventos de domínio
 * Abstração para infraestrutura de eventos
 */
export interface IDomainEventPublisher {
  publish(events: any[]): Promise<void>;
}

// ========================================================================================
// USE CASES - CASOS DE USO
// ========================================================================================

/**
 * Caso de uso: Registrar usuário
 */
export class RegisterUserUseCase implements UseCase<UserRegistrationData, UserInfo> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashService: IPasswordHashService,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(request: UserRegistrationData): Promise<Result<UserInfo>> {
    try {
      // Verificar se usuário já existe
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser) {
        return createError(new Error('Usuário já existe com este email'));
      }

      // Criar usuário
      const user = User.createForRegistration(request);

      // Hash da senha
      const password = Password.create(request.password);
      const passwordHash = await this.passwordHashService.hash(password);

      // Atualizar hash da senha (refletir no domain model)
      const userWithPassword = User.fromPersistence({
        ...user,
        password_hash: passwordHash,
        email: user.email.getValue(),
        role: user.role.getValue(),
        status: user.status,
        profile: user.profile,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        version: user.version,
      });

      // Salvar usuário
      const savedUser = await this.userRepository.save(userWithPassword);

      // Publicar eventos de domínio
      await this.eventPublisher.publish(savedUser.domainEvents);
      savedUser.clearDomainEvents();

      // Converter para DTO de resposta
      const userInfo: UserInfo = {
        id: savedUser.id,
        email: savedUser.email.getValue(),
        role: savedUser.role.getValue(),
        status: savedUser.status,
        profile: savedUser.profile,
        createdAt: savedUser.createdAt,
      };

      return createSuccess(userInfo);
    } catch (error) {
      return createError(new Error(`Erro ao registrar usuário: ${error}`));
    }
  }
}

/**
 * Caso de uso: Autenticar usuário
 */
export class AuthenticateUserUseCase
  implements UseCase<{ email: string; password: string }, UserAuth>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashService: IPasswordHashService,
    private readonly tokenService: ITokenService
  ) {}

  async execute(request: { email: string; password: string }): Promise<Result<UserAuth>> {
    try {
      // Buscar usuário por email
      const user = await this.userRepository.findByEmail(request.email);
      if (!user) {
        return createError(new Error('Usuário não encontrado'));
      }

      // Verificar se pode fazer login
      if (!user.canLogin()) {
        return createError(new Error('Usuário não pode fazer login. Verifique o status da conta.'));
      }

      // Verificar senha
      const password = Password.create(request.password);
      const isValidPassword = await this.passwordHashService.verify(
        password,
        user['_passwordHash'] // Acesso ao campo privado para verificação
      );

      if (!isValidPassword) {
        return createError(new Error('Senha inválida'));
      }

      // Gerar tokens
      const accessToken = await this.tokenService.generateAccessToken(
        user.id,
        user.role.getValue()
      );
      const refreshToken = await this.tokenService.generateRefreshToken(user.id);

      // Resposta
      const userAuth: UserAuth = {
        userId: user.id,
        email: user.email.getValue(),
        role: user.role.getValue(),
        accessToken,
        refreshToken,
      };

      return createSuccess(userAuth);
    } catch (error) {
      return createError(new Error(`Erro na autenticação: ${error}`));
    }
  }
}

/**
 * Caso de uso: Obter usuário atual
 */
export class GetCurrentUserUseCase implements UseCase<string, UserInfo> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<Result<UserInfo>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return createError(new Error('Usuário não encontrado'));
      }

      const userInfo: UserInfo = {
        id: user.id,
        email: user.email.getValue(),
        role: user.role.getValue(),
        status: user.status,
        profile: user.profile,
        createdAt: user.createdAt,
      };

      return createSuccess(userInfo);
    } catch (error) {
      return createError(new Error(`Erro ao buscar usuário: ${error}`));
    }
  }
}

/**
 * Caso de uso: Listar todos os usuários
 */
export class GetAllUsersUseCase implements UseCase<void, UserInfo[]> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<Result<UserInfo[]>> {
    try {
      const users = await this.userRepository.findAll();

      const usersInfo: UserInfo[] = users.map(user => ({
        id: user.id,
        email: user.email.getValue(),
        role: user.role.getValue(),
        status: user.status,
        profile: user.profile,
        createdAt: user.createdAt,
      }));

      return createSuccess(usersInfo);
    } catch (error) {
      return createError(new Error(`Erro ao listar usuários: ${error}`));
    }
  }
}

/**
 * Caso de uso: Aprovar registro de usuário
 */
export class ApproveUserRegistrationUseCase implements UseCase<string, void> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(userId: string): Promise<Result<void>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return createError(new Error('Usuário não encontrado'));
      }

      // Ativar usuário (regra de negócio no domain)
      user.activate();

      // Salvar
      await this.userRepository.save(user);

      // Publicar eventos
      await this.eventPublisher.publish(user.domainEvents);
      user.clearDomainEvents();

      return createSuccess(undefined);
    } catch (error) {
      return createError(new Error(`Erro ao aprovar usuário: ${error}`));
    }
  }
}

// ========================================================================================
// USER MODULE IMPLEMENTATION
// ========================================================================================

/**
 * Implementação do módulo de usuário
 * Facade que expõe os casos de uso
 */
export class UserModule implements IUserModule {
  readonly moduleName = 'user';
  readonly version = '1.0.0';

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly approveUserUseCase: ApproveUserRegistrationUseCase
  ) {}

  async authenticateUser(email: string, password: string): Promise<Result<UserAuth>> {
    return this.authenticateUserUseCase.execute({ email, password });
  }

  async getCurrentUser(userId: string): Promise<Result<UserInfo>> {
    return this.getCurrentUserUseCase.execute(userId);
  }

  async getUserById(id: string): Promise<Result<UserInfo>> {
    return this.getCurrentUserUseCase.execute(id);
  }

  async getAllUsers(): Promise<Result<UserInfo[]>> {
    return this.getAllUsersUseCase.execute();
  }

  async userExists(email: string): Promise<boolean> {
    // Implementar verificação rápida
    return false; // TODO: implementar
  }

  async userHasPermission(userId: string, permission: string): Promise<boolean> {
    const result = await this.getCurrentUser(userId);
    if (!result.success) {
      return false;
    }

    // TODO: Implementar verificação de permissão com o domain model
    return true;
  }

  async userCanAccessRoute(userId: string, route: string): Promise<boolean> {
    const result = await this.getCurrentUser(userId);
    if (!result.success) {
      return false;
    }

    // TODO: Implementar verificação de rota com o domain model
    return true;
  }
}
