# Serviço: VehicleTimelineService

Arquivo: `modules/vehicles/timeline/VehicleTimelineService.ts`

Hoje implementa:
- `getBudgetStartedEvents(supabase, vehicleId, logger?)`: busca entradas no `vehicle_history` com `status` iniciando por `Fase Orçamentária Iniciada` e mapeia para `TimelineEvent`.
- `getBudgetApprovedEvents(supabase, vehicleId, logger?)`: busca entradas no `vehicle_history` com `status` iniciando por `Orçamento Aprovado` e mapeia para `TimelineEvent`.

Tipos:
- `modules/vehicles/timeline/types.ts` define `TimelineEvent` e `TimelineEventType`.

Roadmap:
- Adicionar mapeadores para análise iniciada/finalizada e outras aprovações, mantendo normalização no servidor.
