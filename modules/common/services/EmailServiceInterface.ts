/**
 * Interface para serviços de envio de email
 * Seguindo o princípio da Inversão de Dependência (SOLID)
 */
export interface EmailServiceInterface {
  /**
   * Envia email de confirmação de cadastro
   */
  sendSignupConfirmationEmail(email: string, fullName: string, companyName: string): Promise<void>;

  /**
   * Envia um e-mail formal de confirmação de solicitação de cadastro.
   */
  sendRegistrationSuccessEmail(recipientEmail: string, recipientName: string): Promise<void>;

  /**
   * Envia email de aprovação de cadastro
   */
  sendSignupApprovalEmail(email: string, fullName: string): Promise<void>;

  /**
   * Envia email de aprovação com token de confirmação
   */
  sendSignupApprovalWithConfirmationEmail(
    email: string,
    fullName: string,
    confirmationToken: string
  ): Promise<void>;

  /**
   * Envia email de recuperação de senha
   */
  sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;

  /**
   * Envia email de boas-vindas com senha temporária.
   */
  sendWelcomeEmailWithTemporaryPassword(
    recipientEmail: string,
    recipientName: string,
    temporaryPassword: string,
    userRole: string
  ): Promise<void>;

  /**
   * Envia email genérico
   */
  sendEmail(options: EmailOptions): Promise<void>;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}
