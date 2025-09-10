# Serviços e UI — Onde o Fluxo é Orquestrado e Exibido

Este documento lista os serviços e componentes que constroem a visão para Admin/Cliente e aplicam as regras de negócio no front e no backend.

## Admin — Resumos e Grupos
- Arquivo: `modules/admin/services/clientCollectionsSummary.ts`
  - Agrega dados por cliente: grupos de precificação, pendências de aprovação, aprovados e solicitações de remarcação, além de histórico imutável.
  - Consome:
    - `buildPricingRequests` (pricing.ts)
    - `buildPendingApprovalGroups` (pendingApproval.ts)
    - `buildRescheduleGroups` (reschedule.ts)
    - `CollectionHistoryService.getClientHistory` + `enrichHistoryWithVehicleStatus`

- Pricing (endereços com “PONTO DE COLETA SELECIONADO”)
  - Arquivo: `modules/admin/services/client-collections/groups/pricing.ts`
  - Lê `vehicles` e infere `addressId` → `collection_address` (label).
  - Seleção de fee:
    - Considera `vehicle_collections` com `status in ['requested','approved']`.
    - Ordena por `updated_at/created_at desc` e prioriza último fee > 0.
    - Exposição de `proposed_date` é suprimida se já existir `collection_date` do cliente para o pedido atual.
****
- Pendências de aprovação (Cliente precisa aceitar)
  - Arquivo: `modules/admin/services/client-collections/groups/pendingApproval.ts`
  - Busca veículos em `AGUARDANDO APROVAÇÃO DA COLETA` ou `SOLICITAÇÃO DE MUDANÇA DE DATA`.
  - Forma grupos por `(addressId, estimated_arrival_date)`.
  - Aplica a estratégia de fee: `approved > 0` → fallback `> 0` → data específica → sem fee.

- Remarcações solicitadas pelo cliente
  - Arquivo: `modules/admin/services/client-collections/groups/reschedule.ts`
  - Foca em `APROVAÇÃO NOVA DATA` e agrega por endereço+data.
  - Seleção de fee idem: `approved > 0` com fallback para último `> 0`.

- Histórico e enriquecimento
  - Serviço: `modules/common/services/CollectionHistoryService.ts`
    - Lê `collection_history` (imutável) e visão detalhada, se necessário.
  - Enriquecimento: `modules/admin/services/client-collections/history/enrich.ts`
    - Prioriza agrupar por `collection_id` indiretamente via mapeamento `collection_address → addressId` e data.
    - Monta lista estável de placas por `(addressId | date)` e calcula o “status dominante” para exibição.

## Admin — Componentes
- `modules/admin/components/overview/CollectionPricingSection.tsx` (não inspecionado aqui linha a linha)
  - Diretrizes do produto:
    - Priorizar exibição da data fornecida pelo cliente.
    - Usar o fee mais recente aprovado (> 0), senão o último `> 0`.
    - Remover seção de “Coletas aprovadas” e usar somente a tabela de histórico (imutável), exibindo “COLETA APROVADA”.

## Cliente — Componentes/Modais (contexto do set-vehicles-collection)
- Modal de linha (editar ponto de coleta): `modules/client/components/modals/RowCollectionModal.tsx`
  - Seleciona método (`collect_point` vs `bring_to_yard`), endereço e data.
  - Aciona POST `/api/client/set-vehicles-collection` com `estimated_arrival_date` e `addressId`.
  - Campo de data usa `DatePickerBR`, que mantém `valueIso` (YYYY-MM-DD) e entrada text BR, evitando TZ-skew.

- Controles em lote: `modules/client/components/BulkCollectionControls/BulkCollectionControls.tsx`
  - Para definir ponto de coleta em lote; expõe `select#collect-point-address` e botão para abrir modal relacionado.

## Observações de UI e Formatação de Data
- Evitar D-1: data é sempre manipulada como ISO local de forma segura (em componentes do app).
- “Sempre manter a data do cliente”: quando o Admin propõe, ele deve respeitar a data do cliente quando aplicável; na prática, os serviços tratam `collection_date` por chave composta para não sobrescrever linhas antigas.

