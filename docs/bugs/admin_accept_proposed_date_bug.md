# Bug: Erro ao Aceitar Data Proposta pelo Cliente

## Descrição do Problema

Quando o administrador tenta aceitar uma data proposta pelo cliente através do botão "Aceitar data" na seção "Aprovação de nova data", a API retorna o erro:

```json
{"success":false,"error":"Precificação ausente para este endereço."}
```

Mesmo quando o valor de coleta já está definido para aquele endereço.

## Contexto

### Interface do Usuário
Na página de visão geral do cliente (`/admin/clients/[id]/overview`), a seção "Aprovação de nova data" exibe:

```
Aprovação de nova data
Ponto de coleta                 Veículos  Origem      Data proposta     Valor por veículo (R$)  Total por endereço (R$)  Ações
general labatut, 123 - salvador  1         Cliente     30/08/2025        R$ 10,00                R$ 10,00                 [Aceitar data] [Propor nova data]
```

### Comportamento Esperado
Ao clicar no botão "Aceitar data", o sistema deveria:
1. Aceitar a data proposta pelo cliente
2. Mover os veículos do status "APROVAÇÃO NOVA DATA" para "AGUARDANDO APROVAÇÃO DA COLETA"
3. Retornar sucesso na operação

### Comportamento Atual
A API retorna erro informando que a precificação está ausente para o endereço, mesmo com o valor definido.

## Análise Técnica

### Fluxo da Funcionalidade

1. **Cliente propõe nova data**:
   - Cliente usa o `RescheduleModal` para propor nova data
   - Status dos veículos muda para "APROVAÇÃO NOVA DATA"

2. **Admin visualiza proposta**:
   - Componente `DatePendingUnifiedSection` exibe a proposta
   - Dados são carregados via `useClientOverview` hook
   - `buildRescheduleGroups` coleta dados de veículos com status "APROVAÇÃO NOVA DATA"

3. **Admin aceita proposta**:
   - Botão "Aceitar data" chama API `/api/admin/accept-client-proposed-date`
   - API verifica se existe `vehicle_collections` com fee e data para o endereço
   - Se não encontrar, retorna erro "Precificação ausente para este endereço"

### Código Envolvido

#### Frontend
- **Componente**: `modules/admin/components/overview/DatePendingUnifiedSection.tsx`
- **Hook**: `modules/admin/hooks/useClientOverview.ts`
- **Serviço**: `modules/admin/services/client-collections/groups/reschedule.ts`

#### Backend
- **API**: `app/api/(admin)/(collections)/admin/accept-client-proposed-date/route.ts`

### Diagnóstico do Problema

O problema provavelmente está na **diferença entre os labels de endereços** usados:

1. **Na construção dos grupos** (`reschedule.ts`):
   ```typescript
   const labels = Array.from(addrLabelMap.values()).filter(Boolean);
   // ...
   .in('collection_address', labels)
   ```

2. **Na API de aceitação** (`route.ts`):
   ```typescript
   const addressLabel = formatAddressLabel(addr);
   // ...
   .eq('collection_address', addressLabel)
   ```

### Possíveis Causas

1. **Formatação inconsistente de endereços**:
   - Diferença no formato do endereço entre o momento de exibição e aceitação
   - Problemas com acentuação, espaços ou case sensitivity

2. **Dados inconsistentes no banco**:
   - Registro de `vehicle_collections` com status diferente de "requested" ou "approved"
   - Dados desatualizados ou faltando

3. **Consulta mal formulada**:
   - Uso de `.eq()` ao invés de `.ilike()` para comparação de endereços
   - Problemas com normalização de strings

## Solução Proposta (Documentação)

### Para Desenvolvedores

1. **Diagnosticar a diferença de labels**:
   - Verificar exatamente qual label de endereço está sendo usado na interface
   - Comparar com o label usado na API de aceitação

2. **Verificar consistência dos dados**:
   - Confirmar que existem registros em `vehicle_collections` com:
     - Mesmo `client_id`
     - Mesmo `collection_address` (considerando formatação)
     - Status "requested" ou "approved"
     - `collection_fee_per_vehicle` definido

3. **Considerar normalização**:
   - Implementar uso de funções de normalização de endereços
   - Usar comparação case-insensitive quando apropriado

### Para Testes

1. **Reproduzir o cenário**:
   - Criar um cliente com veículos
   - Definir precificação para um endereço
   - Solicitar mudança de data pelo cliente
   - Tentar aceitar a data proposta como admin

2. **Verificar dados no banco**:
   - Consultar registros em `vehicle_collections` para o cliente/endereço
   - Confirmar status e valores definidos

## ✅ Status da Correção

**Data da correção**: 01/09/2025  
**Status**: **CORRIGIDO**

### 🔧 Correções Implementadas:

1. **✅ API `accept-client-proposed-date`**:
   - Busca aprimorada por precificação (sem dependência de data específica)
   - Fallback robusto com `ILIKE` para variações de endereço
   - Sincronização automática de datas quando necessário

2. **✅ API `propose-collection-date`**:
   - Sincronização bidirecional entre `vehicles` e `vehicle_collections`
   - Logs detalhados para debugging

3. **✅ API `collection-reschedule`** ⭐ **CORREÇÃO PRINCIPAL**:
   - **PRIORIZAÇÃO de registros com `collection_fee_per_vehicle > 0`** na busca
   - Busca por `updated_at` em vez de `created_at` para pegar registros mais recentes
   - Fallback para registros sem fee quando necessário
   - **Limpeza automática de registros duplicados sem fee**
   - Preservação garantida do `collection_fee_per_vehicle` existente
   - Logs detalhados para rastreamento

### 🎯 Problema Raiz Identificado:
- **Múltiplos registros de `vehicle_collections`** para o mesmo cliente/endereço
- Registro mais recente tinha `collection_fee_per_vehicle: null`
- Registro mais antigo tinha `collection_fee_per_vehicle: 8.99`
- **Lógica antiga pegava o mais recente (null)** ❌
- **Lógica nova prioriza o que tem fee válido** ✅

### 📊 Teste de Validação:
- Script `test-collection-logic.cjs` confirma que a correção funciona
- Lógica antiga: retornaria `fee: null` ❌
- Lógica nova: retorna `fee: 8.99` ✅

### Resultado:
🎯 **Admin consegue aceitar/rejeitar propostas de data sem erro "Precificação ausente"**
🧹 **Sistema limpa automaticamente registros duplicados sem fee**
📊 **Logs detalhados para monitoramento e debug**

---

## Prioridade

**~~Alta~~ RESOLVIDO** - ~~Bloqueia funcionalidade crítica do sistema~~

## Referências

- [Fluxo de Múltiplas Mudanças de Data](../business-flows/fluxo_multiplas_mudancas_data.md) - **NOVO** - Análise completa do cenário problemático
- [Diagramas Técnicos do Bug](../business-flows/diagramas_tecnicos_bug.md) - **NOVO** - Visualização técnica do problema  
- [Solução Proposta](../business-flows/solucao_bug_multiplas_mudancas.md) - **NOVO** - Correção detalhada do bug
- [Fluxo de Mudança de Data](../business-flows/fluxo_mudanca_data.md) - Fluxo original (parcial)
- [Documentação de Componentes do Administrador](../development/componentes_cliente.md)