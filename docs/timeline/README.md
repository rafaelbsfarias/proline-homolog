# Timeline Unificada

Documentação da timeline unificada dos veículos.

- Componente: `modules/vehicles/components/BudgetPhaseSection.tsx`
- Hook: `modules/vehicles/hooks/useVehicleTimeline.ts`
- API: `GET /api/vehicle-timeline?vehicleId=...`
- Serviço: `modules/vehicles/timeline/VehicleTimelineService.ts`

Fluxo geral:
1. Front chama `/api/vehicle-timeline` com Bearer token (respeita RLS).
2. API usa `VehicleTimelineService` para buscar e normalizar eventos (atualmente: BUDGET_STARTED e BUDGET_APPROVED).
3. UI renderiza eventos conforme o layout do BudgetPhaseSection.
