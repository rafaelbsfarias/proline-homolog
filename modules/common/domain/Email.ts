/**
 * Value Object para Email
 * Implementa o padrão Value Object dos Object Calisthenics
 * Encapsula validação e comportamentos relacionados ao email
 */

export class Email {
  private readonly value: string;

  constructor(email: string) {
    this.value = this.sanitize(email);
    this.validate();
  }

  private sanitize(email: string): string {
    return email.trim().toLowerCase();
  }

  private validate(): void {
    if (!this.value) {
      throw new Error('Email é obrigatório');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new Error('Email inválido');
    }

    if (this.value.length > 254) {
      throw new Error('Email não pode ter mais de 254 caracteres');
    }
  }

  public getValue(): string {
    return this.value;
  }

  public getDomain(): string {
    return this.value.split('@')[1];
  }

  public getLocalPart(): string {
    return this.value.split('@')[0];
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * Factory method para criação segura
   */
  public static create(email: string): Email {
    return new Email(email);
  }

  /**
   * Factory method que retorna null em caso de erro
   */
  public static createSafe(email: string): Email | null {
    try {
      return new Email(email);
    } catch {
      return null;
    }
  }
}
