# 🏠 SUPABASE LOCAL - BYPASS RATE LIMITS

## ✅ Status: CONFIGURADO E FUNCIONANDO

### 🎯 Objetivo Alcançado
Agora você pode testar emails **SEM RATE LIMITS** usando o Supabase local!

## 🔧 Configuração Atual

### Ambiente Ativo: **LOCAL**
- **API URL:** `http://127.0.0.1:54321`
- **Vercel Dev:** `http://localhost:3000` 
- **Studio:** `http://127.0.0.1:54323`
- **Emails (Inbucket):** `http://127.0.0.1:54324`

### 📧 Visualizador de Emails
**URL:** http://127.0.0.1:54324

Todos os emails enviados pelo Supabase local aparecem aqui em tempo real!
**Não há rate limits** - você pode enviar quantos emails quiser.

## 🚀 Como Testar

### 1. **Acesse o Dashboard**
- URL: http://localhost:3000/dashboard
- Faça login como admin

### 2. **Use os Componentes de Teste**
- **EmailTemplateTest**: Testa Magic Link e Invite User
- **EdgeFunctionEmailTest**: Compara métodos antigo vs novo

### 3. **Visualize os Emails**
- Abra: http://127.0.0.1:54324
- Todos os emails aparecerão instantaneamente
- Clique para ver o conteúdo completo

## 📋 Comandos Úteis

### Alternar Ambientes
```bash
# Usar ambiente local (sem rate limits)
./switch-env.sh local

# Voltar para produção
./switch-env.sh production
```

### Controlar Supabase Local
```bash
# Iniciar
supabase start

# Parar
supabase stop

# Status
supabase status

# Reset completo (limpa todos os dados)
supabase db reset
```

## 🛠️ Configuração de Usuário Admin

### No Studio (http://127.0.0.1:54323):

1. **Aba "Authentication" > "Users"**
2. **Criar novo usuário:**
   - Email: `admin@prolineauto.com.br`
   - Password: `admin123`
   - Confirm email: ✅ True

3. **Definir como Admin:**
   - Aba "Raw user meta data":
   ```json
   {
     "role": "admin",
     "email_verified": true
   }
   ```

## 🎯 Vantagens do Ambiente Local

### ✅ Sem Limitações
- **Zero rate limits** para emails
- **Testes ilimitados** de Magic Link
- **Reset rápido** de dados quando necessário

### ✅ Desenvolvimento Produtivo  
- **Emails visíveis** instantaneamente no Inbucket
- **Debug completo** com logs locais
- **Modificações rápidas** nos templates

### ✅ Isolamento Completo
- **Dados separados** da produção
- **Testes seguros** sem afetar usuários reais
- **Experimentos livres** com configurações

## 📊 Comparação: Produção vs Local

| Aspecto | Produção | Local |
|---------|----------|-------|
| **Rate Limits** | ⚠️ 1 email/60s | ✅ Ilimitado |
| **Emails** | 📧 Reais | 👀 Inbucket |
| **Debug** | 🔍 Limitado | 🛠️ Completo |
| **Reset** | ❌ Impossível | ✅ Instantâneo |
| **Usuários** | 👥 Reais | 🧪 Teste |

## 🔄 Workflow Recomendado

### 1. **Desenvolvimento Local**
```bash
./switch-env.sh local
# Desenvolver e testar sem limites
```

### 2. **Teste Final em Produção**
```bash
./switch-env.sh production  
# Validar uma última vez
```

### 3. **Deploy**
```bash
# Deploy com confiança!
```

## 🎉 Resultado

**Problema do Rate Limit = RESOLVIDO!**

Agora você pode:
- ✅ Testar emails ilimitadamente
- ✅ Ver todos os emails no Inbucket
- ✅ Debugar problemas rapidamente
- ✅ Desenvolver novos recursos sem restrições

---

**💡 Dica:** Mantenha o Inbucket (http://127.0.0.1:54324) sempre aberto durante desenvolvimento para ver os emails em tempo real!
