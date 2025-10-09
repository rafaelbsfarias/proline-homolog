# Fluxo de Status dos Veículos

## Estados Definidos (VehicleStatus.ts)

```typescript
AGUARDANDO_COLETA: 'AGUARDANDO COLETA'
AGUARDANDO_CHEGADA: 'AGUARDANDO CHEGADA DO VEÍCULO'
CHEGADA_CONFIRMADA: 'CHEGADA CONFIRMADA'
EM_ANALISE: 'EM ANÁLISE'
ANALISE_FINALIZADA: 'ANALISE FINALIZADA'
ORCAMENTO_APROVADO: 'ORÇAMENTO APROVADO'  // ⚠️ NOVO - não tem gatilho implementado ainda
FASE_EXECUCAO_INICIADA: 'FASE DE EXECUÇÃO INICIADA'
```

## Estados Adicionais no Banco (não mapeados em VehicleStatus.ts)

```
'PONTO DE COLETA SELECIONADO'  // Setado em set-vehicles-collection
'AGUARDANDO APROVAÇÃO DO ORÇAMENTO'  // Usado em contadores admin
'Análise Finalizada'  // Formato alternativo usado em migrations
```

## Fluxo Completo com Gatilhos

### 1. **AGUARDANDO COLETA** → **PONTO DE COLETA SELECIONADO**
- **Gatilho**: Cliente seleciona ponto de coleta
- **Arquivo**: `app/api/client/set-vehicles-collection/route.ts` (linha 105)
- **Validação**: Status anterior deve estar vazio ou em lista permitida
- **Código**:
  ```typescript
  payload.status = 'PONTO DE COLETA SELECIONADO';
  ```

### 2. **PONTO DE COLETA SELECIONADO** → **AGUARDANDO CHEGADA DO VEÍCULO**
- **Gatilho**: Criação de collection/agendamento de coleta
- **Arquivo**: `app/api/client/set-vehicles-collection/route.ts` (linha 116)
- **Código**:
  ```typescript
  payload.status = 'AGUARDANDO CHEGADA DO VEÍCULO';
  ```

### 3. **AGUARDANDO COLETA / AGUARDANDO CHEGADA** → **CHEGADA CONFIRMADA**
- **Gatilho**: Especialista confirma chegada do veículo
- **Arquivo**: `app/api/specialist/confirm-arrival/route.ts`
- **Validação**: Status deve ser AGUARDANDO_COLETA ou AGUARDANDO_CHEGADA
- **Código**:
  ```typescript
  const allowedPrevious = [
    VehicleStatus.AGUARDANDO_COLETA,
    VehicleStatus.AGUARDANDO_CHEGADA
  ];
  // Atualiza para:
  status: VehicleStatus.CHEGADA_CONFIRMADA
  ```

### 4. **CHEGADA CONFIRMADA** → **EM ANÁLISE**
- **Gatilho**: Especialista inicia análise/checklist
- **Arquivo**: `app/api/specialist/start-analysis/route.ts`
- **Validação**: Status deve ser CHEGADA_CONFIRMADA ou já estar EM_ANALISE
- **Código**:
  ```typescript
  const allowedPrev = 
    current === VehicleStatus.CHEGADA_CONFIRMADA || 
    current === VehicleStatus.EM_ANALISE;
  // Atualiza para:
  status: VehicleStatus.EM_ANALISE
  ```

### 4b. **EM ANÁLISE** (permanece)
- **Gatilho**: Especialista salva checklist em progresso
- **Arquivo**: `app/api/specialist/save-checklist/route.ts` (linha 209)
- **Validação**: Status deve ser CHEGADA_CONFIRMADA ou EM_ANALISE
- **Código**:
  ```typescript
  status: VehicleStatus.EM_ANALISE
  ```

### 5. **EM ANÁLISE** → **ANALISE FINALIZADA**
- **Gatilho**: Especialista finaliza checklist
- **Arquivo**: `app/api/specialist/finalize-checklist/route.ts` (linha 36)
- **Efeito Colateral**: Cria service_orders e quotes para cada categoria necessária
- **Código**:
  ```typescript
  status: VehicleStatus.ANALISE_FINALIZADA
  ```

### 6. **ANALISE FINALIZADA** → **AGUARDANDO APROVAÇÃO DO ORÇAMENTO**
- **Gatilho**: Parceiro envia orçamento para admin
- **Arquivo**: `app/api/partner/quotes/send-to-admin/route.ts` (linha 13)
- **Código**:
  ```typescript
  const vehicleStatus: string = body?.vehicleStatus || 'AGUARDANDO APROVAÇÃO DO ORÇAMENTO';
  ```

### 7. **Status do Quote: pending_partner** → **pending_admin_approval**
- **Gatilho**: Parceiro submete quote
- **Arquivo**: Fluxo do parceiro (não mapeado em vehicle status diretamente)

### 8. **Status do Quote: pending_admin_approval** → **pending_client_approval**
- **Gatilho**: Admin aprova (total ou parcialmente) o orçamento
- **Arquivo**: `app/api/admin/quotes/[quoteId]/review/route.ts`
- **Código**:
  ```typescript
  if (allItemsApproved) {
    newStatus = 'pending_client_approval';
  } else if (allItemsRejected) {
    newStatus = 'rejected';
  } else {
    newStatus = 'pending_client_approval'; // aprovação parcial
  }
  ```

### 9. **pending_client_approval** → **approved** + **ORÇAMENTO APROVADO** ⚠️
- **Gatilho**: Cliente aprova orçamento (integral ou parcial)
- **Arquivo**: `app/api/client/quotes/[quoteId]/approve/route.ts`
- **Status do Quote**: approved
- **Status do Veículo**: ~~FASE_EXECUCAO_INICIADA~~ → **ORCAMENTO_APROVADO** (novo)
- **Código Atual**:
  ```typescript
  // Quote
  status: 'approved',
  client_approved_at: timestamp,
  client_approved_by: clientId,
  client_approved_items: [...ids]
  
  // Veículo
  status: VehicleStatus.ORCAMENTO_APROVADO  // ATUALIZADO
  ```

### 10. **ORÇAMENTO APROVADO** → **FASE DE EXECUÇÃO INICIADA** (futuro)
- **Gatilho**: ❓ Precisa ser definido
- **Sugestões**:
  - Parceiro inicia execução dos serviços
  - Admin move para execução
  - Automático após X dias
  - Quando service order muda para 'in_progress'

## Status dos Quotes (quotes.status)

```
pending_partner        → Aguardando orçamento do parceiro
pending_admin_approval → Aguardando aprovação do admin
pending_client_approval → Aguardando aprovação do cliente
approved               → Aprovado pelo cliente
rejected               → Rejeitado
```

## Problemas Identificados

### 1. **Inconsistência de Formato**
- VehicleStatus usa: `'ANALISE FINALIZADA'`
- Migration usa: `'Análise Finalizada'`
- Alguns lugares usam: `'ANALISE_FINALIZADA'`

### 2. **Status Não Mapeados**
- `'PONTO DE COLETA SELECIONADO'` não está em VehicleStatus.ts
- `'AGUARDANDO APROVAÇÃO DO ORÇAMENTO'` não está em VehicleStatus.ts

### 3. **Status Novo Sem Gatilho de Saída**
- `ORCAMENTO_APROVADO` foi criado mas não há gatilho para sair dele
- Qual é o próximo passo após aprovação?

### 4. **FASE_EXECUCAO_INICIADA vs ORCAMENTO_APROVADO**
- Antes: Cliente aprovava → FASE_EXECUCAO_INICIADA
- Agora: Cliente aprovava → ORCAMENTO_APROVADO
- Questão: Quando o veículo vai para FASE_EXECUCAO_INICIADA?

## Recomendações

### 1. Padronizar Todos os Status
Criar migration para adicionar os status faltantes como constantes válidas no banco

### 2. Definir Fluxo Completo
Decidir quando usar ORCAMENTO_APROVADO vs FASE_EXECUCAO_INICIADA:

**Opção A - Status Separados:**
- ORCAMENTO_APROVADO: Cliente aprovou, aguardando início da execução
- FASE_EXECUCAO_INICIADA: Parceiro iniciou trabalho

**Opção B - Status Único:**
- Remover ORCAMENTO_APROVADO
- Usar apenas FASE_EXECUCAO_INICIADA quando cliente aprovar

### 3. Adicionar Status de Conclusão
```typescript
EM_EXECUCAO: 'EM EXECUÇÃO'          // Serviços sendo realizados
SERVICOS_CONCLUIDOS: 'SERVIÇOS CONCLUÍDOS'  // Tudo pronto
PRONTO_PARA_DEVOLUCAO: 'PRONTO PARA DEVOLUÇÃO'
DEVOLVIDO: 'DEVOLVIDO'
```

## Fluxo Recomendado Completo

```
AGUARDANDO COLETA
  ↓ (cliente seleciona ponto)
PONTO DE COLETA SELECIONADO
  ↓ (collection criada)
AGUARDANDO CHEGADA DO VEÍCULO
  ↓ (especialista confirma)
CHEGADA CONFIRMADA
  ↓ (especialista inicia análise)
EM ANÁLISE
  ↓ (especialista finaliza checklist)
ANALISE FINALIZADA
  ↓ (parceiro envia quote)
AGUARDANDO APROVAÇÃO DO ORÇAMENTO
  ↓ (admin aprova)
AGUARDANDO APROVAÇÃO DO CLIENTE
  ↓ (cliente aprova)
ORÇAMENTO APROVADO
  ↓ (parceiro inicia execução)
EM EXECUÇÃO
  ↓ (parceiro finaliza serviços)
SERVIÇOS CONCLUÍDOS
  ↓ (preparação para devolução)
PRONTO PARA DEVOLUÇÃO
  ↓ (cliente retira/recebe)
DEVOLVIDO
```
