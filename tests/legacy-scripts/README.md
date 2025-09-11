# 📜 Scripts Legados de Teste

Scripts antigos de teste preservados para referência histórica.

## ⚠️ Status: Legado

Estes scripts foram usados durante o desenvolvimento e depuração do sistema. São mantidos para:

- **Referência histórica**
- **Casos de debugging específicos**
- **Entendimento de problemas anteriores**

## 📁 Categorias de Scripts

### 🚗 **Fluxo de Veículos**

- `add-second-vehicle-flow.js`
- `single-vehicle-collection.js`
- `simple-client-flow.js`

### 👨‍💼 **Propostas Admin**

- `admin-propose-date-change.js`
- `admin-propose-date-change-for-second-vehicle.js`
- `approve-single-vehicle.js`
- `test-admin-approval.js`

### ✅ **Aceitação Cliente**

- `client-accept-admin-proposed-date.js`
- `client-accept-proposal.js`

### 🔧 **Correções de Dados**

- `fix-and-verify-third-collection.js`
- `fix-collection-dates.js`
- `fix-second-vehicle-address.js`
- `final-data-alignment.js`

### 🧪 **Verificações e Testes**

- `verify-complete-flow.js`
- `verify-test-flow.js`
- `test-same-address-different-date.js`
- `final-test-summary.js`

### 🎯 **Orquestradores Antigos**

- `orchestrator.js`
- `run-diagnostics.js`

### 📊 **Outros**

- `test_accept_client_contract.js`
- `test_vehicle_collection_join.sql`

## 🚨 Uso Não Recomendado

**⚠️ ATENÇÃO**: Estes scripts são legados e **NÃO devem ser usados** para:

- Desenvolvimento ativo
- Testes de regressão
- Validação de features

## ✅ Use Em Vez Disso

Para testes atuais, use:

- **`tests/user-management/`** - Scripts de criação de usuários
- **`tests/interface-verification/`** - Testes de interface
- **`scripts/db_scripts/production/`** - Scripts de produção

## 📋 Se Precisar Usar

Se realmente precisar executar algum script legado:

```bash
cd tests/legacy-scripts

# ⚠️ Use com cuidado e entenda o que faz
node nome-do-script.js
```

---

**Preserved for historical reference** 📜🔍
