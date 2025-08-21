import { getLogger, ILogger } from '@/modules/logger';
import { EmailServiceInterface, EmailOptions } from './EmailServiceInterface';

const logger: ILogger = getLogger('ResendEmailService');

/**
 * Implementação do serviço de email usando a API do Resend.
 * Esta classe agora usa fetch() para se comunicar diretamente com o Resend,
 * garantindo um envio de e-mail mais robusto e desacoplado de SMTP.
 */
export class ResendEmailService implements EmailServiceInterface {
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromAddress = 'ProLine Hub <naoresponda@serejo.tech>';
  }

  /**
   * Envia o e-mail de "cadastro em análise" após o autocadastro do usuário.
   */
  async sendSignupConfirmationEmail(recipientEmail: string, recipientName: string): Promise<void> {
    const subject = 'ProLine- Cadastro em análise';
    const html = `
      <!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport"   content="width=device-width">
        <meta http-equiv="x-ua-compatible"  content="ie=edge">
        <title>ProLine – Confirmação de Solicitação   de Cadastro</title>
        <style>
            a[x-apple-data-detectors] { color: inherit  !important; text-decoration: none !important; }
          u + #body a { text-decoration: none   !important; }
          @media (max-width: 620px) {
              .container { width: 100% !important; }
              .p-outer { padding: 16px !important; }
              .p-inner { padding: 24px !important; }
            }
          </style>
        </head>
        <body id="body" style="margin:0; padding:0;   background:#f8f9fa; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
        <!-- Preheader -->
          <div style="display:none; max-height:0;   overflow:hidden; opacity:0; mso-hide:all;">
          Sua solicitação de cadastro na ProlineAuto  foi recebida com sucesso.
          </div>
              
          <t  able role="presentation" cellspacing="0"  cellpadding="0" border="0" width="100%" style="background:#f8f9fa;">
          <tr>
              <td class="p-outer" align="center"  style="padding:24px;">
              <table role="presentation"  class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px; max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">

                  <!-- Header -->
                  <tr>
                    <td align="center"  style="background:#072E4C; color:#ffffff; padding:32px 24px;">
                    <img src="https://portal.prolineauto.com.br/assets/images/logo-proline.png"
                         alt="ProLine"
                           style="max-width:180px;  height:auto; display:block; margin:0 auto 12px;" />
                    <div style="font:700 24px/1.3   'Segoe UI', Arial, sans-serif; margin-top:10px;">
                      Confirmação de Solicitação de   Cadastro
                    </div>
                      <div style="font:400 16px/1.5   'Segoe UI', Arial, sans-serif; opacity:.9; margin-top:8px;">
                      Recebemos sua solicitação e   ela está em análise.
                    </div>
                    </td>
                    </tr>
              
                    <!-- Conteúdo -->
                  <tr>
                    <td class="p-inner"   style="padding:40px 30px;">
                    <p style="margin:0 0 16px;  font:400 15px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                      Prezado(a) ${recipientName},
                      </p>
                      <p style="margin:0 0 16px;  font:400 15px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                      Sua solicitação de cadastro na  <strong>ProlineAuto</strong> foi registrada com sucesso e está em fase de avaliação pela nossa equipe.
                    </p>
                      <p style="margin:0 0 16px;  font:400 15px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                      Assim que seu cadastro for  aprovado, você receberá um novo e-mail com as instruções para acesso à plataforma.
                      </p>
              
                        <!-- Aviso -->
                      <table role="presentation"  cellspacing="0" cellpadding="0" border="0" width="100%"
                           style="background:#e8f4fd;  border:1px solid #b6e0fe; border-radius:8px; margin:20px 0 24px;">
                      <tr>
                          <td style="padding:16px   18px; font:400 14px/1.6 'Segoe UI', Arial, sans-serif; color:#084298;">
                          Este processo pode levar  até 48 horas úteis. Caso tenha dúvidas, entre em contato com nosso suporte.
                        </td>
                        </tr>
                        </table>
              
                        <!-- Contato -->
                      <p style="margin:0; font:400  14px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                      Atenciosamente,<br>
                        <strong>Equipe ProlineAuto</  strong>
                    </p>
                    </td>
                    </tr>
              
                    <!-- Rodapé -->
                  <tr>
                    <td align="center"  style="padding:24px 24px 30px; background:#f8f9fa; border-top:1px solid #e9ecef;">
                    <div style="font:700 14px/1   'Segoe UI', Arial, sans-serif; color:#333;">ProlineAuto</div>
                    <div style="font:400 13px/1.6   'Segoe UI', Arial, sans-serif; color:#666;">Gestão Inteligente de Frota Automotiva</div>
                    <div style="font:400 13px/1.6   'Segoe UI', Arial, sans-serif; color:#666; margin-top:12px;">
                      Precisa de ajuda? <a  href="mailto:suporte@prolineauto.com" style="color:#072E4C; text-decoration:none;">Fale conosco</a>
                    </div>
                      <div style="font:400 12px/1.6   'Segoe UI', Arial, sans-serif; color:#999; margin-top:10px;">
                      Este é um e-mail automático,  não responda a esta mensagem.
                    </div>
                    </td>
                    </tr>
              
                  </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
    

    `;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Envia um e-mail formal de confirmação de solicitação de cadastro.
   */
  async sendRegistrationSuccessEmail(recipientEmail: string, recipientName: string): Promise<void> {
    const subject = 'Confirmação de Solicitação de Cadastro - ProLine Hub';
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #002E4C 100%, #002E4C 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: #0057b8; margin: 0 0 10px 0; }
    .content p { color: #4a5568; line-height: 1.6; margin: 0 0 16px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer p { color: #6c757d; margin: 0; font-size: 14px; }
    .footer strong { color: #0057b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirmação de Solicitação de Cadastro</h1>
      <p style="color:#e8f1ff;margin:10px 0 0 0;">ProLine Hub</p>
    </div>

    <div class="content">
      <h2>Prezado(a) ${recipientName},</h2>
      <p>
        Confirmamos o recebimento de sua solicitação de cadastro em nossa plataforma, ProLine Hub.
        Agradecemos o seu interesse.
      </p>
      <p>
        Sua solicitação será analisada por nossa equipe. Você será notificado(a) por e-mail sobre o status de sua aprovação.
      </p>
      <p>
        Este processo pode levar até 48 horas úteis.
      </p>
      <p>
        Atenciosamente,<br />
        Equipe ProLine Hub
      </p>
    </div>

    <div class="footer">
      <p>
        Este é um e-mail automático, por favor, não responda a esta mensagem.
      </p>
    </div>
  </div>
</body>
</html>`;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Envia email de aprovação de cadastro.
   */
  async sendSignupApprovalEmail(recipientEmail: string, recipientName: string): Promise<void> {
    const subject = 'Cadastro Aprovado - ProLine Hub';
    const html = `<p>Olá ${recipientName}, seu cadastro foi aprovado!</p>`;
    await this.sendEmail({ to: recipientEmail, subject, html });
  }

  /**
   * Envia email de aprovação com link de confirmação/ativação.
   */
  async sendSignupApprovalWithConfirmationEmail(
    recipientEmail: string,
    recipientName: string,
    confirmationLink: string
  ): Promise<void> {
    const subject = 'Ative sua conta - ProLine Hub';
    const html = `<p>Olá ${recipientName}, seu cadastro foi aprovado! <a href="${confirmationLink}">Clique aqui para ativar sua conta</a>.</p>`;
    await this.sendEmail({ to: recipientEmail, subject, html });
  }

  /**
   * Envia email de recuperação de senha.
   */
  // async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  //   const subject = 'Redefinição de Senha - ProLine Hub';
  //   const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password#token=${resetToken}`;
  //   const html = `<p>Para redefinir sua senha, <a href="${resetLink}">clique aqui</a>.</p>`;
  //   await this.sendEmail({ to: email, subject, html });
  // }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const subject = 'Redefinição de Senha - ProLine Hub';
    const html = `<p>Para redefinir sua senha, <a href="${resetLink}">clique aqui</a>.</p>`;
    await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Envia email de boas-vindas com senha temporária.
   */
  async sendWelcomeEmailWithTemporaryPassword(
    recipientEmail: string,
    recipientName: string,
    temporaryPassword: string,
    userRole: string,
    subject: string = 'Bem-vindo(a) ao ProLine Hub!',
    templateVariant: 'default' | 'invite' = 'default'
  ): Promise<void> {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
    const loginLink = `${baseUrl || 'https://portal.prolineauto.com.br'}/login`;

    let htmlContent = '';

    if (templateVariant === 'invite' && userRole === 'Parceiro') {
      htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <title>Convite para o ProLine Hub</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
          <div style="background:linear-gradient(135deg,#002E4C 100%,#002E4C 100%);padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">Você foi convidado para o ProLine Hub!</h1>
            <p style="color:#e8f1ff;margin:10px 0 0 0;">Sua plataforma de gestão de frotas.</p>
          </div>

          <div style="padding:30px;">
            <h2 style="color:#002E4C;margin:0 0 10px 0;">Olá, ${recipientName}!</h2>
            <p style="color:#4a5568;line-height:1.6;margin:0 0 16px 0;">
              Sua empresa foi convidada a fazer parte do ProLine Hub como nosso parceiro.
              Sua conta foi criada com a função de
              <span style="display:inline-block;background:#e9f2ff;color:#0044a0;border:1px solid #cfe1ff;border-radius:999px;padding:2px 10px;font-weight:600;">
                ${userRole}
              </span>.
            </p>

            <!-- Senha temporária -->
            <div style="background:#fff8e1;border:1px solid #ffe08a;padding:14px;border-radius:8px;margin:18px 0;">
              <p style="color:#7a5b00;margin:0 0 6px 0;font-weight:600;">Sua senha temporária</p>
              <code style="display:block;background:#fff3cd;border:1px dashed #ffd56a;padding:10px;border-radius:6px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
                ${temporaryPassword}
              </code>
            </div>

            <p style="color:#4a5568;line-height:1.6;margin:0 0 10px 0;">
              Por favor, faça login e <strong>altere sua senha</strong> o quanto antes para começar a usar a plataforma.
            </p>

            <!-- Botão -->
            <div style="text-align:center;margin:24px 0;">
              <a href="${loginLink}"
                 style="display:inline-block;background:linear-gradient(135deg,#002E4C 0%,#002E4C 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;font-size:16px;">
                Acessar ProLine Hub
              </a>
            </div>

            <!-- Avisos -->
            <div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;border-radius:6px;margin:16px 0;">
              <p style="color:#856404;margin:0;font-size:14px;text-align:center;">
                Por segurança, a senha temporária tem uso restrito. Troque-a no primeiro acesso.
              </p>
            </div>

            <p style="color:#6c757d;margin:16px 0 0 0;font-size:14px;text-align:center;">
              Se o botão não funcionar, copie e cole este link no navegador:<br />
              <span style="word-break:break-all;color:#495057;">${loginLink}</span>
            </p>
          </div>

          <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="color:#6c757d;margin:0;font-size:14px;">
              Atenciosamente,<br />
              <strong style="color:#002E4C;">Equipe ProLine Hub</strong>
            </p>
            <p style="color:#98a2a9;margin:8px 0 0 0;font-size:12px;">
              Este é um e-mail automático, por favor não responda.
            </p>
          </div>
        </div>
      </body>
      </html>`;
    } else {
      // Conteúdo HTML padrão (o que já existia)
      htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
          <div style="background:linear-gradient(135deg,#002E4C 100%,#002E4C 100%);padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;"> Cadastro Aprovado!</h1>
            <p style="color:#e8f1ff;margin:10px 0 0 0;">Bem-vindo ao ProLine Hub</p>
          </div>

          <div style="padding:30px;">
            <h2 style="color:#002E4C;margin:0 0 10px 0;">Olá, ${recipientName}!</h2>
            <p style="color:#4a5568;line-height:1.6;margin:0 0 16px 0;">
              Sua conta foi criada com sucesso com a função de
              <span style="display:inline-block;background:#e9f2ff;color:#0044a0;border:1px solid #cfe1ff;border-radius:999px;padding:2px 10px;font-weight:600;">
                ${userRole}
              </span>.
            </p>

            <!-- Senha temporária -->
            <div style="background:#fff8e1;border:1px solid #ffe08a;padding:14px;border-radius:8px;margin:18px 0;">
              <p style="color:#7a5b00;margin:0 0 6px 0;font-weight:600;">Sua senha temporária</p>
              <code style="display:block;background:#fff3cd;border:1px dashed #ffd56a;padding:10px;border-radius:6px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
                ${temporaryPassword}
              </code>
            </div>

            <p style="color:#4a5568;line-height:1.6;margin:0 0 10px 0;">
              Por favor, faça login e <strong>altere sua senha</strong> o quanto antes.
            </p>

            <!-- Botão -->
            <div style="text-align:center;margin:24px 0;">
              <a href="${loginLink}"
                 style="display:inline-block;background:linear-gradient(135deg,#002E4C 0%,#0044a0 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;font-size:16px;">
                Acessar ProLine Hub
              </a>
            </div>

            <!-- Avisos -->
            <div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;border-radius:6px;margin:16px 0;">
              <p style="color:#856404;margin:0;font-size:14px;text-align:center;">
                Por segurança, a senha temporária tem uso restrito. Troque-a no primeiro acesso.
              </p>
            </div>

            <p style="color:#6c757d;margin:16px 0 0 0;font-size:14px;text-align:center;">
              Se o botão não funcionar, copie e cole este link no navegador:<br />
              <span style="word-break:break-all;color:#495057;">${loginLink}</span>
            </p>
          </div>

          <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="color:#6c757d;margin:0;font-size:14px;">
              Atenciosamente,<br />
              <strong style="color:#002E4C;">Equipe ProLine Hub</strong>
            </p>
            <p style="color:#98a2a9;margin:8px 0 0 0;font-size:12px;">
              Se você não reconhece este cadastro, ignore este email.
            </p>
          </div>
        </div>
      </body>
      </html>`;
    }

    await this.sendEmail({ to: recipientEmail, subject, html: htmlContent });
  }

  /**
   * Método central de envio de e-mail usando a API do Resend.
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isEmailConfigured()) {
      logger.error('RESEND_API_KEY não está configurada. O e-mail não será enviado.');
      // Em um cenário de produção, você poderia lançar um erro ou logar em um serviço de monitoramento.
      return;
    }

    try {
      logger.info(`Attempting to send email: "${options.subject}" to ${options.to}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Resend API error response:', data);
        throw new Error(data.message || 'Erro ao enviar e-mail via Resend');
      }

      if (process.env.NODE_ENV === 'development') {
        logger.info(`E-mail enviado com sucesso via Resend. ID: ${data.id}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Falha no envio do e-mail via Resend:', errorMessage);
      // Lançar o erro permite que a camada superior decida como lidar com a falha.
      throw new Error(errorMessage);
    }
  }

  /**
   * Verifica se a chave da API do Resend está disponível.
   */
  private isEmailConfigured(): boolean {
    return !!this.apiKey;
  }
}
