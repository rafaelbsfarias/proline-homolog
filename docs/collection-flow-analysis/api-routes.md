# API Routes Envolvidas no Fluxo

Este documento detalha os endpoints e os efeitos no banco e no estado dos veículos/coleções.

## POST /api/client/set-vehicles-collection
- Arquivo: `app/api/client/set-vehicles-collection/route.ts`
- Autenticação: Client (Bearer token)
- Body:
  - `method`: `'collect_point' | 'bring_to_yard'`
  - `addressId?`: obrigatório quando `collect_point`
  - `estimated_arrival_date?` (YYYY-MM-DD): obrigatório em ambos os métodos
  - `vehicleIds?`: opcional; se ausente, aplica a todos os veículos do cliente
- Regras:
  - Valida ownership do endereço quando `collect_point`.
  - Só permite transições a partir de: `AGUARDANDO DEFINIÇÃO DE COLETA`, `PONTO DE COLETA SELECIONADO`, `AGUARDANDO COLETA`, `AGUARDANDO CHEGADA DO VEÍCULO`.
- Efeitos:
  - `collect_point`: `vehicles.status = 'PONTO DE COLETA SELECIONADO'`, define `pickup_address_id` e `estimated_arrival_date`.
  - `bring_to_yard`: `vehicles.status = 'AGUARDANDO CHEGADA DO VEÍCULO'`, zera `pickup_address_id`, define `estimated_arrival_date`.

## POST /api/(admin)/(collections)/admin/propose-collection-date
- Arquivo: `app/api/(admin)/(collections)/admin/propose-collection-date/route.ts`
- Autenticação: Admin
- Body:
  - `clientId` (obrigatório)
  - `addressId` (obrigatório)
  - `new_date` (YYYY-MM-DD, obrigatório)
- Passos principais:
  1) Resolve `collection_address` a partir de `addresses` (label legível).
  2) Seleciona a taxa (fee) com a estratégia:
     - último `approved` com fee > 0; fallback: último com fee > 0 entre `requested|approved`.
  3) Upsert em `vehicle_collections` por `(client_id, collection_address, collection_date)` com `status = requested` e fee escolhido.
  4) Vincula veículos à `collection_id` quando possível e sincroniza `estimated_arrival_date = new_date`.
  5) Atualiza `vehicles.status` para `SOLICITAÇÃO DE MUDANÇA DE DATA` (ou mantém contexto se já em aprovação do cliente).
- Efeitos típicos:
  - Persiste sempre a data do cliente/proposta no registro da coleção; evita sobrescrever coleções antigas (chave composta).

## POST /api/client/collection-reschedule
- Arquivo: `app/api/client/collection-reschedule/route.ts`
- Autenticação: Client
- Body:
  - `addressId` (obrigatório)
  - `new_date` (YYYY-MM-DD, obrigatório)
- Passos principais:
  1) Atualiza veículos no endereço para `estimated_arrival_date = new_date` e `status = 'APROVAÇÃO NOVA DATA'` (a partir de `AGUARDANDO_APROVACAO | SOLICITACAO_MUDANCA_DATA`).
  2) Busca coleção existente por `client + collection_address` priorizando registros com fee válido (`> 0`) e status (`requested|approved`).
  3) Se existir: atualiza `collection_date = new_date`, mantém fee e `status = requested`, vincula veículos (`collection_id`). Limpa coleções duplicadas sem fee.
  4) Se não existir: cria nova em `vehicle_collections` (sem fee) com `status = requested` e vincula veículos.

## POST /api/client/collection-accept-proposal
- Arquivo: `app/api/client/collection-accept-proposal/route.ts`
- Autenticação: Client
- Body:
  - `addressId` (obrigatório)
- Comportamento contextual em 2 etapas:
  - Se veículos em `SOLICITAÇÃO DE MUDANÇA DE DATA`: aceitar → `AGUARDANDO APROVAÇÃO DA COLETA`.
  - Se veículos em `AGUARDANDO APROVAÇÃO DA COLETA`: aceitar → `AGUARDANDO COLETA`; encontra a `vehicle_collections` por `(client, collection_address, collection_date)` com `status=requested`, vincula veículos e muda `vehicle_collections.status = approved` (gera histórico).
- Efeitos no histórico:
  - Ao aprovar a coleção (status `approved`), dispara trigger de inserção em `collection_history` para o `collection_id` exato.

