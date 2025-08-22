export function RegistrationSuccessEmailTemplate(recipientName: string, subject: string) {
  return `
    <!DOCTYPE html>
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
    </html>
  `;
}
