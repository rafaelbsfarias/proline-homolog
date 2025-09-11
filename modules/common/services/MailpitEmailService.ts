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

  async sendTemporaryPasswordForReset(
    recipientEmail: string,
    recipientName: string,
    temporaryPassword: string
  ): Promise<void> {
    const subject = 'Sua nova senha de acesso - ProLine Hub';
    const loginLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#002E4C 100%,#002E4C 100%);padding:30px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">Redefinição de Senha</h1>
          <p style="color:#e8f1ff;margin:10px 0 0 0;">ProLine Hub</p>
        </div>
        <div style="padding:30px;">
          <h2 style="color:#002E4C;margin:0 0 10px 0;">Olá, ${recipientName}!</h2>
          <p style="color:#4a5568;line-height:1.6;margin:0 0 16px 0;">
            Você solicitou uma redefinição de senha. Uma nova senha temporária foi gerada para você.
          </p>
          <div style="background:#fff8e1;border:1px solid #ffe08a;padding:14px;border-radius:8px;margin:18px 0;">
            <p style="color:#7a5b00;margin:0 0 6px 0;font-weight:600;">Sua nova senha temporária</p>
            <code style="display:block;background:#fff3cd;border:1px dashed #ffd56a;padding:10px;border-radius:6px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
              ${temporaryPassword}
            </code>
          </div>
          <p style="color:#4a5568;line-height:1.6;margin:0 0 10px 0;">
            Por favor, faça login e <strong>altere sua senha</strong> assim que possível. Por segurança, você será solicitado a criar uma nova senha no seu primeiro acesso.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${loginLink}"
               style="display:inline-block;background:linear-gradient(135deg,#002E4C 0%,#0044a0 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;font-size:16px;">
              Acessar ProLine Hub
            </a>
          </div>
          <p style="color:#6c757d;margin:16px 0 0 0;font-size:14px;text-align:center;">
            Se você não solicitou esta redefinição, por favor, ignore este email.
          </p>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e9ecef;">
          <p style="color:#6c757d;margin:0;font-size:14px;">
            Atenciosamente,<br />
            <strong style="color:#002E4C;">Equipe ProLine Hub</strong>
          </p>
        </div>
      </div>
    </body>
    </html>`;
    await this.sendEmail({ to: recipientEmail, subject, html });
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
