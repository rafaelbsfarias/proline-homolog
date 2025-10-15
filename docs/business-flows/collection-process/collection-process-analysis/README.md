# Análise do Fluxo de Coleta — Mudanças Sucessivas de Data

Este conjunto de documentos mapeia, de ponta a ponta, o fluxo de definição e alteração de datas de coleta (incluindo propostas do Admin, reprogramações do Cliente e aceitações), os arquivos do código envolvidos e as tabelas afetadas. O foco é esclarecer como garantir consistência quando há mudanças sucessivas de data para o mesmo endereço.

- Público-alvo: Devs/Admins que precisam entender ou diagnosticar o fluxo.
- Escopo: APIs, serviços, componentes e esquema de dados relacionados a coleta e histórico.

Conteúdo
- entidades.md — Tabelas, chaves e gatilhos
- api-routes.md — Endpoints envolvidos e seus efeitos
- services-and-ui.md — Serviços e telas que consomem/mostram o fluxo
- flow-scenarios.md — Cenários de mudança sucessiva e transições de status
- logging-and-observability.md — Logs e pontos de inspeção

Glossário rápido
- “Coleção”: registro em `vehicle_collections` que representa o agrupamento de veículos para um cliente, em um endereço específico, numa data específica, com a taxa (fee) aplicada.
- “Histórico”: linhas em `collection_history` (imutáveis) geradas na aprovação (APPROVED) de uma coleção.

