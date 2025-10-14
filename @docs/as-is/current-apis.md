# Endpoints Atuais e Comportamento

Lista dos endpoints presentes/observados e como se comportam hoje.

## Parceiro (edição)

- `POST /api/partner/checklist/load`
  - Escopo por `partner_id`; aceita `inspection_id` e `quote_id` opcionais.
  - Retorna checklist do parceiro, itens e evidências (mapeadas por `item_key` quando necessário).
- `GET /api/partner/checklist/load-anomalies`
  - Retorna anomalias do parceiro (filtro por `vehicle_id`, `inspection_id`, `quote_id`).
- `POST /api/partner/checklist/save-anomalies`
  - Deleta e insere anomalias do parceiro (escopo por `partner_id`).
- `PUT /api/partner/checklist/submit`
  - Submete checklist (para mecânica, parte da segmentação por parceiro pode falhar se a tabela não
    suportar `partner_id`).

## Visualização (somente leitura)

- `GET /api/checklist/categories`
  - Consolida botões por `categoria • parceiro` a partir de múltiplas fontes; inclui casos só com
    `quote_id`.
- `GET /api/checklist/view`
  - Aceita `partner_id` e `category`; retorna checklist/itens/evidências corretos para exibir no
    viewer.

## Observações de Erro

- Evidências com `media_url` vazio agora são filtradas no frontend para evitar `img src` vazio.
- Falta de `partner_id` em tabelas de mecânica pode gerar erro ao tentar filtrar/atualizar por
  parceiro.
