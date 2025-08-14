import { ResendEmailService } from './ResendEmailService';
import type { EmailServiceInterface } from './EmailServiceInterface';

/**
 * Factory para criação de serviços de email
 * Seguindo o princípio da Inversão de Dependência (SOLID)
 */
export class EmailServiceFactory {
  private static instance: EmailServiceInterface;

  /**
   * Retorna uma instância singleton do serviço de email
   */
  static getInstance(): EmailServiceInterface {
    if (!this.instance) {
      this.instance = new ResendEmailService();
    }
    return this.instance;
  }
}
