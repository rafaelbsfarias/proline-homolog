# Scripts de Desenvolvimento - Proline Homolog

## 📋 Visão Geral

Este diretório contém scripts organizados para desenvolvimento, teste e manutenção do sistema
Proline. Os scripts estão organizados em pastas temáticas para facilitar a navegação e manutenção.

## 📁 Estrutura de Organização

```
scripts/
├── tests/           # Scripts de teste e validação
├── data/            # Scripts de população e geração de dados
├── maintenance/     # Scripts de diagnóstico e manutenção
├── migrations/      # Scripts de migração de banco
├── utils/           # Scripts utilitários diversos
├── api_tests/       # Testes específicos de API
└── db_scripts/      # Scripts de banco de dados
```

## 🔒 Scripts Seguros (Não Modificam Dados)

### Pasta `tests/`

Scripts de teste que **não modificam** o banco de dados:

- `test-guide.sh` - Guia completo para testes manuais
- `test-endpoints.sh` - Testa conectividade dos endpoints (GET only)
- `test-budget-flow.sh` - Valida fluxo de criação automática de orçamentos
- `test-collection-flow.*` - Testa fluxo de coletas
- `test-complete-flow.cjs` - Testa fluxo completo
- `test-confirm-email.sh` - Testa confirmação de email
- `test-create-admin.js` - Testa criação de admin
- `test-finalize-api.js` - Testa API de finalização
- `test-finalized-inspections.sh` - Testa inspeções finalizadas
- `test-flow-validation.sh` - Valida fluxo de orçamentos
- `test-magic-link.js` - Testa magic links
- `test-partner-categories.sh` - Testa categorias de parceiros
- `test-reset-password.sh` - Testa reset de senha
- `test-signup.sh` - Testa cadastro de usuários
- `test-status-fix.cjs` - Corrige status de inspeções
- `test-all.sh` - Executa todos os testes

### Pasta `maintenance/`

Scripts de diagnóstico e manutenção:

- `check-system-status.sh` - Verifica status do sistema
- `diagnose-budget-counter.sh` - Diagnóstica contador de orçamentos
- `explore-services.js` - Explora serviços disponíveis
- `find-empty-files.js` - Encontra arquivos vazios
- `fix-routes-manifest.js` - Corrige manifest de rotas
- `repair.sh` - Scripts de reparo geral
- `switch-env.sh` - Alterna entre ambientes

## ⚠️ Scripts que Modificam Dados

### Pasta `data/`

Scripts de população e geração de dados de teste:

- `populate-partner-services.js` - Popula serviços dos parceiros
- `populate-partner-categories.js` - Popula categorias dos parceiros
- `create-test-data.sh` - Cria dados de teste
- `create-test-inspection.js` - Cria inspeções de teste
- `generate-report.sh` - Gera relatórios
- `verify-partner-services.js` - Verifica serviços criados
- `add-missing-categories.js` - Adiciona categorias faltantes

### Pasta `migrations/`

Scripts de migração de banco de dados:

- `migrate-collection-history.ts` - Migra histórico de coletas
- `add_new_checklist_categories.sql` - Adiciona categorias de checklist

### Pasta `utils/`

Scripts utilitários diversos:

- `simulate-finalize.js` - Simula finalização de inspeções
- `validate-flow.sh` - Valida fluxo manualmente
- `rewire-imports.ts` - Reorganiza imports

### Pasta `api_tests/`

Testes específicos de API (já organizados):

- `test_pending_collections_api.js`
- `test_set_address_collection_fees.js`
- `test_vehicles_count_api.js`

### Pasta `db_scripts/`

Scripts de banco de dados (já organizados):

- `create_admin_users.js`
- `create_all_users.js`
- `create_client_user.js`
- `create_partner_user.js`
- `create_specialist_user.js`
- `generate_multiple_users.js`
- `generate_vehicles.js`

## 🚀 Como Usar

### Fluxo Recomendado de Desenvolvimento:

1. **Configuração Inicial:**

   ```bash
   # Criar dados de teste
   ./data/create-test-data.sh

   # Popular parceiros e serviços
   ./data/populate-partner-categories.js
   ./data/populate-partner-services.js
   ```

2. **Testes de Validação:**

   ```bash
   # Verificar conectividade
   ./tests/test-endpoints.sh

   # Testar fluxo completo
   ./tests/test-budget-flow.sh
   ```

3. **Manutenção:**

   ```bash
   # Verificar status do sistema
   ./maintenance/check-system-status.sh

   # Diagnosticar problemas
   ./maintenance/diagnose-budget-counter.sh
   ```

## 🎯 Objetivos dos Scripts

- **Tests:** Validar funcionalidades sem modificar dados
- **Data:** Criar ambiente de teste consistente
- **Maintenance:** Diagnosticar e corrigir problemas
- **Migrations:** Atualizar estrutura do banco
- **Utils:** Automatizar tarefas repetitivas

## 🔍 Debugging

Para problemas específicos:

- **Fluxo de orçamentos:** `./tests/test-budget-flow.sh`
- **Status do sistema:** `./maintenance/check-system-status.sh`
- **Dados de teste:** `./data/verify-partner-services.js`
- **API endpoints:** `./tests/test-endpoints.sh`

## ⚠️ Avisos Importantes

- Scripts na pasta `data/` **modificam o banco de dados**
- Scripts na pasta `tests/` são **seguros** (apenas leitura)
- Sempre faça backup antes de executar scripts de migração
- Scripts de manutenção podem afetar o estado do sistema

## 📝 Convenções

- Scripts `.sh` são shell scripts (Bash)
- Scripts `.js` são Node.js
- Scripts `.ts` são TypeScript
- Scripts `.cjs` são CommonJS
- Scripts `.mjs` são ES Modules
- Scripts `.sql` são SQL puro

---

**Organização implementada para melhorar manutenibilidade e navegação**
