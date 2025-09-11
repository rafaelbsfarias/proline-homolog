# Relação entre Fluxos de Serviço e Componentes

## 1. Visão Geral

Este documento estabelece a relação entre os fluxos de serviço documentados e os componentes implementados no sistema ProLine Hub, tanto do lado do cliente quanto do administrador.

## 2. Fluxo de Aprovação de Coleta

### 2.1 Diagrama do Fluxo
![Fluxo de Aprovação](../fluxos_de_servico/fluxo_aprovacao.md)

### 2.2 Componentes Envolvidos

#### Cliente
- **PendingDefinitionSection.tsx**
  - Responsável por: "Associar ponto de coleta e data preferencial"
  - Status afetado: "Ponto de coleta selecionado"

- **PendingApprovalSection.tsx**
  - Responsável por: "Aprovar proposta de coleta"
  - Status afetado: "Coleta aprovada"

#### Administrador
- **CollectionPricingSection.tsx**
  - Responsável por: "Definir valor da coleta por veículo"
  - Status afetado: "Aguardando aprovação da coleta"

### 2.3 Hooks Utilizados
- `usePendingDefinitionVehicles` - para gerenciar veículos em definição
- `usePendingApprovalVehicles` - para gerenciar propostas de coleta
- `useClientOverview` - para obter dados gerais do cliente

## 3. Fluxo de Mudança de Data da Coleta

### 3.1 Diagrama do Fluxo
![Fluxo de Mudança de Data](../fluxos_de_servico/fluxo_mudanca_data.md)

### 3.2 Componentes Envolvidos

#### Cliente
- **PendingApprovalSection.tsx**
  - Responsável por: "Aceitar ou rejeitar nova data proposta"
  - Status afetado: 
    - Aceitação: "Ponto de coleta selecionado" (com data confirmada)
    - Rejeição: "Aguardando definição de coleta"

#### Administrador
- **CollectionPricingSection.tsx**
  - Responsável por: "Propor nova data de coleta"
  - Status afetado: "Aguardando aprovação de nova data"

### 3.3 Componentes Pendentes
- **RescheduleModal.tsx** (ainda não implementado)
  - Deverá ser acionado para tratar a solicitação de mudança de data

### 3.4 Hooks Utilizados
- `usePendingApprovalVehicles` - para gerenciar propostas com data a ser reagendada
- `useClientOverview` - para obter dados gerais do cliente

## 4. Fluxo de Rejeição de Coleta

### 4.1 Diagrama do Fluxo
![Fluxo de Rejeição](../fluxos_de_servico/fluxo_rejeicao.md)

### 4.2 Componentes Envolvidos

#### Cliente
- **PendingApprovalSection.tsx**
  - Responsável por: "Reprovar a proposta de coleta"
  - Status afetado: "Coleta Rejeitada"

#### Administrador
- **CollectionPricingSection.tsx**
  - Responsável por: "Definir valor da coleta por veículo"
  - Status afetado: "Aguardando aprovação da coleta"

### 4.3 Componentes Pendentes
- **RejectionModal.tsx** (ainda não implementado)
  - Deverá ser acionado para tratar a rejeição da coleta
  - Responsável por: "Exibir modal 'Deseja levar ao pátio ProLine?'"

### 4.4 Hooks Utilizados
- `usePendingApprovalVehicles` - para gerenciar propostas rejeitadas
- `useClientOverview` - para obter dados gerais do cliente

## 5. Mapeamento de Status por Componente

### 5.1 Cliente - PendingDefinitionSection
- **Status gerenciado**: "Aguardando definição de coleta"
- **Ações possíveis**:
  - Selecionar ponto de coleta → "Ponto de coleta selecionado"
  - Agendar entrega no pátio → "Aguardando entrega do veículo"

### 5.2 Cliente - PendingApprovalSection
- **Status gerenciado**: "Aguardando aprovação da coleta"
- **Ações possíveis**:
  - Aprovar coleta → "Coleta aprovada"
  - Rejeitar coleta → "Coleta Rejeitada"
  - Solicitar mudança de data → "Aguardando aprovação de nova data"

### 5.3 Administrador - CollectionPricingSection
- **Status gerenciado**: "Ponto de coleta selecionado"
- **Ações possíveis**:
  - Definir valor e data → "Aguardando aprovação da coleta"
  - Propor nova data → "Aguardando aprovação de nova data"

### 5.4 Administrador - PendingApprovalSection
- **Status gerenciado**: "Coleta aprovada"
- **Ações possíveis**:
  - (Nenhuma ação necessária - status avança automaticamente para "Aguardando coleta")

### 5.5 Administrador - ApprovedCollectionSection
- **Status gerenciado**: "Aguardando coleta"
- **Ações possíveis**:
  - Confirmar entrega do veículo → "Entrega confirmada"

## 6. Considerações sobre Integração

### 6.1 Fluxos Completos
- O fluxo de aprovação está parcialmente implementado
- A integração entre componentes cliente e administrador está funcionando

### 6.2 Fluxos Pendentes
- O fluxo de mudança de data ainda precisa do RescheduleModal
- O fluxo de rejeição ainda precisa do RejectionModal
- A confirmação de pagamento foi removida do fluxo atual

### 6.3 Próximos Passos
1. Implementar os modais pendentes (RejectionModal e RescheduleModal)
2. Finalizar as ações nos componentes de aprovação
3. Validar a integração completa entre todos os componentes
4. Realizar testes de ponta a ponta dos fluxos

## 7. Conclusão

A estrutura de componentes criada está alinhada com os fluxos de serviço documentados. A refatoração permitiu uma separação clara de responsabilidades entre os diferentes atores do sistema (cliente e administrador) e facilitará a implementação completa dos fluxos pendentes.