# Configuração de Emails com Supabase

## Implementação Concluída

Este documento descreve a implementação do sistema de emails utilizando recursos do Supabase para
envio de emails após confirmação/rejeição de cadastros pelo administrador.

## Arquitetura Implementada

### 1. SupabaseEmailService (`app/services/SupabaseEmailService.ts`)

- Serviço principal que integra com Supabase Auth e Edge Functions
- Métodos disponíveis:
  - `sendApprovalEmail()`: Envia email de aprovação com detalhes do contrato
  - `sendRejectionEmail()`: Envia email de rejeição com motivo
  - `sendPasswordResetEmail()`: Reset de senha via Supabase Auth
  - `sendBasicApprovalEmail()`: Fallback usando Supabase Auth

### 2. Edge Functions do Supabase

#### `supabase/functions/send-approval-email/index.ts`

- Edge Function para envio de emails de aprovação
- Template HTML responsivo e profissional
- Integração com Resend API
- Inclui detalhes do contrato quando disponível

#### `supabase/functions/send-rejection-email/index.ts`

- Edge Function para envio de emails de rejeição
- Template HTML empático e informativo
- Permite especificar motivo da rejeição
- Inclui orientações para nova tentativa

### 3. Rotas API Atualizadas

#### `/api/admin/approve-registration`

- Integrada com SupabaseEmailService
- Envia email de aprovação com detalhes do contrato
- Suporte a envio de link de confirmação opcional
- Fallback gracioso em caso de falha no email

#### `/api/admin/reject-registration`

- Integrada com SupabaseEmailService
- Envia email de rejeição antes de deletar o cadastro
- Busca dados do usuário para personalização
- Continua operação mesmo se email falhar

## Funcionalidades

### ✅ Emails de Aprovação

- Template profissional com gradiente azul
- Detalhes do contrato (parqueamento, quilometragem, etc.)
- Botão CTA para acesso à plataforma
- Seção de próximos passos
- Informações de suporte

### ✅ Emails de Rejeição

- Template empático com design vermelho
- Motivo personalizado da rejeição
- Orientações para correção
- Botão para nova tentativa
- Contato de suporte

### ✅ Recursos Avançados

- Templates HTML responsivos
- Integração com Supabase Auth
- Fallback para emails básicos
- Logs de erro sem interromper operação
- Validação de dados antes do envio

## Configuração Necessária

### Variáveis de Ambiente

```env
# Já configuradas
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Para Edge Functions
RESEND_API_KEY=sua_chave_resend

# Opcionais
SUPPORT_EMAIL=suporte@proline.com.br
NEXT_PUBLIC_SITE_URL=https://seusite.com
```

### Deploy das Edge Functions

1. **Instalar Supabase CLI:**

```bash
npm install -g supabase
```

2. **Fazer login no Supabase:**

```bash
supabase login
```

3. **Conectar ao projeto:**

```bash
supabase link --project-ref SEU_PROJECT_REF
```

4. **Deploy das functions:**

```bash
# Deploy da função de aprovação
supabase functions deploy send-approval-email

# Deploy da função de rejeição
supabase functions deploy send-rejection-email
```

5. **Configurar secrets:**

```bash
# Configurar chave do Resend
supabase secrets set RESEND_API_KEY=sua_chave_resend
```

### Configuração no Dashboard Supabase

1. **Auth Settings:**
   - Configurar templates de email padrão
   - Definir URL de redirecionamento
   - Habilitar confirmação por email

2. **Edge Functions:**
   - Verificar se as functions foram deployadas
   - Testar execução das functions
   - Monitorar logs de execução

## Uso

### Aprovação de Cadastro

```typescript
// A rota já está integrada, uso automático:
POST /api/admin/approve-registration
{
  "userId": "uuid-do-usuario",
  "parqueamento": "valor",
  "quilometragem": "valor",
  "percentualFipe": 85,
  "taxaOperacao": 5,
  "sendConfirmationToken": false
}
```

### Rejeição de Cadastro

```typescript
POST /api/admin/reject-registration
{
  "userId": "uuid-do-usuario",
  "reason": "Motivo da rejeição (opcional)"
}
```

## Benefícios da Implementação

1. **Usando Recursos Nativos do Supabase:**
   - Edge Functions para alta performance
   - Integração com Supabase Auth
   - Escalabilidade automática
   - Logs centralizados

2. **Templates Profissionais:**
   - Design responsivo
   - Personalização por tipo de email
   - Experiência do usuário aprimorada

3. **Robustez:**
   - Fallbacks em caso de falha
   - Validação de dados
   - Operações não bloqueantes

4. **Monitoramento:**
   - Logs de erro detalhados
   - Status de entrega
   - Métricas de performance

## Próximos Passos Opcionais

1. **Webhooks de Entrega:**
   - Configurar webhooks do Resend
   - Tracking de abertura de emails
   - Estatísticas de engajamento

2. **Templates Dinâmicos:**
   - Sistema de templates no banco
   - Personalização via admin
   - A/B testing de emails

3. **Notificações Push:**
   - Integração com Supabase Realtime
   - Notificações browser
   - Apps mobile

## Teste das Implementações

Para testar o sistema:

1. **Fazer aprovação de cadastro via admin**
2. **Verificar recebimento do email de aprovação**
3. **Fazer rejeição de cadastro via admin**
4. **Verificar recebimento do email de rejeição**
5. **Monitorar logs no Supabase Dashboard**
