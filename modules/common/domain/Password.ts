/**
 * Value Object para Password
 * Implementa o padrão Value Object dos Object Calisthenics
 * Encapsula validação e comportamentos relacionados à senha
 */

export class Password {
  private readonly value: string;

  constructor(password: string) {
    this.value = password;
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new Error('Senha é obrigatória');
    }

    if (this.value.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    if (this.value.length > 128) {
      throw new Error('Senha não pode ter mais de 128 caracteres');
    }
  }

  public getValue(): string {
    return this.value;
  }

  public getLength(): number {
    return this.value.length;
  }

  public hasMinimumLength(): boolean {
    return this.value.length >= 6;
  }

  public hasUpperCase(): boolean {
    return /[A-Z]/.test(this.value);
  }

  public hasLowerCase(): boolean {
    return /[a-z]/.test(this.value);
  }

  public hasNumber(): boolean {
    return /\d/.test(this.value);
  }

  public hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.value);
  }

  public getStrength(): 'weak' | 'medium' | 'strong' {
    let score = 0;

    if (this.hasUpperCase()) score++;
    if (this.hasLowerCase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSpecialChar()) score++;
    if (this.value.length >= 8) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  public toString(): string {
    return '[PASSWORD HIDDEN]';
  }

  public equals(other: Password): boolean {
    return this.value === other.value;
  }

  /**
   * Factory method para criação segura
   */
  public static create(password: string): Password {
    return new Password(password);
  }

  /**
   * Factory method que retorna null em caso de erro
   */
  public static createSafe(password: string): Password | null {
    try {
      return new Password(password);
    } catch {
      return null;
    }
  }
}
