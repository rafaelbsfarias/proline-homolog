# Relatório de Funcionalidades Pendentes do Dashboard do Cliente

Este relatório detalha o status das funcionalidades pendentes para o perfil de Cliente, com base nas Histórias de Usuário (US) definidas em `docs/projeto/user_stories_atualizado.md` e na análise do código-fonte (`@app/**`, `@modules/**`, `@lib/**`).

## Perfil: Cliente (MVP)

*   **US-007: Visualizar Recomendações de Serviço**
    *   **Descrição:** Como Cliente, eu quero visualizar os serviços recomendados para o meu veículo, para entender o escopo do trabalho.
    *   **Status:** ⏳ **PENDENTE**
    *   **Análise:** Não foram encontrados componentes ou lógica explícita no código (`ClientDashboard.tsx`, APIs relacionadas) que permitam ao cliente visualizar recomendações de serviço. O dashboard atual foca no cadastro de veículos e aceitação de contrato.

*   **US-008: Aprovar/Reprovar Serviços**
    *   **Descrição:** Como Cliente, eu quero poder aprovar ou reprovar os serviços recomendados e, em caso de reprovação total, ter a opção de enviar o carro para o **Atacado**.
    *   **Status:** ⏳ **PENDENTE**
    *   **Análise:** Não há indícios no código de funcionalidades para aprovação ou reprovação de serviços por parte do cliente, nem a opção de enviar o veículo para "Atacado". Esta funcionalidade está diretamente ligada à US-007.

*   **US-009: Acompanhar Status do Meu Carro**
    *   **Descrição:** Como Cliente, eu quero visualizar o status do meu carro (em preparação, aguardando entrega, finalizado, etc.), para saber o andamento do serviço.
    *   **Status:** ✅ **RESOLVIDO (Parcialmente)**
    *   **Análise:** O `ClientDashboard.tsx` utiliza o `VehicleCounter.tsx`, que busca e exibe a contagem de veículos e uma lista básica com `status` do veículo. Isso permite um acompanhamento básico. No entanto, a granularidade de status como "em preparação", "aguardando entrega", "finalizado" e a lógica para transição entre eles não são totalmente claras ou implementadas em detalhes visíveis no código fornecido para o cliente.

*   **US-010: Solicitar Entrega ou Retirada**
    *   **Descrição:** Como Cliente, eu quero poder solicitar a entrega do meu veículo em um local específico ou indicar que farei a retirada, para conveniência.
    *   **Status:** ⏳ **PENDENTE**
    *   **Análise:** Não foram encontrados componentes de UI ou chamadas de API no `ClientDashboard.tsx` ou em módulos relacionados que implementem a funcionalidade de solicitar entrega ou retirada do veículo.

*   **US-011: Acessar Relatórios de Carros**
    *   **Descrição:** Como Cliente, eu quero acessar relatórios básicos sobre os carros que enviei (lista de carros, tempo médio de serviço), para ter um histórico e controle.
    *   **Status:** ⏳ **PENDENTE (Parcialmente)**
    *   **Análise:** O `VehicleCounter.tsx` exibe uma lista dos veículos cadastrados pelo cliente, o que atende à parte de "lista de carros". No entanto, não há funcionalidades visíveis para "tempo médio de serviço" ou outros "relatórios básicos" mais elaborados.

*   **US-012: Cadastro**
    *   **Descrição:** Como Cliente, eu quero acessar relatórios básicos sobre os carros que enviei (lista de carros, tempo médio de serviço), para ter um histórico e controle.
    *   **Status:** ✅ **RESOLVIDO (Parcialmente)**
    *   **Análise:** Esta US tem uma descrição que se sobrepõe à US-011. Assumindo que a US-012 se refere ao processo de cadastro do cliente em si: o cadastro de clientes via auto-registro (`/cadastro`) está implementado e funcional (US-101). A parte de "acessar relatórios básicos" é a mesma pendência da US-011.

*   **US-018: Atualizar Dados**
    *   **Descrição:** Como Cliente, eu quero atualizar meus dados cadastrais.
    *   **Status:** ⏳ **PENDENTE**
    *   **Análise:** Não foram encontrados componentes de UI ou APIs que permitam ao cliente atualizar seus próprios dados cadastrais no dashboard. O `EditUserModal.tsx` e a API `edit-user` são para uso administrativo.

## Resumo Geral das Pendências do Cliente

O dashboard do cliente possui a base para o gerenciamento de veículos (cadastro e visualização básica), mas as funcionalidades relacionadas à interação com serviços (recomendações, aprovação/reprovação), logística (entrega/retirada), relatórios detalhados e atualização de perfil ainda precisam ser desenvolvidas.

---
*Gerado por Gemini CLI em 15 de agosto de 2025.*