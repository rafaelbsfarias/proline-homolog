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

## 🔍 Scripts de Verificação de Banco de Dados

Scripts especializados para análise completa do estado do banco de dados PostgreSQL:

### `check-database-state-pg.js` (Recomendado)

Script completo que testa todas as funcionalidades usando conexão direta com PostgreSQL.

**Funcionalidades:**

- ✅ Verificação de estruturas das tabelas
- ✅ Análise completa do estado das collections
- ✅ Análise do estado dos veículos
- ✅ Verificação do histórico de collections
- ✅ Teste de triggers e functions
- ✅ Verificação de audit logs
- ✅ Testes de consistência de dados
- ✅ Geração de relatório JSON detalhado

**Como usar:**

```bash
cd /home/rafael/workspace/proline-homolog
node scripts/check-database-state-pg.js
```

### `check-database-state.js` (Supabase)

Versão que usa o cliente Supabase (menos confiável para testes avançados).

## 📊 Estado Atual do Banco (10/09/2025)

#### 📈 **Estatísticas Gerais:**

- **Collections ativas:** 3 (2 requested, 1 approved)
- **Total de veículos:** 100
- **Registros históricos:** 1
- **Receita total:** R$ 10,00

#### 🚗 **Estado dos Veículos:**

- **AGUARDANDO COLETA:** 1 veículo
- **SOLICITAÇÃO DE MUDANÇA DE DATA:** 1 veículo (ABC256U4)
- **AGUARDANDO DEFINIÇÃO DE COLETA:** 98 veículos
- **Com collections associadas:** 2 veículos
- **Sem collections:** 98 veículos

#### 📦 **Estado das Collections:**

- **Collection órfã:** 1 (ID: 3182ff31... - data 20/09/2025)
- **Collections com veículos:** 2
- **Última atualização:** 20/09/2025

#### ⚙️ **Sistema de Triggers:**

- **Total de triggers:** 7
- **Trigger importante:** `trigger_create_collection_history` (ativo)
- **Functions disponíveis:** 17

## 🚨 Problemas Identificados

### **Críticos:**

1. **1 collection órfã** - Collection criada mas não associada a veículo
2. **Audit logs vazios** - Sistema não está registrando atividades

### **Mudanças de Data:**

- **Veículo ABC256U4:** Data alterada de 14/09/2025 → 20/09/2025
- **Status:** SOLICITAÇÃO DE MUDANÇA DE DATA
- **Collection associada:** Mantém a original (156bc434...)

## ✅ Funcionando Corretamente:

- Triggers de histórico estão ativos
- Mudanças de data são aplicadas no banco
- Estruturas das tabelas estão íntegras
- Consistência de dados está mantida

## 📋 Recomendações:

1. **Limpar collections órfãs** que não estão associadas a veículos
2. **Ativar sistema de audit logs** para rastreamento de mudanças
3. **Processar solicitações de mudança de data** pendentes
4. **Otimizar fluxo de criação de collections** para evitar órfãos

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
