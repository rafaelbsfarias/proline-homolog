# Logging e Observabilidade — Onde Inspecionar Decisões do Fluxo

Este guia concentra os principais loggers e mensagens úteis para diagnosticar mudanças sucessivas de data e seleção de fee.

## Principais canais de log
- Admin — Propor nova data:
  - Logger: `api:admin:propose-collection-date`
  - Arquivo: `app/api/(admin)/(collections)/admin/propose-collection-date/route.ts`
  - Mensagens úteis:
    - `propose_collection_date_start`, `propose_collection_date_params`
    - `address_found` (label normalizado do endereço)
    - `propose_date_fee_selection` (estratégia: `approved` vs `non_zero` vs `none`)
    - `propose_date_upsert_success` (resultado do upsert)
    - `link_vehicles_to_collection_success|failed`
    - `vehicle_date_sync_success|failed`
    - `propose_collection_date_context` (inicial vs resposta a cliente)
    - `vehicle_update_attempt` (status antigo/novo, erro de update)

- Cliente — Remarcar data:
  - Logger: `api:client:collection-reschedule`
  - Arquivo: `app/api/client/collection-reschedule/route.ts`
  - Mensagens úteis:
    - `no_fee_found_trying_without_fee_filter`
    - `fallback_collection_found`
    - `trying_ilike_search` / `ilike_search_success`
    - `collection_reschedule_sync_start`
    - `collection_date_synchronized` (update com fee preservado)
    - `duplicate_collections_cleaned` (limpeza de duplicados sem fee)
    - `new_collection_created` / `link_vehicles_success_new`

- Cliente — Aceitar proposta:
  - Logger: `api:client:collection-accept-proposal`
  - Arquivo: `app/api/client/collection-accept-proposal/route.ts`
  - Mensagens úteis:
    - `accept-admin-proposal-failed` (etapa 1)
    - `accept-final-approval-failed` (etapa 2)
    - `link_vehicles_on_approve_failed`
    - `approve-collection-by-date-failed`

- Admin — Grupos e histórico:
  - Logger: `api:admin:client-collections-summary`
  - Serviços:
    - Pricing: `svc:admin:collections:pricing` — `fee_rows_loaded`, `latest_row_by_addr`, `pricing_result_summary`
    - Enriquecimento: erros são `history_enrich_failed`

## Diagnóstico rápido
- Fee “sumiu” após remarcar: conferir `propose_date_fee_selection` e o bloco de fallback no reschedule (`fallback_collection_found`, `ilike_search_success`).
- Histórico duplicado: validar chaves `(client_id, collection_address, collection_date)`. Upserts sempre respeitam essa unicidade.
- “Placas pulando” entre linhas do histórico: confirmar vínculo por `vehicles.collection_id` e enriquecimento por `(addressId|date)`; a aprovação (APPROVED) grava `collection_id` fixo em `collection_history`.
- Datas com D-1: conferir componentes de data (UI) — `DatePickerBR` usa ISO seguro; para testes/scripts, gerar `YYYY-MM-DD` local.

