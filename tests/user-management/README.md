# 👥 Scripts de Gerenciamento de Usuários

Scripts para criação e gerenciamento de usuários do sistema.

## 📁 Scripts Disponíveis

### 🏗️ **Criação Individual**

- **`create_admin_users.js`** - Cria usuários administradores
- **`create_client_user.js`** - Cria usuário cliente específico
- **`create_partner_user.js`** - Cria usuário parceiro
- **`create_specialist_user.js`** - Cria usuário especialista

### 🏭 **Criação em Lote**

- **`create_all_users.js`** - Cria todos os tipos de usuários
- **`generate_multiple_users.js`** - Gera múltiplos usuários

## 🚀 Como Usar

```bash
cd tests/user-management

# Criar todos os tipos de usuários
node create_all_users.js

# Criar apenas administradores
node create_admin_users.js

# Criar apenas clientes
node create_client_user.js

# Gerar múltiplos usuários
node generate_multiple_users.js
```

## 📋 Tipos de Usuário

| Tipo             | Script                      | Descrição                |
| ---------------- | --------------------------- | ------------------------ |
| **Admin**        | `create_admin_users.js`     | Usuários administrativos |
| **Cliente**      | `create_client_user.js`     | Clientes do sistema      |
| **Parceiro**     | `create_partner_user.js`    | Parceiros comerciais     |
| **Especialista** | `create_specialist_user.js` | Especialistas técnicos   |

## ⚙️ Configuração

Certifique-se que as variáveis de ambiente estão configuradas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

**Organized from legacy db_scripts folder** 📁➡️✨
