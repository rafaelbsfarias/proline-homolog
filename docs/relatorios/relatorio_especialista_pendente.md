# Relatório de Features Pendentes - Dashboard do Especialista

Este relatório detalha o status de implementação das funcionalidades para o perfil de Especialista/Operador, com base na análise do código-fonte e nas User Stories (US) fornecidas.

## Perfil: Especialista/Operador (MVP)

### US-020: Visualizar Clientes Associados
*   **Descrição:** Como Especialista, eu quero visualizar uma lista de todos os clientes que me foram associados, para saber quais clientes devo atender.
*   **Status:** ✅ RESOLVIDO
    *   **Análise:** O `SpecialistDashboard.tsx` utiliza o hook `useSpecialistClients`, que por sua vez chama a API `/api/specialist/my-clients`. Esta API busca e exibe os clientes associados ao especialista, incluindo a contagem de veículos, conforme esperado.

### US-021: Visualizar Veículos do Cliente
*   **Descrição:** Como Especialista, ao selecionar um cliente, eu quero visualizar todos os veículos associados a ele, para ter o contexto completo antes de iniciar a inspeção.
*   **Status:** ✅ RESOLVIDO
    *   **Análise:** O `SpecialistDashboard.tsx` integra o hook `useClientVehicles`, que faz chamadas à API `/api/specialist/client-vehicles?clientId=...`. Esta funcionalidade permite que o especialista visualize os veículos de um cliente selecionado.

### US-022: Realizar Checklist de Inspeção
*   **Descrição:** Como Especialista, eu quero realizar um checklist detalhado do veículo, registrando o estado de diversos itens (pneus, freios, fluidos, etc.), para documentar a inspeção.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** A interface para o checklist (`VehicleChecklistModal.tsx`) está implementada, permitindo o registro de dados como data, quilometragem, nível de combustível e o status de diversos componentes do veículo. No entanto, a função `handleSubmit` no modal salva os dados do checklist **apenas localmente** (no `localStorage`) e não os persiste em um banco de dados backend. A persistência dos dados do checklist é crucial para esta US.

### US-023: Sinalizar Serviços Necessários
*   **Descrição:** Como Especialista, durante o checklist, eu quero poder sinalizar quais serviços são necessários para o veículo (mecânica, funilaria, lavagem, pneus), para que o sistema possa gerar orçamentos.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** A funcionalidade de sinalização de serviços necessários está presente na interface do checklist (`ServiceCategoryField.tsx` dentro de `VehicleChecklistModal.tsx`). Contudo, como os dados do checklist não são persistidos no backend, essa sinalização também não é armazenada de forma duradoura ou utilizada para gerar orçamentos.

### US-024: Anexar Fotos à Inspeção
*   **Descrição:** Como Especialista, eu quero anexar fotos ao checklist de inspeção, para comprovar o estado do veículo e os serviços necessários.
*   **Status:** ✅ RESOLVIDO
    *   **Análise:** O `VehicleChecklistModal.tsx` utiliza o hook `useImageUploader`, que permite a seleção, pré-visualização e upload de imagens para o bucket `vehicle-media` no Supabase Storage. Os caminhos das imagens são armazenados localmente no objeto do checklist.

### US-025: Visualizar Histórico de Inspeções
*   **Descrição:** Como Especialista, eu quero visualizar o histórico de inspeções de um veículo, para acompanhar sua manutenção ao longo do tempo.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** Atualmente, os dados do checklist são salvos apenas no `localStorage` do navegador. Não há funcionalidade implementada para recuperar ou exibir um histórico de inspeções de um armazenamento persistente (banco de dados).

### US-026: Filtrar Veículos por Placa/Status
*   **Descrição:** Como Especialista, eu quero filtrar a lista de veículos por placa ou status (ex: aguardando inspeção, em serviço), para encontrar rapidamente o veículo desejado.
*   **Status:** ✅ RESOLVIDO
    *   **Análise:** O `SpecialistDashboard.tsx` implementa a funcionalidade de filtragem local dos veículos exibidos por placa e status, conforme a descrição da US.

## Perfil: Especialista/Operador (Futuro)

### US-027: Receber Notificações de Novas Associações
*   **Descrição:** Como Especialista, eu quero receber notificações quando um novo cliente ou veículo for associado a mim, para me manter atualizado.
*   **Status:** ⏳ PENDENTE (Futuro)
    *   **Análise:** Não há um sistema de notificação explícito implementado no código para alertar o especialista sobre novas associações de clientes ou veículos.

### US-028: Gerenciar Agenda de Inspeções
*   **Descrição:** Como Especialista, eu quero ter uma agenda para gerenciar minhas inspeções diárias, visualizando horários e locais.
*   **Status:** ⏳ PENDENTE (Futuro)
    *   **Análise:** Não foi encontrado código relacionado à gestão de uma agenda de inspeções ou agendamento de horários.

### US-029: Acompanhar Status de Orçamentos
*   **Descrição:** Como Especialista, eu quero acompanhar o status dos orçamentos gerados a partir dos meus checklists, para saber se o serviço foi aprovado.
*   **Status:** ⏳ PENDENTE (Futuro)
    *   **Análise:** Como os dados do checklist não são persistidos e integrados a um sistema de orçamentos, não há funcionalidade para o especialista acompanhar o status dos orçamentos gerados.
