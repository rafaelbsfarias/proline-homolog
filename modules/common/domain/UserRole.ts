/**
 * Value Object para UserRole
 * Implementa o padrão Value Object dos Object Calisthenics
 * Encapsula validação e comportamentos relacionados aos papéis de usuário
 */

export class UserRole {
  private readonly value: string;

  private static readonly VALID_ROLES = ['admin', 'client', 'partner', 'specialist'] as const;

  constructor(role: string) {
    this.value = role.toLowerCase().trim();
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new Error('Role é obrigatório');
    }

    if (!UserRole.VALID_ROLES.includes(this.value as any)) {
      throw new Error(
        `Role inválido: ${this.value}. Valores aceitos: ${UserRole.VALID_ROLES.join(', ')}`
      );
    }
  }

  public getValue(): string {
    return this.value;
  }

  public isAdmin(): boolean {
    return this.value === 'admin';
  }

  public isClient(): boolean {
    return this.value === 'client';
  }

  public isPartner(): boolean {
    return this.value === 'partner';
  }

  public isSpecialist(): boolean {
    return this.value === 'specialist';
  }

  public canManageUsers(): boolean {
    return this.isAdmin();
  }

  public canViewDashboard(): boolean {
    return UserRole.VALID_ROLES.includes(this.value as any);
  }

  public canAccessAdminArea(): boolean {
    return this.isAdmin();
  }

  public getDashboardRoute(): string {
    switch (this.value) {
      case 'admin':
        return '/dashboard';
      case 'client':
        return '/dashboard';
      case 'partner':
        return '/dashboard';
      case 'specialist':
        return '/dashboard';
      default:
        return '/';
    }
  }

  public getDisplayName(): string {
    switch (this.value) {
      case 'admin':
        return 'Administrador';
      case 'client':
        return 'Cliente';
      case 'partner':
        return 'Parceiro';
      case 'specialist':
        return 'Especialista';
      default:
        return this.value;
    }
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  /**
   * Factory method para criação segura
   */
  public static create(role: string): UserRole {
    return new UserRole(role);
  }

  /**
   * Factory method que retorna null em caso de erro
   */
  public static createSafe(role: string): UserRole | null {
    try {
      return new UserRole(role);
    } catch {
      return null;
    }
  }

  /**
   * Lista todos os roles válidos
   */
  public static getAllRoles(): readonly string[] {
    return UserRole.VALID_ROLES;
  }
}
