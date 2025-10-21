# 09) Reaproveitamento de Componentes (Fluxo de Coleta → Entrega do Veículo)

Este documento mapeia os componentes e serviços já existentes no fluxo de coleta que podem ser reaproveitados (com pequenas adaptações) para a feature de “Solicitar entrega do Veículo” quando o veículo estiver com status “Finalizado”.

## Ajuste no Card do Veículo Finalizado
- Substituir o botão “Adicionar ponto de coleta” por “Solicitar entrega do Veículo” apenas quando `vehicle.status === 'Finalizado'`.
- A ação abre um fluxo muito similar ao da coleta: seleção de endereço + data desejada.

## Componentes/Serviços Existentes para Reuso

1) Seletor de endereço e data (Cliente)
- Referências úteis:
  - `modules/client/components/Collection/CollectPointSelect.tsx` (quando aplicável)
  - `modules/client/components/Collection/PendingDefinitionSection.tsx` — padrões de validação para endereço e data; UI para input de data (`type="date"`), toasts, e submissão.
  - `modules/client/components/Modals/RowCollectionModal/RowCollectionModal.tsx` — modal com título “Adicionar ponto de coleta” (pode ser reaproveitado como base de modal para “Solicitar entrega do Veículo”).
- Adaptações:
  - Renomear labels/títulos para o contexto de “Entrega do veículo”.
  - Desabilitar opções não aplicáveis (ex.: “Levar ao pátio”), mantendo apenas seleção de endereço e data.

2) Backend e fluxo de aprovação (Admin)
- Referências úteis:
  - `modules/admin/components/CollectionRequestsModal.tsx` — visão geral de solicitações, agrupamento por endereço, aprovações e definição de valores (padrão de UI e fluxo de aprovação que pode ser espelhado para entregas).
  - Endpoints relacionados a coleta em `app/api/(client)/(collections)` e `app/api/(admin)/(collections)` (para modelar novos endpoints análogos de entrega: cliente solicita → admin aprova/sugere nova data → cliente confirma, se necessário).
- Adaptações:
  - Criar endpoints paralelos (em futura implementação) para “entrega” com a mesma semântica de proposta/aceite/rejeição usada em coleta.
  - Reutilizar padrões de payload (data desejada, addressId, notes) e respostas (success/error), mantendo consistência.

3) Histórico e serviços comuns
- Referência: `modules/common/services/CollectionHistoryService.ts`
  - Embora seja “collection history” (coleta), serve de referência de como consolidar histórico; para “entrega” poderemos ter um serviço irmão (DeliveryHistoryService) ou agrupar ambos em uma camada “vehicle_release_history”, conforme proposta no planejamento.
- Adaptações:
  - Manter o mesmo padrão de logging via `getLogger` e acesso através do `SupabaseService`.

## Padrões de UX a Preservar
- Validação de obrigatórios (endereço e data) com feedback claro (toasts) — ver PendingDefinitionSection.
- Modal para ação pontual (solicitação por veículo) — ver RowCollectionModal.
- Fluxo de aprovação/admin com visão de grupos por endereço — ver CollectionRequestsModal.

## Observações
- O reuso visa acelerar a entrega e padronizar experiência. Entretanto, textos e rótulos devem ser revisados para o domínio de “entrega do veículo”.
- Evitar dependências diretas de enums/constantes específicas de coleta; criar novas constantes para “entrega” se necessário (na fase de implementação).

