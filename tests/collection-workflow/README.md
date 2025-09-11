# Testes do Fluxo de Coleta

Este diretório contém todos os testes e ferramentas de diagnóstico para identificar e corrigir
problemas no fluxo de coleta de veículos.

## 📂 Estrutura

```
tests/collection-workflow/
├── config/
│   └── test-config.js          # Configurações centralizadas
├── scripts/
│   ├── flow-simulator.js       # Simulador do fluxo de coleta
│   ├── diagnostic-monitor.js   # Monitor de mudanças no banco
│   ├── diagnostic-orchestrator.js # Orquestrador dos testes
│   └── setup-test-vehicles.js  # Configuração de veículos de teste
├── reports/                    # Relatórios gerados
├── run-collection-workflow-tests.js # Script principal
└── README.md                   # Este arquivo
```

## 🎯 Problema Identificado

O sistema está incorretamente movendo dados para `collection_history` durante o **Passo 2**
(AdminPropoeData), quando deveria aguardar a aceitação do cliente no **Passo 3**.

### Fluxo Esperado vs Atual

**✅ Fluxo Esperado:**

1. Cliente define coleta → Status: `requested`
2. Admin propõe data → Status: `approved`
3. Cliente aceita → Status: `paid` + **DADOS VÃO PARA HISTÓRICO**

**❌ Fluxo Atual (Problemático):**

1. Cliente define coleta → Status: `requested`
2. Admin propõe data → Status: `approved` + **DADOS VÃO PARA HISTÓRICO** ⚠️
3. Cliente aceita → Status: `paid`

## 🚀 Como Usar

### Execução Rápida

```bash
# Executar diagnóstico completo
cd tests/collection-workflow
node run-collection-workflow-tests.js

# Apenas configurar dados de teste
node run-collection-workflow-tests.js --setup-only

# Limpar dados + executar diagnóstico
node run-collection-workflow-tests.js --clean

# Modo verbose
node run-collection-workflow-tests.js --verbose
```

### Execução Manual dos Scripts

```bash
# 1. Configurar veículos de teste
node scripts/setup-test-vehicles.js

# 2. Executar diagnóstico completo
node scripts/diagnostic-orchestrator.js

# 3. Ou executar apenas o simulador
node scripts/flow-simulator.js
```

## 📊 Saídas e Relatórios

### Relatórios Gerados

- **`reports/collection-workflow-diagnostic-*.json`** - Relatório detalhado do diagnóstico
- **`reports/collection-workflow-test-results-*.json`** - Resultados dos testes

### Informações Capturadas

- **Snapshots**: Estado do banco antes/depois de cada passo
- **Mudanças**: Registros adicionados/modificados/removidos
- **Análise**: Identificação de padrões problemáticos
- **Recomendações**: Sugestões de correção

## ⚙️ Configuração

Todas as configurações estão centralizadas em `config/test-config.js`:

```javascript
export const TEST_CONFIG = {
  CLIENT_ID: '00ab894a-1120-4dbe-abb0-c1a6d64b516a',
  COLLECTION: {
    FEE_PER_VEHICLE: 50,
    DEFAULT_ADDRESS: 'general labatut, 123 - graça',
    DAYS_AHEAD: 1,
  },
  STATUS_FLOW: {
    INITIAL: 'requested',
    ADMIN_APPROVED: 'approved',
    CLIENT_ACCEPTED: 'paid',
  },
  // ... mais configurações
};
```

## 🔍 Dados de Teste

### Cliente de Teste

- **ID**: `00ab894a-1120-4dbe-abb0-c1a6d64b516a`
- **Nome**: Cliente Teste 6699

### Veículos Criados

1. Toyota Corolla 2020 - ABC-1234
2. Honda Civic 2019 - DEF-5678
3. Volkswagen Golf 2021 - GHI-9012

## 📋 Pré-requisitos

1. **Node.js** com suporte a ES modules
2. **Variáveis de ambiente** configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Banco Supabase** ativo e acessível

## 🧪 Tipos de Teste

### 1. Teste de Fluxo Completo

- Executa os 3 passos do fluxo
- Monitora mudanças no banco
- Identifica movimentação indevida de dados

### 2. Teste de Setup

- Cria veículos de teste
- Configura endereços
- Prepara ambiente para testes

### 3. Monitoramento em Tempo Real

- Captura snapshots antes/depois
- Calcula diffs entre estados
- Detecta registros duplicados

## 🔧 Resolução de Problemas

### Erro: "Nenhum veículo encontrado"

```bash
# Executar setup primeiro
node scripts/setup-test-vehicles.js
```

### Erro: "Cliente não encontrado"

- Verificar se `CLIENT_ID` em `test-config.js` está correto
- Confirmar que o cliente existe na tabela `profiles`

### Erro: "Constraint violation"

- Limpar dados antigos antes de executar
- Usar `--clean` flag

## 📈 Próximos Passos

1. **Identificar código responsável** pela criação indevida do histórico
2. **Corrigir lógica** para criar histórico apenas quando `status = 'paid'`
3. **Implementar testes de regressão**
4. **Adicionar validações** para prevenir duplicatas

## 🤝 Como Contribuir

1. Mantenha as configurações centralizadas em `test-config.js`
2. Adicione novos testes seguindo o padrão existente
3. Documente mudanças neste README
4. Gere relatórios antes e depois das correções

---

**Última atualização**: Setembro 2025  
**Status**: 🔴 Problema identificado, aguardando correção
