export function signupConfirmationEmailTemplate(recipientName: string, subject: string) {
  return `
    <!doctype html>
    <html lang="pt-BR">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width">
            <title>${subject}</title>
            <style>
            a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
            u + #body a { text-decoration: none !important; }
            @media (max-width: 620px) {
                .container { width: 100% !important; }
                .p-outer { padding: 16px !important; }
                .p-inner { padding: 24px !important; }
            }
            </style>
        </head>
    <body id="body" style="margin:0; padding:0; background:#f8f9fa; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
        Sua solicitação de cadastro na ProlineAuto foi recebida com sucesso.
        </div>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8f9fa;">
            <tr>
                <td class="p-outer" align="center" style="padding:24px;">
                    <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px; max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">
                        <!-- Header -->
                        <tr>
                        <td align="center" style="background:#072E4C; color:#ffffff; padding:32px 24px;">
                            <img src="https://portal.prolineauto.com.br/assets/images/logo-proline.png" alt="ProLine" style="max-width:180px; height:auto; display:block; margin:0 auto 12px;" />
                            <div style="font:700 24px/1.3 'Segoe UI', Arial, sans-serif; margin-top:10px;">Confirmação de Solicitação de Cadastro</div>
                            <div style="font:400 16px/1.5 'Segoe UI', Arial, sans-serif; opacity:.9; margin-top:8px;">
                            Recebemos sua solicitação e ela está em análise.
                            </div>
                        </td>
                        </tr>

                        <!-- Conteúdo -->
                        <tr>
                        <td class="p-inner" style="padding:40px 30px;">
                            <p style="margin:0 0 16px; font:400 15px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                            Prezado(a) ${recipientName},
                            </p>
                            <p style="margin:0 0 16px; font:400 15px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                            Sua solicitação de cadastro na <strong>ProlineAuto</strong> foi registrada com sucesso e está em fase de avaliação pela nossa equipe.
                            </p>
                            <p style="margin:0 0 16px; font:400 15px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                            Assim que seu cadastro for aprovado, você receberá um novo e-mail com as instruções para acesso à plataforma.
                            </p>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#e8f4fd; border:1px solid #b6e0fe; border-radius:8px; margin:20px 0 24px;">
                            <tr>
                                <td style="padding:16px 18px; font:400 14px/1.6 'Segoe UI', Arial, sans-serif; color:#084298;">
                                Este processo pode levar até 48 horas úteis. Caso tenha dúvidas, entre em contato com nosso suporte.
                                </td>
                            </tr>
                            </table>

                            <p style="margin:0; font:400 14px/1.6 'Segoe UI', Arial, sans-serif; color:#333;">
                            Atenciosamente,<br>
                            <strong>Equipe ProlineAuto</strong>
                            </p>
                        </td>
                        </tr>

                        <!-- Rodapé -->
                        <tr>
                        <td align="center" style="padding:24px 24px 30px; background:#f8f9fa; border-top:1px solid #e9ecef;">
                            <div style="font:700 14px/1 'Segoe UI', Arial, sans-serif; color:#333;">ProlineAuto</div>
                            <div style="font:400 13px/1.6 'Segoe UI', Arial, sans-serif; color:#666;">Gestão Inteligente de Frota Automotiva</div>
                            <div style="font:400 13px/1.6 'Segoe UI', Arial, sans-serif; color:#666; margin-top:12px;">
                            Precisa de ajuda? <a href="mailto:suporte@prolineauto.com" style="color:#072E4C; text-decoration:none;">Fale conosco</a>
                            </div>
                            <div style="font:400 12px/1.6 'Segoe UI', Arial, sans-serif; color:#999; margin-top:10px;">
                            Este é um e-mail automático, não responda a esta mensagem.
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
}
