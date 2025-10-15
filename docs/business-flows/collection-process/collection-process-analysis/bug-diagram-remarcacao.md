# Diagrama — Por que as placas “mudam de linha” após remarcação

Este diagrama mostra o fluxo entre três endpoints e como alterações em `vehicles` impactam a coluna “Veículos” exibida no Histórico do Admin. A pergunta central: em que momento o histórico de coleta é “alterado”, modificando a coluna de placas associadas a um endereço que sofreu remarcação?

Importante: a tabela `collection_history` é imutável — o que muda é o enriquecimento (cálculo) em tempo de leitura, que antes dependia de `(addressId + date)` e agora prioriza `collection_id`.

## Visão geral dos atores e tabelas

- Endpoints:
  - Client Reschedule: `POST /api/client/collection-reschedule`
  - Admin Propose: `POST /api/(admin)/(collections)/admin/propose-collection-date`
  - Client Accept: `POST /api/client/collection-accept-proposal`
- Tabelas:
  - `vehicles` (pickup_address_id, estimated_arrival_date, status, collection_id)
  - `vehicle_collections` (client_id, collection_address, collection_date, status=requested|approved)
  - `collection_history` (imutável — inserido quando `vehicle_collections.status` muda para `approved`)
- Enriquecimento no Admin:
  - Serviço: `modules/admin/services/client-collections/history/enrich.ts`
  - Antes: agrupava por `(addressId|date)` → placas “pulavam” quando veículos mudavam de data.
  - Agora: prioriza `collection_id`; fallback por `(addressId|date)` somente quando `collection_id` indisponível.

## Sequência — remarcações sucessivas e impacto

```
Cliente                            Admin/API                         Banco de Dados
───────────────────────────────── ────────────────────────────────── ───────────────────────────────────────────
1) Define D1 (collect_point)
   → set-vehicles-collection
                                  vehicles.status = PONTO_DE_COLETA_SELECIONADO
                                  vehicles.pickup_address_id = A
                                  vehicles.estimated_arrival_date = D1
                                  (vehicle_collections ainda não aprovado)

2) Admin propõe D2
   → propose-collection-date       Seleciona fee (aprovado>0, senão >0)
                                  Upsert vehicle_collections (C2: A, D2, requested)
                                  Atualiza vehicles.estimated_arrival_date = D2
                                  Link vehicles.collection_id = C2

3) Cliente contrapropõe D3
   → collection-reschedule         Atualiza vehicles.estimated_arrival_date = D3
                                  vehicles.status = APROVAÇÃO NOVA DATA
                                  Upsert vehicle_collections (C3: A, D3, requested)
                                  Link vehicles.collection_id = C3

4) Cliente aceita (etapa 1)
   → collection-accept-proposal    Se status = SOLICITAÇÃO_MUDANÇA_DE_DATA → AGUARDANDO_APROVAÇÃO
                                  (sem histórico ainda)

5) Cliente aceita (etapa 2)
   → collection-accept-proposal    Se status = AGUARDANDO_APROVAÇÃO → AGUARDANDO_COLETA
                                  Vincula vehicles.collection_id ao (A,D?) vigente
                                  Aprova vehicle_collections (status = approved)
                                  TRIGGER insere em collection_history (Hn) para collection_id aprovado
```

## Onde a coluna “Veículos” muda na UI

- A tabela `collection_history` (linha Hn) não muda após inserida. Porém, a UI do Admin enriquece cada linha consultando o estado atual dos veículos.
- Antes da correção, o enriquecimento agrupava por `(addressId|date)`. Assim, quando os veículos tinham `estimated_arrival_date` atualizado (em 2 ou 3), a próxima leitura do histórico usava os novos `(addressId|date)` e a lista de placas aparentava “mudar de linha”.
- Após a correção, o enriquecimento usa `collection_id` sempre que possível. Como `collection_history.collection_id` é fixo, a lista de placas permanece estável para aquela linha, mesmo que outros veículos do mesmo endereço mudem de data no futuro.

## Resposta direta à pergunta central

- “Em que momento o histórico de coleta é alterado modificando toda a coluna Veículos?”
- Não há alteração na tabela `collection_history` em si. A mudança percebida ocorre quando endpoints (2) Propose e (3) Reschedule atualizam `vehicles.estimated_arrival_date` e/ou `vehicles.collection_id`. Em leituras seguintes, o enriquecimento do histórico (se baseado em `(addressId|date)`) recalcula as placas de cada linha conforme o estado atual dos veículos, dando a impressão de que a coluna “Veículos” foi alterada. Com o enriquecimento por `collection_id`, essa oscilação cessa.

## Pontos de atenção que podem disparar o efeito

- Atualizar `estimated_arrival_date` antes de aprovar (e sem vínculo por `collection_id` estável) faz as placas “seguirem” a última data quando o enrichment é por address+date.
- Diferenças no label do endereço (`collection_address`) dificultam encontrar a coleção correta para vincular/aprovar.
- Aprovar uma coleção sem ter vinculado corretamente `vehicles.collection_id` ao par (endereço, data) que está sendo aprovado.

## Verificação/Diagnóstico

- Checar em `vehicles`:
  - Se `collection_id` aponta para a coleção correta da linha de histórico.
  - Se `estimated_arrival_date` corresponde à data da linha (quando aplicável).
- Logs relevantes:
  - Propose: `propose_date_fee_selection`, `vehicle_date_sync_success`, `link_vehicles_to_collection_success`.
  - Reschedule: `reschedule_fee_selection`, `collection_upsert_success`, `link_vehicles_success`.
  - Accept: `link_vehicles_on_approve_failed`, `approve-collection-by-date-failed`.
