# Componentes do Cliente - Refatoração

## 1. Visão Geral

Este documento descreve a nova arquitetura de componentes para o contexto do cliente, conforme definido no plano de refatoração. O objetivo é substituir os componentes antigos `VehicleCollectionSection` e `VehicleCollectionControls` por uma estrutura modular mais clara e coesa.

**Status da Implementação**: Em andamento - alguns componentes já foram criados e integrados parcialmente.

## 2. Estrutura de Componentes

### 2.1 Nova Estrutura de Pastas

```
modules/
└── client/
    ├── components/
    │   └── collection/
    │       ├── PendingDefinitionSection.tsx
    │       ├── PendingApprovalSection.tsx
    │       ├── RejectionModal.tsx (ainda não implementado)
    │       ├── RescheduleModal.tsx (ainda não implementado)
    │       └── collection.module.css
    └── hooks/
        ├── usePendingDefinitionVehicles.ts
        └── usePendingApprovalVehicles.ts
```

### 2.2 Componentes Principais

#### 2.2.1 PendingDefinitionSection.tsx

**Responsabilidade**: Substituir o antigo `VehicleCollectionControls`. 
Permite ao cliente definir métodos de coleta para veículos no status "Aguardando definição de coleta".

**Status da Implementação**: Parcialmente implementado
- Componente básico criado
- Integração com `usePendingDefinitionVehicles` hook realizada
- UI funcional para seleção de veículos e definição de método de coleta
- Integração com ToastProvider para feedback ao usuário

**Funcionalidades Implementadas**:
- Listar veículos que precisam de definição de coleta
- Permitir seleção individual ou em massa de veículos
- Oferecer duas opções de ação:
  1. Selecionar ponto de coleta
  2. Agendar entrega no pátio ProLine
- Integrar com `usePendingDefinitionVehicles` hook
- Feedback visual durante operações

#### 2.2.2 PendingApprovalSection.tsx

**Responsabilidade**: Substituir o antigo `VehicleCollectionSection`.
Exibe as propostas de coleta enviadas pelo administrador para aprovação do cliente.

**Status da Implementação**: Parcialmente implementado
- Componente básico criado
- Integração com `usePendingApprovalVehicles` hook realizada
- UI funcional para exibição de propostas
- Ações básicas de aprovar/rejeitar ainda precisam de refinamento

**Funcionalidades Implementadas**:
- Listar grupos de veículos com propostas de coleta
- Exibir detalhes das propostas (valores, datas, endereços)
- Integrar com `usePendingApprovalVehicles` hook

**Funcionalidades Pendentes**:
- Implementação completa das ações de aprovar/rejeitar
- Integração com modais de interação (RejectionModal e RescheduleModal)

#### 2.2.3 RejectionModal.tsx

**Responsabilidade**: Modal independente para tratamento de rejeição de coletas.

**Status da Implementação**: Ainda não implementado

**Funcionalidades Planejadas**:
- Exibir detalhes da proposta rejeitada
- Oferecer opção de levar veículo ao pátio ProLine
- Permitir agendamento de data de entrega
- Integrar com fluxo de rejeição do `usePendingApprovalVehicles`

#### 2.2.4 RescheduleModal.tsx

**Responsabilidade**: Modal independente para tratamento de solicitações de mudança de data.

**Status da Implementação**: Ainda não implementado

**Funcionalidades Planejadas**:
- Exibir data proposta pelo administrador
- Permitir cliente sugerir nova data
- Integrar com fluxo de reagendamento do `usePendingApprovalVehicles`

## 3. Hooks Customizados

### 3.1 usePendingDefinitionVehicles.ts

**Responsabilidade**: Gerenciar veículos com status "Aguardando definição de coleta".

**Status da Implementação**: Implementado
- Busca veículos com status apropriado via API
- Gerencia estados de loading e erro
- Fornece função `setCollectionMethod` para definir método de coleta
- Atualiza lista após ações do usuário

### 3.2 usePendingApprovalVehicles.ts

**Responsabilidade**: Gerenciar veículos com status "Aguardando aprovação da coleta".

**Status da Implementação**: Implementado
- Busca grupos de veículos com propostas de coleta
- Gerencia estados de loading e erro
- Fornece funções para:
  - `handleApprove`: Aprovar coleta
  - `handleReject`: Rejeitar coleta
  - `handleReschedule`: Solicitar mudança de data
- Atualiza lista após ações do usuário

## 4. Integração com ClientDashboard.tsx

**Status da Implementação**: Parcialmente integrado
- `PendingDefinitionSection` e `PendingApprovalSection` já estão sendo renderizados
- Integração condicional baseada na existência de dados ainda precisa ser refinada

## 5. Benefícios da Nova Arquitetura

1. **Separação clara de responsabilidades**: Cada componente tem uma função específica
2. **Melhor manutenibilidade**: Componentes menores e mais focados
3. **Facilidade de testes**: Cada parte pode ser testada isoladamente
4. **Reusabilidade**: Componentes modais podem ser usados em outros contextos
5. **Escalabilidade**: Fácil adicionar novos fluxos ou estados
6. **Melhor experiência do usuário**: Interface mais coesa e intuitiva

## 6. Considerações Técnicas

- Todos os componentes seguem o padrão de composição
- Hooks customizados centralizam a lógica de dados e estado
- Componentes de UI são responsivos e acessíveis
- Estados de loading e erro são tratados adequadamente
- Integração com sistema de notificações (ToastProvider) para feedback ao usuário

## 7. Próximos Passos

1. Finalizar implementação dos modais `RejectionModal` e `RescheduleModal`
2. Completar as funcionalidades de ação na `PendingApprovalSection`
3. Refinar a integração condicional no `ClientDashboard`
4. Realizar testes completos de integração
5. Ajustar UI/UX com base no feedback dos usuários