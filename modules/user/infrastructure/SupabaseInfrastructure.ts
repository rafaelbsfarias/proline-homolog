// ========================================================================================
// INFRASTRUCTURE LAYER - SUPABASE IMPLEMENTATIONS
// ========================================================================================
// Seguindo Clean Architecture - Infrastructure Layer
// ========================================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  IUserRepository,
  IPasswordHashService,
  ITokenService,
  IDomainEventPublisher,
} from '../services/UserApplicationService';
import { User, UserStatus } from '../models/User';
import { Password } from '../../common/domain/Password';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Implementação do repositório de usuários com Supabase
 */
export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.from('users').select('*').eq('id', id).single();

      if (error || !data) {
        return null;
      }

      return User.fromPersistence(data);
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return null;
      }

      return User.fromPersistence(data);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async save(user: User): Promise<User> {
    try {
      const userData = {
        id: user.id,
        email: user.email.getValue(),
        password_hash: user['_passwordHash'], // Access private field
        role: user.role.getValue(),
        status: user.status,
        profile: user.profile,
        created_at: user.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
        version: user.version + 1,
      };

      const { data, error } = await this.supabase.from('users').upsert(userData).select().single();

      if (error) {
        throw new Error(`Error saving user: ${error.message}`);
      }

      return User.fromPersistence(data);
    } catch (error) {
      throw new Error(`Error saving user: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.from('users').delete().eq('id', id);

      if (error) {
        throw new Error(`Error deleting user: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Error deleting user: ${error}`);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error finding all users: ${error.message}`);
      }

      return data.map(userData => User.fromPersistence(userData));
    } catch (error) {
      throw new Error(`Error finding all users: ${error}`);
    }
  }

  async findPending(): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('status', UserStatus.PENDING)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error finding pending users: ${error.message}`);
      }

      return data.map(userData => User.fromPersistence(userData));
    } catch (error) {
      throw new Error(`Error finding pending users: ${error}`);
    }
  }
}

/**
 * Implementação do serviço de hash de senhas com bcryptjs
 */
export class BcryptPasswordHashService implements IPasswordHashService {
  private readonly saltRounds = 12;

  async hash(password: Password): Promise<string> {
    try {
      return await bcrypt.hash(password.getValue(), this.saltRounds);
    } catch (error) {
      throw new Error(`Error hashing password: ${error}`);
    }
  }

  async verify(password: Password, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password.getValue(), hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }
}

/**
 * Implementação do serviço de tokens JWT
 */
export class JwtTokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
  }

  async generateAccessToken(userId: string, role: string): Promise<string> {
    try {
      return jwt.sign({ userId, role, type: 'access' }, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
      });
    } catch (error) {
      throw new Error(`Error generating access token: ${error}`);
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    try {
      return jwt.sign({ userId, type: 'refresh' }, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
      });
    } catch (error) {
      throw new Error(`Error generating refresh token: ${error}`);
    }
  }

  async verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as any;

      if (decoded.type !== 'access') {
        return null;
      }

      return {
        userId: decoded.userId,
        role: decoded.role,
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }
}

/**
 * Implementação do publisher de eventos de domínio
 */
export class DomainEventPublisher implements IDomainEventPublisher {
  private readonly eventHandlers: Map<string, Array<(event: any) => Promise<void>>> = new Map();

  async publish(events: any[]): Promise<void> {
    for (const event of events) {
      const handlers = this.eventHandlers.get(event.eventName) || [];

      // Execute handlers em paralelo
      await Promise.all(
        handlers.map(handler =>
          handler(event).catch(error =>
            console.error(`Error handling event ${event.eventName}:`, error)
          )
        )
      );
    }
  }

  subscribe(eventName: string, handler: (event: any) => Promise<void>): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }

    this.eventHandlers.get(eventName)!.push(handler);
  }

  unsubscribe(eventName: string, handler: (event: any) => Promise<void>): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

/**
 * Factory para criar instâncias dos serviços de infraestrutura
 */
export class InfrastructureFactory {
  private static supabaseClient: SupabaseClient;

  static getSupabaseClient(): SupabaseClient {
    if (!this.supabaseClient) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    }

    return this.supabaseClient;
  }

  static createUserRepository(): IUserRepository {
    return new SupabaseUserRepository(this.getSupabaseClient());
  }

  static createPasswordHashService(): IPasswordHashService {
    return new BcryptPasswordHashService();
  }

  static createTokenService(): ITokenService {
    return new JwtTokenService();
  }

  static createDomainEventPublisher(): IDomainEventPublisher {
    return new DomainEventPublisher();
  }
}
