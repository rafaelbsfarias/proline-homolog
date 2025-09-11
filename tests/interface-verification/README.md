# 🖥️ Scripts de Verificação de Interface

Scripts para verificar e testar interfaces do sistema.

## 📁 Scripts Disponíveis

### 🔍 **Verificação de Interface**

- **`verify-admin-interface.js`** - Verifica interface administrativa
- **`verify-client-interface.js`** - Verifica interface do cliente
- **`verify-client-interface-current.js`** - Verifica interface atual do cliente
- **`verify-final-interface.js`** - Verificação final das interfaces
- **`final-interface-verification.js`** - Verificação completa final

### 🧪 **Testes de Interface**

- **`test-admin-interface.js`** - Testa funcionalidades admin
- **`test-client-collection.js`** - Testa coleta do cliente
- **`test-client-collection-fixed.js`** - Testa coleta corrigida

## 🚀 Como Usar

```bash
cd tests/interface-verification

# Verificar interface do admin
node verify-admin-interface.js

# Verificar interface do cliente
node verify-client-interface.js

# Testar coleta do cliente
node test-client-collection.js

# Verificação completa
node final-interface-verification.js
```

## 🎯 Propósito

Estes scripts validam:

- **Funcionalidade** das interfaces
- **Integração** entre frontend e backend
- **Fluxos de usuário** completos
- **Consistência** de dados

## 📊 Tipos de Verificação

| Área        | Scripts                                                        | Foco                     |
| ----------- | -------------------------------------------------------------- | ------------------------ |
| **Admin**   | `verify-admin-interface.js`, `test-admin-interface.js`         | Interface administrativa |
| **Cliente** | `verify-client-interface*.js`, `test-client-collection*.js`    | Interface do cliente     |
| **Geral**   | `verify-final-interface.js`, `final-interface-verification.js` | Verificação completa     |

---

**Interface testing made organized** 🖥️✨
