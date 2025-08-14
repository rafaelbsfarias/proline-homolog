import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  userName: string;
  temporaryPassword: string;
  userRole: string;
}

// Template HTML do email
const createEmailTemplate = (
  userName: string,
  temporaryPassword: string,
  userRole: string,
  loginUrl: string
) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao ProlineAuto</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0066cc, #004499);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-message {
            text-align: center;
            margin-bottom: 30px;
        }
        .welcome-message h2 {
            color: #0066cc;
            font-size: 24px;
            margin-bottom: 15px;
        }
        .welcome-message p {
            font-size: 16px;
            line-height: 1.6;
            color: #666;
            margin-bottom: 20px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #0066cc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .credentials-box h3 {
            color: #0066cc;
            margin-top: 0;
            font-size: 18px;
        }
        .credential-item {
            margin: 10px 0;
            font-size: 16px;
        }
        .credential-value {
            background-color: #e9ecef;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: bold;
            color: #495057;
            display: inline-block;
            margin-left: 10px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #0066cc, #004499);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .instructions {
            background-color: #f8f9fa;
            border-left: 4px solid #0066cc;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .instructions h3 {
            color: #0066cc;
            margin-top: 0;
            font-size: 18px;
        }
        .instructions ol {
            margin: 15px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        .security-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .security-note strong {
            color: #856404;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
        }
        .footer a {
            color: #0066cc;
            text-decoration: none;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .cta-button {
                display: block;
                margin: 20px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ProlineAuto</div>
            <h1>Bem-vindo à nossa plataforma!</h1>
            <p>Sua conta foi criada com sucesso</p>
        </div>
        
        <div class="content">
            <div class="welcome-message">
                <h2>Olá, ${userName}! </h2>
                <p>Sua conta foi criada com sucesso em nossa plataforma como <strong>${userRole}</strong>. Use as credenciais abaixo para fazer seu primeiro login.</p>
            </div>
            
            <div class="credentials-box">
                <h3>Suas Credenciais de Acesso</h3>
                <div class="credential-item">
                    <strong>Email:</strong>
                    <span class="credential-value">${userName.toLowerCase()}</span>
                </div>
                <div class="credential-item">
                    <strong>Senha Temporária:</strong>
                    <span class="credential-value">${temporaryPassword}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">
                     Fazer Login Agora
                </a>
            </div>
            
            <div class="instructions">
                <h3>Primeiros Passos:</h3>
                <ol>
                    <li><strong>Clique no botão acima</strong> para acessar a plataforma</li>
                    <li><strong>Use suas credenciais</strong> para fazer o primeiro login</li>
                    <li><strong>Altere sua senha</strong> assim que entrar no sistema</li>
                    <li><strong>Complete seu perfil</strong> com suas informações</li>
                    <li><strong>Explore a plataforma</strong> e todos os recursos disponíveis</li>
                </ol>
            </div>
            
            <div class="security-note">
                <strong>Importante:</strong> Por segurança, altere sua senha temporária no primeiro login. Se você não solicitou esta conta, entre em contato conosco imediatamente.
            </div>
        </div>
        
        <div class="footer">
            <p><strong>ProlineAuto</strong></p>
            <p>Gestão Inteligente de Frota Automotiva</p>
            <p style="margin-top: 20px;">
                Precisa de ajuda? <a href="mailto:suporte@prolineauto.com">Entre em contato conosco</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
                Este é um e-mail automático, não responda a esta mensagem.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const emailRequest: EmailRequest = await req.json();
    const { to, userName, temporaryPassword, userRole } = emailRequest;

    // Validar campos obrigatórios
    if (!to || !userName || !temporaryPassword || !userRole) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: to, userName, temporaryPassword, userRole',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Configuração do Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://portal.prolineauto.com.br';

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const loginUrl = `${SITE_URL}/login`;
    const htmlContent = createEmailTemplate(userName, temporaryPassword, userRole, loginUrl);

    // Enviar email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProlineAuto <noreply@prolineauto.com>',
        to: [to],
        subject: 'Bem-vindo ao ProlineAuto - Suas credenciais de acesso',
        html: htmlContent,
        text: `Bem-vindo ao ProlineAuto!\n\nOlá, ${userName}!\n\nSua conta foi criada como ${userRole}.\n\nCredenciais:\nEmail: ${to}\nSenha: ${temporaryPassword}\n\nAcesse: ${loginUrl}\n\nAltere sua senha no primeiro login.\n\nEquipe ProlineAuto`,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: emailResult.id,
        recipient: to,
        userName,
        userRole,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-specialist-welcome function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
