# Scripts de Migração

Esta pasta contém scripts para **migrações de banco de dados**. Estes scripts atualizam a estrutura
e dados do banco de dados.

## ⚠️ Atenção Crítica

**Estes scripts MODIFICAM a estrutura do banco de dados!**

- 🔴 **NUNCA execute em produção sem aprovação**
- 🔴 Faça backup completo antes de executar
- 🔴 Teste em homologação primeiro
- 🔴 Verifique compatibilidade com dados existentes

## 📋 Scripts Disponíveis

### Migrações de Dados

- `migrate-collection-history.ts` - Migra histórico de coletas para nova estrutura

### Migrações de Schema

- `add_new_checklist_categories.sql` - Adiciona novas categorias ao checklist

## 🚀 Como Executar Migrações

### Processo Seguro

```bash
# 1. Fazer backup completo
pg_dump database_name > backup_before_migration.sql

# 2. Executar em homologação primeiro
# Testar todos os fluxos após migração

# 3. Executar em produção apenas se tudo OK
./migrations/migrate-collection-history.ts

# 4. Verificar integridade dos dados
./maintenance/check-system-status.sh
```

## 📊 O que Cada Migração Faz

### `migrate-collection-history.ts`

- Migra dados de coletas da estrutura antiga para nova
- Preserva histórico completo
- Atualiza referências e relacionamentos
- Mantém integridade dos dados

### `add_new_checklist_categories.sql`

- Adiciona novas categorias ao sistema de checklist
- Atualiza estrutura de inspeções
- Compatível com dados existentes

## 🔍 Verificação Pós-Migração

Após executar qualquer migração:

```bash
# Verificar status geral
./maintenance/check-system-status.sh

# Verificar dados específicos
./data/verify-partner-services.js

# Testar fluxos principais
./tests/test-budget-flow.sh
```

## 📝 Checklist de Migração

- [ ] Backup completo realizado
- [ ] Testado em homologação
- [ ] Scripts de rollback preparados
- [ ] Comunicação com equipe
- [ ] Plano de rollback definido
- [ ] Monitoramento pós-migração

## 🎯 Quando Usar

- **Mudanças na estrutura:** Novos campos ou tabelas
- **Migração de dados:** Reorganização de informações
- **Atualizações de schema:** Modificações na estrutura
- **Correções de dados:** Limpeza ou normalização

## 🚨 Rollback

**Sempre prepare um plano de rollback:**

```sql
-- Exemplo de rollback para add_new_checklist_categories.sql
DELETE FROM checklist_categories WHERE id IN (new_ids);
ALTER TABLE inspections DROP COLUMN IF EXISTS new_field;
```

## 📊 Logs de Migração

Cada migração deve:

- Registrar início e fim
- Contar registros afetados
- Reportar erros específicos
- Fornecer estatísticas de sucesso

---

**Migrações são operações críticas - execute com extremo cuidado!**
