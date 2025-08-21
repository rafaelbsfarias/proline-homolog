import type { EmailServiceInterface, EmailOptions } from './EmailServiceInterface';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('MailpitEmailService');

/**
 * SMTP Email service targeting a local Mailpit instance during development.
 * Defaults to SMTP_HOST/SMTP_PORT from env. Configure to match your Mailpit setup.
 */
export class MailpitEmailService implements EmailServiceInterface {
  private readonly host: string;
  private readonly port: number;
  private readonly user?: string;
  private readonly pass?: string;
  private readonly fromAddress: string;

  constructor() {
    this.host = process.env.SMTP_HOST || '127.0.0.1';
    this.port = Number(process.env.SMTP_PORT || 1025);
    this.user = process.env.SMTP_USER || undefined;
    this.pass = process.env.SMTP_PASS || undefined;
    this.fromAddress = process.env.SMTP_FROM || 'ProLine Hub <no-reply@proline.local>';

    // No eager import of nodemailer to avoid bundler resolution issues.
  }

  async sendSignupConfirmationEmail(
    email: string,
    fullName: string,
    _companyName: string
  ): Promise<void> {
    const subject = 'ProLine – Confirmação de Solicitação de Cadastro';
    const html = `<p>Olá ${fullName}, recebemos sua solicitação de cadastro.</p>`;
    await this.sendEmail({ to: email, subject, html });
  }

  async sendRegistrationSuccessEmail(recipientEmail: string, recipientName: string): Promise<void> {
    const subject = 'Confirmação de Solicitação de Cadastro - ProLine Hub';
    const html = `<p>Olá ${recipientName}, sua solicitação foi registrada e está em análise.</p>`;
    await this.sendEmail({ to: recipientEmail, subject, html });
  }

  async sendSignupApprovalEmail(email: string, fullName: string): Promise<void> {
    const subject = 'Cadastro Aprovado - ProLine Hub';
    const html = `<p>Olá ${fullName}, seu cadastro foi aprovado!</p>`;
    await this.sendEmail({ to: email, subject, html });
  }

  async sendSignupApprovalWithConfirmationEmail(
    email: string,
    fullName: string,
    confirmationLink: string
  ): Promise<void> {
    const subject = 'Ative sua conta - ProLine Hub';
    const html = `<p>Olá ${fullName}, <a href="${confirmationLink}">clique aqui para ativar sua conta</a>.</p>`;
    await this.sendEmail({ to: email, subject, html });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const subject = 'Redefinição de Senha - ProLine Hub';
    // O resetLink já é a URL completa e correta gerada pelo Supabase.
    const html = `<p>Para redefinir sua senha, <a href="${resetLink}">clique aqui</a>.</p>`;
    await this.sendEmail({ to: email, subject, html });
  }

  async sendWelcomeEmailWithTemporaryPassword(
    recipientEmail: string,
    recipientName: string,
    temporaryPassword: string,
    userRole: string
  ): Promise<void> {
    const subject = 'Bem-vindo ao ProLine Hub';
    const loginLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;
    const html = `<!doctype html><html><body>
      <h2>Olá, ${recipientName}!</h2>
      <p>Sua conta (${userRole}) foi criada. Sua senha temporária:</p>
      <pre>${temporaryPassword}</pre>
      <p>Acesse: <a href="${loginLink}">${loginLink}</a></p>
    </body></html>`;
    await this.sendEmail({ to: recipientEmail, subject, html });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    // Dynamically import nodemailer at runtime on server
    let nm: any;
    try {
      const moduleName = 'nodemailer';

      nm = (await import(moduleName)) as any;
    } catch (_) {
      throw new Error('nodemailer não instalado. Não é possível enviar email via SMTP.');
    }
    const transport = nm.createTransport({
      host: this.host,
      port: this.port,
      secure: false,
      ignoreTLS: true,
      auth: this.user && this.pass ? { user: this.user, pass: this.pass } : undefined,
    });

    const info = await transport.sendMail({
      from: options.from || this.fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info(`Email enfileirado no Mailpit: ${info.messageId}`);
  }
}
