# Setup de Edge Functions - ProlineAuto

## 🚀 Nova Abordagem: Edge Functions + Resend

Abandonamos os templates do Supabase e criamos uma solução customizada com:

- Edge Functions do Supabase
- Resend para envio de emails
- Templates HTML completamente customizados
- Credenciais temporárias incluídas no email

## 📋 Passos para Setup

### 1. Configurar Resend

1. **Criar conta no Resend**: https://resend.com
2. **Obter API Key**: Dashboard > API Keys > Create API Key
3. **Verificar domínio** (opcional): Dashboard > Domains > Add Domain

### 2. Deploy da Edge Function

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy da função
supabase functions deploy send-specialist-welcome

# Configurar variáveis de ambiente
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set SITE_URL=https://yoursite.com
```

### 3. Testar a Implementação

1. **Acesse o dashboard admin** após login
2. **Encontre a seção** "🚀 Teste: Supabase Templates vs Edge Functions"
3. **Preencha nome e email** de teste
4. **Compare os dois métodos:**
   - Método Antigo (Templates)
   - Método Novo (Edge Function)

### 4. Vantagens da Nova Abordagem

✅ **Design Profissional**: Template HTML completamente customizado ✅ **Credenciais Incluídas**:
Email contém senha temporária para login imediato ✅ **Independente do Supabase**: Não depende dos
templates limitados ✅ **Login Imediato**: Usuário pode acessar o sistema sem redefinir senha ✅
**Flexibilidade Total**: Fácil de modificar design e conteúdo ✅ **Melhor Entregabilidade**: Resend
tem alta taxa de entrega

### 5. Como o Email Funciona

1. **Usuário criado** com senha temporária
2. **Email enviado** com credenciais via Edge Function
3. **Usuário faz login** com email + senha temporária
4. **Sistema força** alteração de senha no primeiro login

### 6. Monitoramento

- **Logs da Edge Function**: Dashboard Supabase > Functions > send-specialist-welcome
- **Emails enviados**: Dashboard Resend > Logs
- **Rate limits**: Resend Free Tier: 100 emails/dia

## 🔧 Troubleshooting

**Edge Function não funciona?**

- Verifique se RESEND_API_KEY está configurada
- Confirme que a função foi deploada corretamente
- Veja os logs no dashboard do Supabase

**Emails não chegam?**

- Verifique spam/lixo eletrônico
- Confirme domínio no Resend (se usando domínio customizado)
- Verifique logs do Resend

**Erro de autenticação?**

- Verifique se o usuário admin tem permissões
- Confirme que o token está sendo enviado corretamente

## 📞 Próximos Passos

1. **Deploy da Edge Function**
2. **Configurar Resend**
3. **Testar ambos os métodos**
4. **Escolher qual usar em produção**
5. **Remover método não utilizado**
