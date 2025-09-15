# 🔍 Scripts de Verificação de Banco de Dados - Inconsistência de Serviços de Parceiro

## 📋 **Problema Identificado**

O usuário `mecanica@parceiro.com` possui serviços cadastrados, mas eles não aparecem na página de
orçamento devido a uma inconsistência entre dados mock/hardcoded e API real.

## 🛠️ **Scripts Disponíveis**

### 1. **Investigação Completa** 🚀

```bash
node scripts/investigate-partner-services-inconsistency.js
```

**O que faz:**

- ✅ Verifica se o usuário parceiro existe
- ✅ Confirma se a role do usuário está correta
- ✅ Verifica se existem serviços na tabela `partner_services`
- ✅ Testa a API de list-services
- ✅ Simula chamada da API
- ✅ Gera relatório detalhado em JSON

### 2. **Teste da API** 🧪

```bash
node scripts/test-partner-services-api.js
```

**O que faz:**

- ✅ Simula login como parceiro
- ✅ Testa chamada para `/api/partner/list-services`
- ✅ Verifica serviços retornados
- ✅ Diagnóstica problemas de RLS

### 3. **Verificação Rápida** ⚡

```bash
./scripts/quick-check-partner-services.sh
```

**O que faz:**

- ✅ Executa investigação completa
- ✅ Testa API
- ✅ Fornece instruções manuais

### 4. **Estado Geral do Banco** 📊

```bash
node scripts/check-database-state.js
```

**O que faz:**

- ✅ Verifica todas as tabelas
- ✅ Analisa collections e veículos
- ✅ Gera relatório completo

### 5. **Verificação de Serviços** 📋

```bash
node scripts/verify-partner-services.js
```

**O que faz:**

- ✅ Lista todos os serviços por parceiro
- ✅ Estatísticas de serviços
- ✅ Verificação de completude

## 🎯 **Como Usar em Ambiente Local**

### **Passo 1: Executar Investigação Completa**

```bash
cd /home/rafael/workspace/proline-homolog
node scripts/investigate-partner-services-inconsistency.js
```

### **Passo 2: Verificar Resultados**

O script gera um relatório em `reports/partner-services-investigation.json` com:

- Status do usuário parceiro
- Quantidade de serviços cadastrados
- Resultado dos testes da API
- Diagnóstico do problema
- Recomendações de correção

### **Passo 3: Teste Manual**

1. Acesse: `http://localhost:3001/dashboard/partner/orcamento`
2. Faça login com: `mecanica@parceiro.com`
3. Verifique o painel de debug adicionado na página
4. Observe os valores:
   - **Loading**: Se está carregando
   - **Erro**: Mensagens de erro
   - **Serviços encontrados**: Quantidade retornada pela API
   - **Serviços no orçamento**: Quantidade atual no orçamento

## 🔍 **Possíveis Causas Identificadas**

### **Cenário A: Serviços Não Cadastrados**

- **Sintomas**: API retorna 0 serviços
- **Solução**: Inserir serviços na tabela `partner_services`

### **Cenário B: Role Incorreta**

- **Sintomas**: Usuário existe mas role ≠ "partner"
- **Solução**: Atualizar perfil do usuário

### **Cenário C: Problemas de Autenticação**

- **Sintomas**: Erro 401/403 na API
- **Solução**: Verificar token JWT e middleware

### **Cenário D: Problemas de RLS**

- **Sintomas**: Query funciona com service role mas falha com usuário normal
- **Solução**: Verificar políticas de Row Level Security

## 📄 **Relatórios Gerados**

Os scripts geram relatórios em `reports/`:

- `partner-services-investigation.json` - Investigação específica
- `database-test-report.json` - Estado geral do banco

## 🚀 **Execução Recomendada**

```bash
# 1. Investigação completa
node scripts/investigate-partner-services-inconsistency.js

# 2. Teste da API
node scripts/test-partner-services-api.js

# 3. Verificação manual no navegador
# Acesse: http://localhost:3001/dashboard/partner/orcamento
```

## 💡 **Dicas de Debug**

- Verifique logs do servidor durante os testes
- Use as ferramentas de desenvolvedor do navegador (F12)
- Observe a aba Network para chamadas da API
- Verifique se há erros no console do navegador

---

**🎯 Objetivo**: Identificar exatamente onde está a inconsistência e aplicar a correção direcionada.
