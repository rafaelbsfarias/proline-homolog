import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ApprovalEmailRequest {
  to: string;
  fullName: string;
  userId: string;
  contractDetails?: {
    parqueamento: string;
    quilometragem: string;
    percentualFipe: number;
    taxaOperacao: number;
  };
  loginUrl?: string;
  siteUrl?: string;
}

Deno.serve(async req => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { to, fullName, userId, contractDetails, loginUrl, siteUrl }: ApprovalEmailRequest =
      await req.json();

    if (!to || !fullName || !userId) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Criar cliente Supabase para gerar link de confirmação
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Gerar link de confirmação de email usando Supabase
    let confirmationUrl = '';
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: to,
        options: {
          redirectTo: `${loginUrl || siteUrl || 'https://portal.prolineauto.com.br'}/dashboard?welcome=true`,
        },
      });

      if (linkError) {
        // Fallback para URL de login se não conseguir gerar link
        confirmationUrl = loginUrl || siteUrl || 'https://portal.prolineauto.com.br/login';
      } else {
        confirmationUrl =
          linkData.properties?.action_link ||
          linkData.properties?.email_otp ||
          loginUrl ||
          siteUrl ||
          'https://portal.prolineauto.com.br/login';
      }
    } catch {
      // Fallback para URL de login se houver erro
      confirmationUrl = loginUrl || siteUrl || 'https://portal.prolineauto.com.br/login';
    }

    // Prioridade: loginUrl do payload > SITE_URL/login > siteUrl/login > fallback
    let finalLoginUrl = loginUrl;
    const envSiteUrl = Deno.env.get('SITE_URL');

    if (!finalLoginUrl) {
      if (envSiteUrl && typeof envSiteUrl === 'string' && envSiteUrl.trim() !== '') {
        finalLoginUrl = envSiteUrl.replace(/\/$/, '') + '/login';
      }
    }
    if (!finalLoginUrl && siteUrl && typeof siteUrl === 'string' && siteUrl.trim() !== '') {
      finalLoginUrl = siteUrl.replace(/\/$/, '') + '/login';
    }
    if (!finalLoginUrl) {
      finalLoginUrl = 'https://portal.prolineauto.com.br/login';
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Configuração de email não disponível' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contractDetailsHtml = contractDetails
      ? `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #002E4C; margin-top: 0;">Detalhes do seu Contrato</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 8px 0;"><strong>Parqueamento:</strong> ${contractDetails.parqueamento}</li>
          <li style="margin: 8px 0;"><strong>Quilometragem:</strong> ${contractDetails.quilometragem}</li>
          <li style="margin: 8px 0;"><strong>Percentual FIPE:</strong> ${contractDetails.percentualFipe}%</li>
          <li style="margin: 8px 0;"><strong>Taxa de Operação:</strong> ${contractDetails.taxaOperacao}%</li>
        </ul>
      </div>
    `
      : '';

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cadastro Aprovado - ProLine Hub</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #002E4C 100%, #002E4C 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Cadastro Aprovado!</h1>
            <p style="color: #e8f1ff; margin: 10px 0 0 0; font-size: 16px;">Bem-vindo ao ProLine Hub</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #002E4C; margin: 0 0 20px 0; font-size: 24px;">Olá, ${fullName}!</h2>
            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
              Temos o prazer de informar que seu cadastro foi <strong>aprovado com sucesso</strong> pela nossa equipe! 
              Agora você pode acessar todas as funcionalidades da plataforma ProLine Hub.
            </p>
            ${contractDetailsHtml}
            <div style="background: #e8f5e8; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #15803d; margin: 0 0 10px 0; font-size: 18px;">✅ Próximos Passos</h3>
              <ol style="color: #166534; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Acesse a plataforma usando o botão abaixo</li>
                <li style="margin: 8px 0;">Faça login com seu email e senha cadastrados</li>
                <li style="margin: 8px 0;">Explore todas as funcionalidades disponíveis</li>
              </ol>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #002E4C 100%, #002E4C 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,87,184,0.3); transition: all 0.3s ease;">
                  Confirmar Email e Acessar ProLine Hub
              </a>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px; text-align: center;">
                <strong> Importante:</strong> Clique no botão acima para confirmar seu email e ativar sua conta.
                Este link expira em 24 horas.
              </p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0 0 0; border: 1px solid #e9ecef;">
              <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;"> Precisa de ajuda?</h3>
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                Nossa equipe está pronta para ajudar! Entre em contato conosco através do suporte da plataforma 
                ou respondendo este email.
              </p>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">
              Atenciosamente,<br>
              <strong style="color: #002E4C;">Equipe ProLine Hub</strong>
            </p>
            <p style="color: #adb5bd; margin: 0; font-size: 12px;">
              Este é um email automático, por favor não responda.
            </p>
            ${
              siteUrl
                ? `<p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 12px;">
              <a href="${siteUrl}" style="color: #002E4C; text-decoration: none;">Visite nosso site</a>
            </p>`
                : ''
            }
          </div>
        </div>
      </body>
    </html>
    `;

    // Enviar email via Resend com link de confirmação do Supabase
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ProLine Hub <naoresponda@serejo.tech>',
        to: [to],
        subject: '🎉 Cadastro Aprovado - Confirme seu Email para Acessar!',
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro do Resend: ${errorText}`);
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({
        success: true,
        emailId: data.id,
        message: 'Email de aprovação enviado com sucesso',
        confirmationLink: confirmationUrl,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
