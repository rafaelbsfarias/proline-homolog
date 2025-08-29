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

## Impacto

- Administradores não conseguem aceitar datas propostas por clientes
- Fluxo de mudança de data fica incompleto
- Clientes ficam impedidos de prosseguir com o processo de coleta

## Prioridade

**Alta** - Bloqueia funcionalidade crítica do sistema

## Referências

- [Fluxo de Mudança de Data](../../fluxos_de_servico/fluxo_mudanca_data.md)
- [Documentação de Componentes do Administrador](../refatoracao/componentes_admin.md)