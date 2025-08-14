# Supabase Edge Functions Configuration

Este diretório contém Edge Functions do Supabase para funcionalidades customizadas.

## Edge Functions Disponíveis

### send-specialist-welcome

Envia emails de boas-vindas personalizados para novos especialistas usando Resend.

**Funcionalidades:**

- Template HTML completamente customizado
- Não depende dos templates do Supabase
- Credenciais temporárias incluídas no email
- Design responsivo profissional
- Suporte a diferentes roles de usuário

## Deploy das Edge Functions

1. **Instalar Supabase CLI:**

```bash
npm install -g supabase
```

2. **Login no Supabase:**

```bash
supabase login
```

3. **Configurar projeto:**

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. **Deploy da função:**

```bash
supabase functions deploy send-specialist-welcome
```

## Configuração de Variáveis

Configure estas variáveis no painel do Supabase:

1. **RESEND_API_KEY** - Chave da API do Resend
2. **SITE_URL** - URL do seu site (ex: https://yourapp.com)

## Uso

A Edge Function pode ser chamada via:

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-specialist-welcome`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'user@email.com',
    userName: 'João Silva',
    temporaryPassword: 'temp123',
    userRole: 'Especialista',
  }),
});
```

## Benefícios

- ✅ Controle total sobre design do email
- ✅ Não depende dos templates do Supabase
- ✅ Emails mais rápidos e confiáveis
- ✅ Fácil customização e manutenção
- ✅ Suporte a diferentes provedores de email
