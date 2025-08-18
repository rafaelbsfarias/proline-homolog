# Relatório de Features Pendentes - Dashboard do Parceiro

Este relatório detalha o status de implementação das funcionalidades para o perfil de Parceiro (antigo Fornecedor), com base na análise do código-fonte e nas User Stories (US) fornecidas.

## Perfil: Fornecedor (MVP)

### US-012: Receber Solicitações de Serviço
*   **Descrição:** Como Fornecedor, eu quero receber as solicitações de serviço para os veículos, para iniciar o processo de orçamento.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** O `PartnerDashboard.tsx` exibe dados mockados para "Solicitações Pendentes". Não há uma API ou serviço visível que implemente o recebimento real dessas solicitações de outras partes do sistema (ex: de um especialista ou administrador).

### US-013: Enviar Orçamento Detalhado
*   **Descrição:** Como Fornecedor, eu quero poder enviar um orçamento detalhado, incluindo valor, descritivo dos serviços e uma data de entrega específica.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** Existe uma funcionalidade para "Adicionar Serviço" (`ServiceModal.tsx` que chama `/api/partner/services`), que permite cadastrar nome, descrição, dias estimados e preço. No entanto, isso parece ser para o cadastro de serviços próprios do parceiro, e não para o envio de um orçamento detalhado em resposta a uma solicitação específica. A US implica um processo de orçamentação mais complexo.

### US-014: Atualizar Status do Serviço
*   **Descrição:** Como Fornecedor, eu quero poder atualizar o status dos serviços que estou realizando (em andamento, concluído), para manter o sistema atualizado.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** O `PartnerDashboard.tsx` exibe uma tabela de "Serviços em Andamento" com dados mockados. Não há mecanismos explícitos (botões, APIs) para o parceiro atualizar o status desses serviços no sistema.

### US-015: Visualizar Carros Atrasados
*   **Descrição:** Como Fornecedor, eu quero que os carros com entrega atrasada sejam destacados visualmente no meu painel, para priorizar e gerenciar minhas tarefas.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** O `PartnerDashboard.tsx` exibe listas de serviços, mas não há lógica implementada para identificar ou destacar visualmente veículos com entrega atrasada.

### US-016: Cadastrar Tabela de Preços
*   **Descrição:** Como Fornecedor, eu quero ter uma tela para cadastrar e gerenciar minha tabela de preços de serviços, para agilizar a criação de orçamentos.
*   **Status:** ✅ RESOLVIDO (Parcialmente)
    *   **Análise:** A funcionalidade de "Adicionar Serviço" (`ServiceModal.tsx`) permite o cadastro individual de serviços com preço. Além disso, existe uma funcionalidade de importação de CSV (`/api/partner/services/import-csv`), que pode ser usada para carregar múltiplos serviços. No entanto, não há uma interface dedicada para "gerenciar uma tabela de preços" de forma estruturada, como uma UI para edição em massa ou visualização de tabela.

### US-019: Atualizar Dados
*   **Descrição:** Como Fornecedor, eu quero atualizar meus dados cadastrais.
*   **Status:** ⏳ PENDENTE
    *   **Análise:** Não foi encontrada nenhuma interface de usuário ou API específica que permita ao próprio parceiro atualizar seus dados cadastrais. A funcionalidade `EditUserModal.tsx` é para uso exclusivo do administrador.

## Perfil: Fornecedor (Futuro)

### US-017: Acompanhar Pagamentos de Taxas
*   **Descrição:** Como Fornecedor, eu quero acompanhar os pagamentos das taxas que devo ao sistema por carro processado, para ter controle financeiro.
*   **Status:** ⏳ PENDENTE (Futuro)
    *   **Análise:** Não foi encontrado código relacionado ao acompanhamento ou gestão de pagamentos de taxas por parte do parceiro.

### US-030: Visualizar Relatório de Taxas
*   **Descrição:** Como Fornecedor, eu quero poder visualizar um relatório das taxas que devo à plataforma por cada serviço realizado, para ter controle financeiro.
*   **Status:** ⏳ PENDENTE (Futuro)
    *   **Análise:** Não foi encontrado código relacionado à geração ou visualização de relatórios de taxas para o parceiro.
