# Dados e Tabelas Atuais

Resumo do estado de dados com foco nas entidades usadas no checklist por parceiro.

## Entidades/Fontes Observadas

- `mechanics_checklist` e derivados (legado mecânica)
  - Itens e evidências sem coluna `partner_id`.
  - Associação a veículo e (possivelmente) `quote_id`/`inspection_id`.
- Checklists Dinâmicos (parceiros)
  - Serviços de carregamento/salvamento escopados por `partner_id` (no nível de serviço/rota).
  - Items/Evidences podem ser mapeados por `item_key` quando `checklist_item_id` não está
    disponível.
- Anomalias
  - Endpoint de load/save com escopo por parceiro; pode derivar de itens NOK.
- Categorias
  - Agregadas de múltiplas fontes (quotes/service_orders/service_categories) para listar combinações
    `categoria • parceiro`.

## Problemas/Lacunas

- Ausência de `partner_id` em itens/evidências de mecânica dificulta isolamento total.
- Contexto duplicado (`quote_id` e `inspection_id`) sem normalização causa regras ad-hoc.
- Dependência de `item_key` para mapear evidências quando falta `checklist_item_id`.

## Efeitos Práticos

- Isolamento por parceiro para mecânica depende do cabeçalho (dono do checklist) e não dos
  itens/evidências em si.
- Conflitos podem ocorrer ao tentar separar dados de mecânica por parceiro nas tabelas atuais.
