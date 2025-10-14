# Migração: Timeline Legada → Unificada

Status: concluído (fase 1)

Mudanças principais:
- Removido `modules/vehicles/components/TimelineSection.tsx` (legado).
- Substituído por `BudgetPhaseSection.tsx` no `VehicleDetails.tsx`.
- Criado endpoint unificado `GET /api/vehicle-timeline` e hook `useVehicleTimeline`.

Próximas fases:
- Expandir `VehicleTimelineService` e a API para demais eventos.
- Remover hooks/APIs legadas de `vehicle-history` por role.

