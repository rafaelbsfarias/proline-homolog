# 📧 Configuração de Email Supabase + Resend

## Problema Identificado

- Supabase enviando 2 emails: um personalizado (Resend) com link errado + um nativo com link correto
- Solução: Configurar Supabase para usar Resend como SMTP

## 🔧 Configuração no Dashboard do Supabase

### 1. SMTP Settings

Acesse: **Dashboard Supabase** → **Settings** → **Auth** → **SMTP Settings**

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: re_WEsY6wTr_AoUL2f1iCucsXjyy9WgcKqi2
Sender Email: naoresponda@serejo.tech
Sender Name: ProLine Hub
```

### 2. Email Templates

Acesse: **Dashboard Supabase** → **Auth** → **Email Templates** → **Confirm signup**

**Template de Confirmação:**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cadastro Aprovado - ProLine Hub</title>
  </head>
  <body
    style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; margin: 0; padding: 20px;"
  >
    <div
      style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;"
    >
      <div
        style="background: linear-gradient(135deg, #0057b8 0%, #0044a0 100%); padding: 30px; text-align: center;"
      >
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Cadastro Aprovado!</h1>
        <p style="color: #e8f1ff; margin: 10px 0 0 0;">Bem-vindo ao ProLine Hub</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #002E4C; margin: 0 0 15px 0;">Olá!</h2>
        <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0;">
          Temos o prazer de informar que seu cadastro foi <strong>aprovado com sucesso</strong>!
          Agora você pode acessar todas as funcionalidades da plataforma.
        </p>
        <div
          style="background: #e8f5e8; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;"
        >
          <p style="color: #15803d; margin: 0; font-weight: 600;">
            ✅ Próximo passo: Confirme seu email
          </p>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a
            href="{{ .ConfirmationURL }}"
            style="display: inline-block; background: linear-gradient(135deg, #002E4C 1000%, #002E4C 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;"
          >
            ✅ Confirmar Email e Acessar ProLine Hub
          </a>
        </div>
        <div
          style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; border-radius: 6px; margin: 20px 0;"
        >
          <p style="color: #856404; margin: 0; font-size: 14px; text-align: center;">
            <strong>⚠️ Importante:</strong> Este link expira em 24 horas.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0 0 0;">
          <p style="color: #6c757d; margin: 0; font-size: 14px; text-align: center;">
            Precisa de ajuda? Entre em contato através do suporte da plataforma.
          </p>
        </div>
      </div>
      <div
        style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;"
      >
        <p style="color: #6c757d; margin: 0; font-size: 14px;">
          Atenciosamente,<br />
          <strong style="color: #002E4C;">Equipe ProLine Hub</strong>
        </p>
      </div>
    </div>
  </body>
</html>
```

## 3. Site URL Configuration

No Dashboard Supabase → **Auth** → **URL Configuration**:

```
Site URL: http://localhost:3000
Additional Redirect URLs:
- http://localhost:3000/dashboard
- http://localhost:3000/auth/callback
- https://portal.prolineauto.com.br/dashboard
- https://portal.prolineauto.com.br/auth/callback
```

## 🚀 Resultado

Após esta configuração:

- ✅ Apenas 1 email será enviado (via Supabase + Resend SMTP)
- ✅ Template personalizado e bonito
- ✅ Link de confirmação seguro e funcional
- ✅ Timestamp automático no auth.users
- ✅ Redirecionamento correto após confirmação

## 🧪 Teste

1. Aprove um usuário pelo admin
2. Verifique se chegou apenas 1 email
3. Clique no link de confirmação
4. Deve redirecionar para `/dashboard?welcome=true&email_confirmed=true`

## 📝 Notas

- Edge Function `send-approval-email` pode ser removida após configuração SMTP
- O Supabase cuidará de toda segurança e validação dos tokens
- Links expiram automaticamente em 24h
