# Relatório de Funcionalidades Pendentes do Administrador

Este relatório detalha as funcionalidades pendentes para o perfil de Administrador, com base nas Histórias de Usuário (US) definidas em `docs/projeto/user_stories_atualizado.md` e informações adicionais extraídas de `docs/projeto/audio.txt`.

## MVP (Produto Mínimo Viável) - Funcionalidades a serem implementadas:

*   **US-018: Aprovar Recomendações e Orçamentos**
    *   **Descrição:** Como Administrador, eu quero poder aprovar os orçamentos dos fornecedores antes de enviar ao cliente e ter a opção de alterar a classificação (Atacado/Varejo).
    *   **Status Atual:** ⏳ PENDENTE.
    *   **Observação:** A aprovação de registros de clientes está implementada, mas a aprovação de recomendações e orçamentos de fornecedores ainda não está. A funcionalidade de alterar classificação (Atacado/Varejo) também está pendente.
    *   **Referência Audio.txt:** "aprovar as tabelas para poder ter o preço dele ali", "o cliente já tá aqui, analisar e aprovar a proposta", "eu aí tiro um serviço, tiro outro", "eu consigo transformar um carro de atacado pra varejo", "o cliente vai ver aqui ó, ele já pode mandar pra atacado, reprova tudo e manda pra atacado ou ele vai lá e faz aqui, confirma a aprovação."

*   **US-019: Gerenciar Status Geral dos Carros**
    *   **Descrição:** Como Administrador, eu quero ter uma visão geral e poder gerenciar o status de todos os carros no sistema, para monitorar o fluxo de trabalho.
    *   **Status Atual:** ⏳ PENDENTE.
    *   **Observação:** Uma visão geral e gerenciamento de status de todos os carros no sistema ainda não está explicitamente implementada.
    *   **Referência Audio.txt:** "Gerenciar Status Geral dos Carros", "o carro está atrasado, ficar lá vermelho, ficar lá avisando que ele está atrasado naquele carro".

*   **US-031: Filtrar Lista de Carros**
    *   **Descrição:** Como Administrador, eu quero poder filtrar a lista de carros que estou como responsável (ex: por status, por data), para encontrar rapidamente os veículos que precisam de atenção.
    *   **Status Atual:** ⏳ PENDENTE.
    *   **Observação:** A funcionalidade de filtrar a lista de carros no painel administrativo ainda não está implementada.
    *   **Referência Audio.txt:** "em cima dessa linha de carros, é bom ter uns filtros, entendeu? Todos os carros de tempo a tempo, só os carros que não estão prontos, você poder filtrar nessa fila de carro que vai aparecer aí".

## Futuro - Funcionalidades a serem implementadas:

*   **US-020: Gerar Relatório de Peças para Compra**
    *   **Descrição:** Como Administrador, eu quero um relatório que liste as peças necessárias para compra com base nos serviços aprovados, para otimizar o processo de aquisição.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "gerar uma lista para mim do que eu tenho que comprar naquele dia", "Seria de todas as relações de peças que você vai precisar comprar a partir do momento do aceite do cliente."

*   **US-021: Marcar Peças como Compradas**
    *   **Descrição:** Como Administrador, eu quero poder marcar as peças do relatório como "compradas", para controlar o estoque e o andamento das aquisições.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "eu clique para dizer que já comprei e fique postando que está pendente o que não comprou", "Quando eu clique e que eu possa botar, depois que eu já comprei as peças, entendeu? Que eu tique para dizer que está comprado."

*   **US-025: Integração com Pagamentos**
    *   **Descrição:** Como Administrador, eu quero que a plataforma possa emitir boletos e processar pagamentos com cartão, para automatizar o processo financeiro.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "plataforma emita um boleto, ou pagar com cartão", "A parte de cobrança já seria integrado na plataforma."

*   **US-026: Integração com Marketplace de Peças**
    *   **Descrição:** Como Administrador, eu quero que o sistema possa se integrar com marketplaces (ex: Mercado Livre) para automatizar a compra de peças, otimizando o tempo e custo.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "conseguir integrar isso no mercado livre", "Já preparar minha compra lá no mercado livre e automatizar isso".

*   **US-028: Métricas de Produtividade**
    *   **Descrição:** Como Administrador, eu quero ter acesso a métricas de produtividade (tempo médio do carro no processo, carros atrasados), para identificar gargalos e otimizar a operação.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "métricas de produtividade também", "o médio que o carro ficou lá", "tem que aparecer para o fornecedor, na linha dele, quando o carro está atrasado, ficar lá vermelho, ficar lá avisando que ele está atrasado naquele carro".

*   **US-029: Funcionalidade de Venda de Carros**
    *   **Descrição:** Como Administrador, eu quero poder listar carros para venda no portal Proline, para expandir o negócio para um marketplace de veículos.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "ele já pode botar o carro pra vender aqui também", "a ideia é que a plataforma expanda pra também ser uma plataforma de venda."

*   **US-022: Gerar Lista de Faturamento**
    *   **Descrição:** Como Administrador, eu quero uma lista do que precisa ser faturado (para o financeiro), para garantir a emissão correta das faturas.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "lista do que é para faturar", "O financeiro tem que faturar e ele já faturar."

*   **US-023: Acompanhar Taxas de Fornecedores**
    *   **Descrição:** Como Administrador, eu quero acompanhar as taxas que os fornecedores devem ao sistema por carro, para gerenciar a receita.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "quanto é que eu vou pagar para poder ter esse relatório de quanto o cara me deve cada mês", "Cada carro que eu mando para ele, ele vai me pagar uma taxa."

*   **US-024: Dashboard de Relatórios**
    *   **Descrição:** Como Administrador, eu quero um dashboard com relatórios básicos (carros por mês, proporção atacado/varejo, tempo médio), para ter insights sobre a operação.
    *   **Status Atual:** ⏳ PENDENTE (Futuro).
    *   **Referência Audio.txt:** "dashboardzinho com uma série de relatórios", "os carros que fez no mês, vai poder ser aumentando por mês", "quantos você mandou para a loja de atacar e de varejo, entendeu? Essa proporção."
