# 🚀 Quick Start - Ambiente Local Supabase

## TL;DR - Passos Rápidos

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Inicializar e iniciar Supabase local
supabase init
supabase start

# 3. Configurar ambiente local
./switch-env.sh local

# 4. Acessar Supabase Studio
# http://127.0.0.1:54323

# 5. Iniciar aplicação
npm run dev
```

## 📁 Documentação Completa

- **Setup Detalhado:** `docs/SUPABASE_LOCAL_SETUP.md`
- **Usuários Iniciais:** `create-local-users.sql`
- **Trocar Ambiente:** `./switch-env.sh [local|production|status]`

## 🌐 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Studio** | http://127.0.0.1:54323 | Dashboard Supabase |
| **Emails** | http://127.0.0.1:54324 | Ver emails enviados |
| **API** | http://127.0.0.1:54321 | API local |
| **App** | http://localhost:3000 | Aplicação Next.js |

## ⚡ Vantagens

- ✅ **Sem rate limits** - Teste emails ilimitadamente
- ✅ **Desenvolvimento offline** - Funciona sem internet  
- ✅ **Reset rápido** - `supabase db reset --local`
- ✅ **Debug completo** - Logs detalhados de tudo

## 🆘 Problemas Comuns

```bash
# Supabase não inicia
supabase stop --no-backup
supabase start

# Trocar para produção
./switch-env.sh production

# Ver status atual  
./switch-env.sh status
```
