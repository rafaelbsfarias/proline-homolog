# Entidades e Tabelas Envolvidas

Este documento resume as tabelas e campos relevantes para o fluxo de coleta e mudanças sucessivas de data.

## vehicles
- Finalidade: Entidade operacional de veículos do cliente.
- Campos relevantes:
  - `id`: PK.
  - `client_id`: referência ao dono (perfil/usuário).
  - `status`: estado do veículo no fluxo de coleta (ver constantes).
  - `pickup_address_id`: endereço de coleta escolhido pelo cliente.
  - `estimated_arrival_date` (YYYY-MM-DD): data preferencial (cliente) ou proposta vigente.
  - `collection_id`: vínculo com `vehicle_collections` para estabilizar agrupamento e histórico.
- Transições comuns de `status`:
  - `PONTO DE COLETA SELECIONADO` → cliente definiu endereço e data.
  - `SOLICITAÇÃO DE MUDANÇA DE DATA` → admin propôs nova data ao cliente.
  - `APROVAÇÃO NOVA DATA` → cliente sugeriu nova data ao admin.
  - `AGUARDANDO APROVAÇÃO DA COLETA` → aguardando aceitação final do cliente para data proposta.
  - `AGUARDANDO COLETA` → data/fee aprovados, pronto para execução.

## addresses
- Finalidade: Endereços de cliente (pontos de coleta potenciais).
- Campos relevantes: `id`, `profile_id`, `street`, `number`, `city`, `is_collect_point`.
- “Label” do endereço: combinação legível `street[, number] - city`, usada como `collection_address` em `vehicle_collections`.

## vehicle_collections
- Finalidade: Registro agregador (cliente + endereço + data) com taxa e status do agrupamento.
- Chave de unicidade (regra funcional): `(client_id, collection_address, collection_date)` — evita duplicidade para a mesma combinação.
- Campos relevantes:
  - `id`: PK (usado para estabilizar vínculos com veículos e histórico).
  - `client_id`.
  - `collection_address`: label do endereço (não o `addressId`).
  - `collection_date` (YYYY-MM-DD): data de coleta aprovada/solicitada.
  - `collection_fee_per_vehicle` (number | null): taxa por veículo.
  - `status`: `'requested' | 'approved'` (nível da coleção, não confundir com status de `vehicles`).
  - `updated_at` / `created_at`.
- Seleção de fee adotada na aplicação:
  - Prioridade: último `approved` com fee > 0.
  - Fallback: último registro com fee > 0 (mesmo que `requested`).
  - Caso contrário: fee ausente/null até que o Admin precifique.

## collection_history (imutável)
- Finalidade: Histórico imutável de coleções aprovadas.
- Inserção: disparada quando `vehicle_collections.status` muda para `approved` (trigger no DB).
- Campos relevantes (amostra):
  - `collection_id`, `client_id`, `collection_address`, `collection_date`, `collection_fee_per_vehicle`, `vehicle_count`, `total_amount`, `finalized_at`.
- Diretrizes de UI:
  - Exibir status como “COLETA APROVADA”, ocultando estados/andamentos de pagamento.
  - Enriquecimento opcional com placas/contagens pela visão atual dos veículos (sem alterar o registro imutável).

## Constantes de status (app)
- Arquivo: `modules/common/constants/status.ts`.
- Valores principais:
  - `PONTO_DE_COLETA_SELECIONADO`, `SOLICITACAO_MUDANCA_DATA`, `APROVACAO_NOVA_DATA`, `AGUARDANDO_APROVACAO`, `AGUARDANDO_COLETA` (veículos);
  - `requested`, `approved` (coleções em `vehicle_collections`).

