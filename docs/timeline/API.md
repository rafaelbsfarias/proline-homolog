# API: Vehicle Timeline

Endpoint: `GET /api/vehicle-timeline?vehicleId=<uuid>`

- Auth: Bearer token (qualquer role válida: client, specialist, partner, admin)
- RLS: consultas executadas com o token do usuário
- Resposta:
```
{ success: true, events: Array<{ id, vehicleId, type, title, date, meta? }>} 
```

Implementação:
- Handler: `app/api/vehicle-timeline/route.ts`
- Service: `modules/vehicles/timeline/VehicleTimelineService.ts` (`getBudgetStartedEvents`, `getBudgetApprovedEvents`)

Eventos retornados atualmente:
- `BUDGET_STARTED`: registros em `vehicle_history.status` iniciando por "Fase Orçamentária Iniciada"
- `BUDGET_APPROVED`: registros em `vehicle_history.status` iniciando por "Orçamento Aprovado"

Próximas extensões:
- Adicionar eventos de análise iniciada/finalizada, outras aprovações etc.
