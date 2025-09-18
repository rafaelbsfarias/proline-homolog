# 📊 Localização dos Scripts de População do Banco

## 🔍 **Onde Estão os Scripts que Populavam o Banco**

### ✅ **Scripts de População Organizados:**

#### 🏭 **Scripts de Produção** (`scripts/db_scripts/production/`)

- **`generate_vehicles.js`** - Gera veículos no sistema

#### 👥 **Gerenciamento de Usuários** (`tests/user-management/`)

- **`create_admin_users.js`** - Cria usuários administradores
- **`create_all_users.js`** - Cria todos os tipos de usuários
- **`create_client_user.js`** - Cria usuários clientes
- **`create_partner_user.js`** - Cria usuários parceiros
- **`create_specialist_user.js`** - Cria usuários especialistas
- **`generate_multiple_users.js`** - Gera múltiplos usuários

#### **Scripts Legados** (`tests/legacy-scripts/`)

- **`orchestrator.js`** - Orquestrador que criava dados completos

### 🎯 **Scripts Principais para Popular o Banco:**

#### **Para Produção:**

```bash
# Gerar veículos
cd scripts/db_scripts/production
node generate_vehicles.js
```

#### **Para Criar Usuários:**

```bash
# Criar todos os tipos de usuários
cd tests/user-management
node create_all_users.js

# Ou usuários específicos
node create_admin_users.js
node create_client_user.js
```

#### **Para Testes de Usuários:**

```bash
# Criar usuários para testes
cd tests/user-management
node create_all_users.js
```

### 📋 **O Que Cada Script Faz:**

| Script                       | Localização        | Função                             |
| ---------------------------- | ------------------ | ---------------------------------- |
| `generate_vehicles.js`       | `production/`      | 🚗 Gera veículos de produção       |
| `create_all_users.js`        | `user-management/` | 👥 Cria usuários de todos os tipos |
| `generate_multiple_users.js` | `user-management/` | 👥 Gera múltiplos usuários         |

### 🚨 **Scripts que NÃO Devem Ser Usados:**

- **`tests/legacy-scripts/orchestrator.js`** - Versão antiga, usar os novos organizados

### 🔄 **Migração Supabase:**

Os dados de estrutura estão em:

```
supabase/migrations/20250816112000_service_categories.sql
```

### 🎯 **Recomendação de Uso:**

**✨ NOVO - Script Unificado (RECOMENDADO):**

```bash
# Popular tudo (usuários + veículos)
node populate-database.js --all

# Apenas usuários
node populate-database.js --users

# Apenas veículos
node populate-database.js --vehicles

# Dados de teste
node populate-database.js --test-data

# Limpar + popular tudo
node populate-database.js --clean --all
```

**📋 Scripts Individuais (se necessário):**

1. **Para popular banco novo:**

   ```bash
   # 1. Usuários
   cd tests/user-management
   node create_all_users.js

   # 2. Veículos
   cd ../../scripts/db_scripts/production
   node generate_vehicles.js
   ```

2. **Para testes:**
   ```bash
   cd tests/user-management
   node create_all_users.js
   ```

---

**Todos os scripts de população estão organizados e funcionais!** 🚀
