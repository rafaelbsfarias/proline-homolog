# 🚨 INCONSISTÊNCIAS DO PROJETO - DOMÍNIO PARCEIRO

## 📋 RESUMO EXECUTIVO

O projeto apresenta inconsistências significativas entre a arquitetura planejada e a implementação atual, principalmente no domínio do parceiro e sistema de orçamentos. Este documento cataloga todas as inconsistências identificadas para orientar uma refatoração estrutural.

---

## 🏗️ INCONSISTÊNCIAS DE ARQUITETURA

### 1. SISTEMA DE ORÇAMENTOS DUPLICADO

**Problema:** Existem duas estruturas conflitantes para orçamentos:

#### Estrutura Esperada pelo Código (NÃO EXISTE):
```sql
-- Tabelas que o código tenta usar mas não existem
partner_budgets (
  id, partner_id, name, vehicle_plate, vehicle_model, 
  vehicle_brand, vehicle_year, total_value, status, 
  created_at, updated_at
)

partner_budget_items (
  id, budget_id, service_name, quantity, 
  unit_price, total_price
)
```

#### Estrutura Real no Banco (EXISTE):
```sql
-- Tabelas que realmente existem
quotes (
  id, partner_id, total_value, status, 
  created_at, updated_at
)

service_orders (
  id, quote_id, vehicle_id, order_code, 
  status, created_at, updated_at
)
```

**Impacto:** Código não funciona porque tenta acessar tabelas inexistentes.

---

## 🗄️ INCONSISTÊNCIAS DE BANCO DE DADOS

### 2. TABELAS ESPERADAS vs REAIS

#### Tabelas que o código espera mas NÃO EXISTEM (7):
- ❌ `partner_budgets`
- ❌ `partner_budget_items` 
- ❌ `client_vehicles`
- ❌ `vehicle_inspections`
- ❌ `inspection_items`
- ❌ `service_categories`
- ❌ `specialist_requests`

#### Tabelas que EXISTEM mas podem estar subutilizadas (8):
- ✅ `quotes` - Orçamentos reais
- ✅ `service_orders` - Pedidos de serviço
- ✅ `vehicles` - Veículos cadastrados
- ✅ `partners` - Parceiros cadastrados
- ✅ `profiles` - Perfis de usuários
- ✅ `clients` - Clientes
- ✅ `services` - Serviços disponíveis
- ✅ `inspections` - Inspeções
- ✅ `addresses` - Endereços

---

## 🎭 INCONSISTÊNCIAS DE DADOS

### 3. DOMINÂNCIA DE MOCKDATA (95%)

**Padrões identificados de dados falsos:**
- 🔤 Placas: `ABC` seguido de números/letras (ex: ABC111A3, ABC123B4)
- 💰 Valores: R$ 0,00 em 95% dos registros
- 🏪 Nomes: "Oficina Parceira" + número genérico
- 📧 Emails: padrões repetitivos como `parceiro1@test.com`

**Dados reais identificados (5%):**
- Placa: ABC003N2 - Chevrolet Palio - 2015 (R$ 3.500,00)
- Alguns poucos registros com valores reais

---

## 🔗 INCONSISTÊNCIAS DE RELACIONAMENTOS

### 4. FLUXO PARCEIRO-ORÇAMENTO QUEBRADO

**Fluxo esperado pela regra de negócio:**
```
Especialista → Cria pedido → Parceiro recebe → Parceiro cria orçamento → Vincula veículo
```

**Fluxo atual implementado:**
```
Código busca partner_budgets (❌ não existe) → Erro 500 → Página não carrega
```

**Relacionamentos corretos que deveriam ser usados:**
```
quotes → service_orders → vehicles
```

---

## 💻 INCONSISTÊNCIAS DE CÓDIGO

### 5. ARQUIVOS PROBLEMÁTICOS IDENTIFICADOS

#### `/app/api/partner/budgets/[budgetId]/route.ts`
- ❌ Busca em `partner_budgets` (tabela inexistente)
- ❌ JOIN com `partner_budget_items` (tabela inexistente)
- ✅ **Solução temporária aplicada:** Modificado para usar `quotes`

#### `/modules/partner/services/BudgetService.ts`
- ❌ Referências a tabelas inexistentes
- ❌ Tipos TypeScript baseados em estrutura incorreta
- ❌ Métodos que nunca funcionarão

#### `/app/dashboard/orcamentos/page.tsx`
- ❌ Chama API que falha
- ❌ Não consegue exibir dados de veículos
- ❌ Interface não funcional

---

## 🔐 INCONSISTÊNCIAS DE AUTENTICAÇÃO

### 6. SISTEMA DE PARCEIROS FRAGMENTADO

**Problema:** Token de autenticação referencia parceiro inexistente
- Token aponta para partner_id que não existe na tabela partners
- Sistema de sessão não está alinhado com estrutura real
- Middleware pode estar validando contra dados incorretos

---

## 📱 INCONSISTÊNCIAS DE INTERFACE

### 7. FORMULÁRIOS DESCONECTADOS DA REALIDADE

#### Página de Orçamentos (`/dashboard/orcamentos`):
- ❌ Formulário espera dados que nunca chegam
- ❌ Campos de veículo não populam
- ❌ Botões de ação não funcionam
- ❌ Estados de loading infinito

#### Componentes de Veículo:
- ❌ Propriedades esperadas não batem com dados reais
- ❌ Formatação de exibição baseada em estrutura incorreta

---

## 🛠️ INCONSISTÊNCIAS DE FERRAMENTAS/SCRIPTS

### 8. SCRIPTS DE ANÁLISE CRIADOS

**Scripts temporários criados para diagnóstico:**
- `database-report.cjs` - Análise geral do banco
- `detailed-analysis.cjs` - Análise detalhada de inconsistências  
- `complete-solution.cjs` - Tentativa de solução completa
- `debug-budget.js` - Debug específico de orçamentos

**Problema:** Estes scripts são temporários e poluem o projeto.

---

## 🎯 RECOMENDAÇÕES ESTRUTURAIS

### 9. DECISÕES ARQUITETURAIS NECESSÁRIAS

#### Opção A: Usar estrutura atual (quotes + service_orders)
```sql
-- Manter as tabelas existentes e ajustar todo o código
quotes → service_orders → vehicles
```

#### Opção B: Criar estrutura esperada (partner_budgets)
```sql
-- Criar as tabelas que o código espera
CREATE TABLE partner_budgets (...);
CREATE TABLE partner_budget_items (...);
```

#### Opção C: Refatoração completa
- Redesenhar a arquitetura do zero
- Definir claramente o domínio do parceiro
- Implementar padrões consistentes

---

## 🚀 PLANO DE AÇÃO SUGERIDO

### 1. **ANÁLISE DE REQUISITOS**
- [ ] Definir claramente o domínio do parceiro
- [ ] Especificar fluxo: Especialista → Parceiro → Orçamento
- [ ] Decidir estrutura de dados definitiva

### 2. **LIMPEZA DO CÓDIGO**
- [ ] Remover scripts temporários de análise
- [ ] Reverter modificações experimentais
- [ ] Documentar estado atual vs. desejado

### 3. **DECISÃO ARQUITETURAL**
- [ ] Escolher entre Opções A, B ou C acima
- [ ] Definir padrão de nomenclatura de tabelas
- [ ] Estabelecer relacionamentos claros

### 4. **IMPLEMENTAÇÃO LIMPA**
- [ ] Implementar estrutura escolhida
- [ ] Ajustar código para nova estrutura
- [ ] Criar dados de teste realistas
- [ ] Validar fluxo completo

---

## ⚠️ RISCOS IDENTIFICADOS

1. **Poluição de Código:** Scripts temporários e modificações experimentais
2. **Confusão de Domínio:** Mistura entre quotes e budgets
3. **Dados Irreais:** 95% mockdata pode mascarar problemas reais
4. **Arquitetura Fragmentada:** Múltiplas abordagens conflitantes
5. **Manutenibilidade:** Código atual não é sustentável

---

## 📊 MÉTRICAS DE INCONSISTÊNCIA

- **Tabelas inexistentes referenciadas:** 7
- **Arquivos com código não funcional:** 15+
- **Porcentagem de mockdata:** 95%
- **APIs com erro 500:** 100% das relacionadas a budgets
- **Scripts temporários criados:** 6+

---

## 💡 CONCLUSÃO

O projeto precisa de uma **refatoração estrutural** focada em:

1. **Definir claramente o domínio do parceiro**
2. **Escolher UMA estrutura de orçamentos** (não duas)
3. **Remover toda a poluição temporária**
4. **Implementar solução limpa e sustentável**

A implementação atual não é viável para produção e precisa ser repensada desde a base, priorizando simplicidade e clareza no domínio do parceiro.
