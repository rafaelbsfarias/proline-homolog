// ========================================================================================
// UNIT TESTS - DOMAIN LAYER
// ========================================================================================
// Testes unitários para entidades e value objects
// ========================================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { User, UserStatus, UserRegistrationData } from '../models/User';
import { Email } from '../../../app/value-objects/Email';
import { UserRole } from '../../../app/value-objects/UserRole';

describe('User Domain Entity', () => {
  let validUserData: UserRegistrationData;

  beforeEach(() => {
    validUserData = {
      email: 'test@example.com',
      password: 'senha123',
      role: 'client',
      profile: {
        firstName: 'João',
        lastName: 'Silva',
        phone: '11999999999',
      },
    };
  });

  describe('User Creation', () => {
    it('should create user for registration with valid data', () => {
      const user = User.createForRegistration(validUserData);

      expect(user.id).toBeDefined();
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.role.getValue()).toBe('client');
      expect(user.status).toBe(UserStatus.PENDING);
      expect(user.profile.firstName).toBe('João');
      expect(user.profile.lastName).toBe('Silva');
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0].eventName).toBe('UserRegistered');
    });

    it('should throw error for invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      expect(() => User.createForRegistration(invalidData)).toThrow();
    });

    it('should throw error for invalid role', () => {
      const invalidData = { ...validUserData, role: 'invalid-role' };

      expect(() => User.createForRegistration(invalidData)).toThrow();
    });

    it('should create user from persistence data', () => {
      const persistenceData = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'admin',
        status: 'ativo',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          preferences: {
            theme: 'dark',
            language: 'pt-BR',
            notifications: { email: true, push: false, sms: false },
          },
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        version: 1,
      };

      const user = User.fromPersistence(persistenceData);

      expect(user.id).toBe('user-123');
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.role.getValue()).toBe('admin');
      expect(user.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('User Behavior', () => {
    let user: User;

    beforeEach(() => {
      user = User.createForRegistration(validUserData);
    });

    it('should activate user successfully', () => {
      user.activate();

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.domainEvents).toHaveLength(2); // Registration + Activation events
      expect(user.domainEvents[1].eventName).toBe('UserActivated');
    });

    it('should not add activation event if already active', () => {
      user.activate();
      user.clearDomainEvents();
      user.activate(); // Second activation

      expect(user.domainEvents).toHaveLength(0);
    });

    it('should suspend user', () => {
      user.activate();
      user.suspend();

      expect(user.status).toBe(UserStatus.SUSPENDED);
    });

    it('should allow login for active user', () => {
      user.activate();

      expect(user.canLogin()).toBe(true);
    });

    it('should not allow login for pending user', () => {
      expect(user.canLogin()).toBe(false);
    });

    it('should not allow login for suspended user', () => {
      user.activate();
      user.suspend();

      expect(user.canLogin()).toBe(false);
    });

    it('should update profile successfully', () => {
      const newProfile = {
        firstName: 'José',
        lastName: 'Santos',
        phone: '11888888888',
      };

      user.updateProfile(newProfile);

      expect(user.profile.firstName).toBe('José');
      expect(user.profile.lastName).toBe('Santos');
      expect(user.profile.phone).toBe('11888888888');
    });

    it('should return full name correctly', () => {
      expect(user.fullName).toBe('João Silva');
    });

    it('should verify permissions for admin role', () => {
      const adminData = { ...validUserData, role: 'admin' };
      const adminUser = User.createForRegistration(adminData);

      expect(adminUser.hasPermission('any-permission')).toBe(true);
    });

    it('should verify route access correctly', () => {
      expect(user.canAccessRoute('/dashboard')).toBe(true);
      expect(user.canAccessRoute('/')).toBe(true);
    });

    it('should clear domain events', () => {
      user.activate();
      expect(user.domainEvents).toHaveLength(2);

      user.clearDomainEvents();
      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('User Value Objects Integration', () => {
    it('should properly integrate with Email value object', () => {
      const user = User.createForRegistration(validUserData);

      expect(user.email).toBeInstanceOf(Email);
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.email.getDomain()).toBe('example.com');
      expect(user.email.getLocalPart()).toBe('test');
    });

    it('should properly integrate with UserRole value object', () => {
      const user = User.createForRegistration(validUserData);

      expect(user.role).toBeInstanceOf(UserRole);
      expect(user.role.getValue()).toBe('client');
      expect(user.role.isClient()).toBe(true);
      expect(user.role.isAdmin()).toBe(false);
    });
  });

  describe('Domain Events', () => {
    it('should generate UserRegistered event on creation', () => {
      const user = User.createForRegistration(validUserData);
      const registrationEvent = user.domainEvents[0];

      expect(registrationEvent.eventName).toBe('UserRegistered');
      expect(registrationEvent.aggregateId).toBe(user.id);
      expect(registrationEvent.occurredOn).toBeInstanceOf(Date);
    });

    it('should generate UserActivated event on activation', () => {
      const user = User.createForRegistration(validUserData);
      user.activate();

      const activationEvent = user.domainEvents.find(e => e.eventName === 'UserActivated');

      expect(activationEvent).toBeDefined();
      expect(activationEvent?.aggregateId).toBe(user.id);
      expect(activationEvent?.occurredOn).toBeInstanceOf(Date);
    });
  });
});
