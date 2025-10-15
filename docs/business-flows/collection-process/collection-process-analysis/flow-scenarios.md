# Cenários de Mudança Sucessiva de Data — Passo a Passo

Este documento descreve cenários comuns e suas transições, destacando como o sistema mantém consistência entre `vehicles`, `vehicle_collections` e `collection_history`.

## 1) Cliente define ponto de coleta e data (inicial)
- POST `/api/client/set-vehicles-collection` (method: `collect_point`)
- Efeitos:
  - `vehicles.pickup_address_id = addressId`
  - `vehicles.estimated_arrival_date = D1`
  - `vehicles.status = 'PONTO DE COLETA SELECIONADO'`
- Observação: ainda não há coleção aprovada, e `vehicle_collections` pode não ter registro (depende do fluxo de pricing/admin).

## 2) Admin propõe nova data D2 para o mesmo endereço
- POST `/api/(admin)/(collections)/admin/propose-collection-date` com `new_date = D2`
- Efeitos:
  - Seleciona `collection_fee_per_vehicle` por estratégia: `approved>0` → fallback último `>0`.
  - Upsert em `vehicle_collections` por `(client_id, collection_address, collection_date=D2)` com `status='requested'` e fee escolhido.
  - Vincula veículos ao `collection_id` quando possível.
  - Sincroniza `vehicles.estimated_arrival_date = D2` para o endereço alvo.
  - Transição de status: `vehicles.status = 'SOLICITAÇÃO DE MUDANÇA DE DATA'` (contexto admin → cliente precisa reagir).

## 3) Cliente contrapropõe nova data D3 (remarcação consecutiva)
- POST `/api/client/collection-reschedule` com `new_date = D3`
- Efeitos:
  - `vehicles.estimated_arrival_date = D3` e `vehicles.status = 'APROVAÇÃO NOVA DATA'` (cliente sugere).
  - Procura `vehicle_collections` para o mesmo `collection_address` (label):
    - Se existir com fee válido: atualiza `collection_date = D3`, mantém `status='requested'`, vincula veículos, limpa duplicados sem fee.
    - Se não existir: cria nova `vehicle_collections` com `status='requested'` (fee pendente), vincula veículos.

## 4) Cliente aceita proposta (duas etapas)
- POST `/api/client/collection-accept-proposal`:
  - Caso A: veículos em `SOLICITAÇÃO DE MUDANÇA DE DATA` → volta para `AGUARDANDO APROVAÇÃO DA COLETA` (confirmação intermediária, sem aprovar histórico ainda).
  - Caso B: veículos em `AGUARDANDO APROVAÇÃO DA COLETA` → `AGUARDANDO COLETA`.
    - Encontra a coleção exata por `(client, collection_address, collection_date)` com `status='requested'`.
    - Vincula veículos (`vehicles.collection_id = collId`).
    - Atualiza `vehicle_collections.status = 'approved'`.
    - Trigger insere linha em `collection_history` para `collId` (imutável).

## 5) Múltiplas mudanças sucessivas (D2 → D3 → D4 ...)
- Invariantes:
  - Cada nova data gera ou atualiza um registro em `vehicle_collections` para aquele `(client, addressLabel, date)` — não sobrescreve datas antigas (chave composta).
  - O fee selecionado é sempre o último confiável: `approved>0`, senão `>0` (mesmo `requested`). Fee não “reseta” quando cliente contrapropõe.
  - O vínculo por `collection_id` estabiliza a lista de placas por coleção (evita “line hopping” no histórico exibido).

## 6) Histórico e exibição
- `collection_history` captura somente aprovações (status `approved`), mantendo registros imutáveis por `collection_id`.
- O Admin vê “COLETA APROVADA” e a UI enriquece com a lista de placas atual, mas o registro original não muda.

## Pontos sensíveis e diagnósticos
- Endereço → label: divergir `addressId`/`collection_address` causa falha de vinculação ou múltiplas linhas para o “mesmo” endereço.
- Datas (formato): usar `YYYY-MM-DD` estável e consistente entre APIs; evitar fuso (TZ) — os componentes usam conversões seguras.
- Seleção de fee: verificar logs quando fee não aparece; fontes (approved>0) e fallback (último >0) são registradas no log.
- Estados intermediários: aceitar em sequência correta (duas etapas) para garantir que `collection_history` seja inserido no momento apropriado.

