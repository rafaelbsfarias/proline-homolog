# Scripts de Manutenção

Esta pasta contém scripts para **diagnóstico, manutenção e correção** do sistema. Estes scripts
ajudam a identificar e resolver problemas operacionais.

## 🔧 Scripts Disponíveis

### Scripts de Diagnóstico

- `check-system-status.sh` - Verifica status geral do sistema
- `diagnose-budget-counter.sh` - Diagnóstica problemas com contador de orçamentos

### Scripts de Exploração

- `explore-services.js` - Explora e lista serviços disponíveis no sistema
- `find-empty-files.js` - Encontra arquivos vazios ou corrompidos

### Scripts de Correção

- `fix-routes-manifest.js` - Corrige problemas no manifest de rotas
- `repair.sh` - Scripts gerais de reparo do sistema

### Scripts de Configuração

- `switch-env.sh` - Alterna entre ambientes (dev/homolog/production)

## 🚀 Como Usar

### Diagnóstico Geral

```bash
# Verificar status completo do sistema
./check-system-status.sh

# Este script verifica:
# - Conectividade com Supabase
# - Status do servidor Next.js
# - Tabelas principais do banco
# - Usuários ativos
```

### Diagnóstico Específico

```bash
# Problemas com orçamentos
./diagnose-budget-counter.sh

# Explorar serviços
./explore-services.js
```

### Correções

```bash
# Corrigir manifest de rotas
./fix-routes-manifest.js

# Reparos gerais
./repair.sh
```

## 🔍 O que Cada Script Diagnóstica

### `check-system-status.sh`

- ✅ Conectividade com banco de dados
- ✅ Status do servidor de aplicação
- ✅ Tabelas críticas (users, inspections, partners)
- ✅ Contadores e estatísticas básicas

### `diagnose-budget-counter.sh`

- ✅ Inspeções finalizadas sem service orders
- ✅ Service orders sem quotes
- ✅ Contadores desatualizados
- ✅ Problemas no fluxo de orçamentos

### `explore-services.js`

- ✅ Lista todos os serviços disponíveis
- ✅ Organização por parceiro
- ✅ Categorias e subcategorias
- ✅ Preços e status

## 🎯 Quando Usar

- **Problemas de conectividade:** `check-system-status.sh`
- **Fluxo de orçamentos quebrado:** `diagnose-budget-counter.sh`
- **Dados corrompidos:** `find-empty-files.js`
- **Rotas não funcionam:** `fix-routes-manifest.js`
- **Mudança de ambiente:** `switch-env.sh`

## 📊 Saídas dos Scripts

### Status do Sistema

```
🟢 Sistema Online
📊 Estatísticas:
   • Usuários: 25
   • Parceiros: 7
   • Inspeções: 12
   • Service Orders: 8
```

### Diagnóstico de Orçamentos

```
🔍 Inspeções finalizadas: 5
📋 Service Orders criadas: 3
⚠️  Problemas encontrados:
   • 2 inspeções sem service order
   • 1 service order sem quote
```

## ⚠️ Avisos

- Scripts de correção podem modificar dados
- Faça backup antes de executar correções
- Alguns scripts requerem servidor rodando
- Verifique logs após execução

---

**Scripts essenciais para manutenção e debugging do sistema**
