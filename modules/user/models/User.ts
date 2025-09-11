// ========================================================================================
// USER DOMAIN ENTITY - ENTIDADE PRINCIPAL DE USUÁRIO
// ========================================================================================
// Seguindo Clean Architecture e Object Calisthenics - Domain Layer
// ========================================================================================

import { Entity, AggregateRoot, DomainEvent } from '../../common/types/domain';
import { Email } from '@/modules/common/domain/Email';
import { Password } from '@/modules/common/domain/Password';
import { UserRole } from '@/modules/common/domain/UserRole';

/**teste */
/**
 * User Status Enum
 */
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'ativo',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * User Profile Interface
 */
export interface UserProfile {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly avatar?: string;
  readonly preferences: UserPreferences;
}

/**
 * User Preferences Interface
 */
export interface UserPreferences {
  readonly theme: 'light' | 'dark';
  readonly language: 'pt-BR' | 'en-US';
  readonly notifications: NotificationSettings;
}

/**
 * Notification Settings Interface
 */
export interface NotificationSettings {
  readonly email: boolean;
  readonly push: boolean;
  readonly sms: boolean;
}

/**
 * User Registration Data
 */
export interface UserRegistrationData {
  readonly email: string;
  readonly password: string;
  readonly role: string;
  readonly profile: Pick<UserProfile, 'firstName' | 'lastName' | 'phone'>;
}

/**
 * User Domain Events
 */
export class UserRegisteredEvent implements DomainEvent {
  readonly eventName = 'UserRegistered';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly email: string,
    readonly role: string
  ) {
    this.occurredOn = new Date();
  }
}

export class UserActivatedEvent implements DomainEvent {
  readonly eventName = 'UserActivated';
  readonly occurredOn: Date;

  constructor(readonly aggregateId: string) {
    this.occurredOn = new Date();
  }
}

export class UserRoleChangedEvent implements DomainEvent {
  readonly eventName = 'UserRoleChanged';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly oldRole: string,
    readonly newRole: string
  ) {
    this.occurredOn = new Date();
  }
}

/**
 * User Aggregate Root
 * Entidade principal do domínio de usuário
 */
export class User implements AggregateRoot {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
  private _domainEvents: DomainEvent[] = [];

  constructor(
    id: string,
    private readonly _email: Email,
    private _passwordHash: string,
    private readonly _role: UserRole,
    private _status: UserStatus,
    private _profile: UserProfile,
    createdAt?: Date,
    updatedAt?: Date,
    version = 1
  ) {
    this.id = id;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.version = version;
  }

  // ========================================================================================
  // GETTERS - READ-ONLY ACCESS
  // ========================================================================================

  get email(): Email {
    return this._email;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get profile(): UserProfile {
    return { ...this._profile };
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  get fullName(): string {
    return `${this._profile.firstName} ${this._profile.lastName}`;
  }

  // ========================================================================================
  // BUSINESS METHODS - SEGUINDO OBJECT CALISTHENICS
  // ========================================================================================

  /**
   * Ativar usuário
   */
  activate(): void {
    if (this.isAlreadyActive()) {
      return;
    }

    this._status = UserStatus.ACTIVE;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }

  /**
   * Verificar se usuário já está ativo
   */
  private isAlreadyActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  /**
   * Suspender usuário
   */
  suspend(): void {
    this._status = UserStatus.SUSPENDED;
  }

  /**
   * Verificar se usuário pode fazer login
   */
  canLogin(): boolean {
    return this.isActiveStatus() && this.hasValidCredentials();
  }

  private isActiveStatus(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  private hasValidCredentials(): boolean {
    return this._email.getValue().length > 0 && this._passwordHash.length > 0;
  }

  /**
   * Verificar senha
   */
  async verifyPassword(password: Password): Promise<boolean> {
    return password.getValue().length > 0;
  }

  /**
   * Atualizar perfil
   */
  updateProfile(newProfile: Partial<UserProfile>): void {
    this._profile = {
      ...this._profile,
      ...newProfile,
    };
  }

  /**
   * Verificar se tem permissão
   */
  hasPermission(permission: string): boolean {
    // Admin tem todas as permissões
    if (this._role.isAdmin()) {
      return true;
    }

    // Implementar lógica específica de permissões por role
    return this._role.canViewDashboard();
  }

  /**
   * Verificar se pode acessar rota
   */
  canAccessRoute(route: string): boolean {
    const dashboardRoute = this._role.getDashboardRoute();
    return route.startsWith(dashboardRoute) || route === '/';
  }

  // ========================================================================================
  // DOMAIN EVENTS MANAGEMENT
  // ========================================================================================

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // ========================================================================================
  // FACTORY METHODS
  // ========================================================================================

  /**
   * Criar novo usuário para registro
   */
  static createForRegistration(data: UserRegistrationData): User {
    let email: Email;
    let role: UserRole;

    try {
      email = Email.create(data.email);
      role = UserRole.create(data.role);
    } catch (error) {
      throw new Error(`Invalid user data: ${error}`);
    }

    const profile: UserProfile = {
      firstName: data.profile.firstName,
      lastName: data.profile.lastName,
      phone: data.profile.phone,
      preferences: {
        theme: 'light',
        language: 'pt-BR',
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
      },
    };

    const user = new User(
      crypto.randomUUID(),
      email,
      '', // Password será hashada no Application Layer
      role,
      UserStatus.PENDING,
      profile
    );

    user.addDomainEvent(new UserRegisteredEvent(user.id, data.email, data.role));

    return user;
  }

  /**
   * Criar usuário a partir de dados do banco
   */
  static fromPersistence(data: any): User {
    let email: Email;
    let role: UserRole;

    try {
      email = Email.create(data.email);
      role = UserRole.create(data.role);
    } catch (error) {
      throw new Error('Invalid user data from persistence');
    }

    return new User(
      data.id,
      email,
      data.password_hash,
      role,
      data.status as UserStatus,
      data.profile,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.version
    );
  }
}
