# 🔧 Scripts de Database - Produção

Esta pasta contém apenas os scripts essenciais para operações de database em produção.

## 📁 Scripts Disponíveis

### 🔍 **Verificação**

- **`check-admin-data.js`** - Verifica dados de administradores
- **`check-vehicles.js`** - Verifica status e dados dos veículos

### 🏭 **Geração**

- **`generate_vehicles.js`** - Gera veículos para o sistema

### 🧹 **Limpeza**

- **`clean-test-data.js`** - Remove dados de teste específicos
- **`complete-clean.js`** - Limpeza completa do banco (⚠️ cuidado!)

### 🔐 **Autenticação**

- **`get-auth-tokens.js`** - Obtém tokens de autenticação

## 🚀 Como Usar

```bash
# Navegar para a pasta
cd scripts/db_scripts/production

# Verificar veículos
node check-vehicles.js

# Verificar dados de admin
node check-admin-data.js

# Gerar veículos
node generate_vehicles.js

# Obter tokens (se necessário)
node get-auth-tokens.js
```

## ⚠️ Scripts de Limpeza

**ATENÇÃO**: Os scripts de limpeza devem ser usados com cuidado:

```bash
# Limpeza específica de testes
node clean-test-data.js

# ⚠️ PERIGOSO: Limpeza completa
node complete-clean.js
```

## 📋 Pré-requisitos

- **Node.js** com ES modules
- **Variáveis de ambiente** configuradas (`.env.local`)
- **Acesso ao Supabase** com service role key

## 🔗 Scripts de Teste

Scripts de teste foram movidos para:

- `tests/user-management/` - Scripts de criação de usuários
- `tests/interface-verification/` - Testes de interface
- `tests/legacy-scripts/` - Scripts antigos

---

**Mantido limpo e organizado** ✨
