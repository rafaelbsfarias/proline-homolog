# Componente: BudgetPhaseSection

Arquivo: `modules/vehicles/components/BudgetPhaseSection.tsx`

Responsabilidade: renderizar eventos cronológicos principais, incluindo “Fase Orçamentária Iniciada - {Categoria}” e “Orçamento Aprovado”.

Props necessárias:
- `vehicleId: string`
- `createdAt: string`
- `estimatedArrivalDate?: string | null`
- `inspectionDate?: string | null`
- `inspectionFinalized?: boolean`

Uso típico:
```tsx
<BudgetPhaseSection
  vehicleId={vehicle.id}
  createdAt={vehicle.created_at}
  estimatedArrivalDate={vehicle.estimated_arrival_date}
  inspectionDate={inspection?.inspection_date}
  inspectionFinalized={inspection?.finalized}
/>
```

Eventos renderizados hoje:
- Veículo Cadastrado
- Previsão de Chegada (quando existir)
- Análise Iniciada (quando existir)
- Análise Finalizada (quando existir)
- Fase Orçamentária Iniciada (quando existir)
- Orçamento Aprovado (quando existir)

Fonte de dados: hook `useVehicleTimeline(vehicleId)` → `/api/vehicle-timeline`.
