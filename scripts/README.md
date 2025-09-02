# Scripts de Teste Seguros - Proline Homolog

## 📋 Visão Geral

Este diretório contém scripts de teste **seguros** que não modificam o banco de dados. Eles foram
criados após a remoção dos scripts anteriores que causavam problemas na aplicação.

## 🔒 Scripts Disponíveis

### 1. `test-guide.sh`

**Propósito:** Guia completo para testes manuais do fluxo de análise/orçamento

**O que faz:**

- Explica o fluxo completo de teste
- Lista pré-requisitos
- Fornece passos detalhados para validação manual
- Mostra critérios de sucesso
- Inclui dicas de debugging

**Como usar:**

```bash
./test-guide.sh
```

**Características:**

- ✅ Não modifica dados
- ✅ Apenas informativo
- ✅ Pode ser executado sem servidor rodando

### 2. `test-endpoints.sh`

**Propósito:** Testa conectividade dos endpoints (apenas GET)

**O que faz:**

- Verifica se o servidor está rodando
- Testa endpoints GET públicos
- Testa endpoints protegidos (mostra necessidade de autenticação)
- Valida conectividade do sistema

**Como usar:**

```bash
./test-endpoints.sh
```

**Características:**

- ✅ Apenas métodos GET (seguros)
- ✅ Não modifica dados
- ✅ Requer servidor rodando

### 3. `test-budget-flow.sh` ⭐ **NOVO**

**Propósito:** Testa se o fluxo de criação automática de orçamentos está funcionando

**O que faz:**

- Verifica inspeções finalizadas
- Conta service orders criadas automaticamente
- Conta quotes geradas para parceiros
- Valida se o contador de solicitações deve aparecer

**Como usar:**

```bash
./test-budget-flow.sh
```

**Características:**

- ✅ Testa a funcionalidade implementada
- ✅ Mostra status atual do fluxo
- ✅ Requer servidor rodando
- ✅ Ajuda a debugar problemas

### 4. `validate-flow.sh` (anterior)

**Propósito:** Instruções manuais para validar o fluxo de orçamentos

### 5. `check-system-status.sh` (anterior)

**Propósito:** Verifica status do sistema e conectividade

## 🚀 Como Usar

### Fluxo Recomendado de Teste:

1. **Leia o guia completo:**

   ```bash
   ./test-guide.sh
   ```

2. **Inicie o servidor:**

   ```bash
   npm run dev
   ```

3. **Teste conectividade:**

   ```bash
   ./test-endpoints.sh
   ```

4. **Teste o fluxo de orçamentos:**

   ```bash
   ./test-budget-flow.sh
   ```

5. **Siga as instruções manuais** do `test-guide.sh` para validação completa

## 🎯 Objetivo dos Testes

Validar que quando uma análise de veículo é finalizada:

- ✅ Uma Service Order é criada automaticamente
- ✅ Um orçamento é gerado para o parceiro de mecânica
- ✅ O parceiro vê o orçamento no dashboard
- ✅ Os contadores são atualizados corretamente

## 🔍 Debugging

Se os testes falharem:

- Verifique logs do servidor Next.js
- Confirme se o Supabase está ativo
- Valide se existem usuários de teste criados
- Verifique as tabelas: `inspections`, `inspection_services`, `service_orders`, `quotes`

## ⚠️ Importante

- **Estes scripts NÃO modificam o banco de dados**
- **São seguros para executar em produção**
- **Focam em validação, não em criação de dados**
- **Requerem usuários de teste já existentes**

## 📝 Registro de Testes

Para documentar testes realizados:

- Data/Hora do teste
- Usuário/Perfil utilizado
- Endpoint testado
- Resultado esperado vs obtido
- Logs de erro (se houver)

---

**Criado após remoção dos scripts problemáticos que modificavam o banco de dados** **Atualizado com
nova funcionalidade de criação automática de orçamentos**
