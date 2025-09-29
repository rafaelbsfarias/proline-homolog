# Fluxo de Checklist do Parceiro

Esta página documenta como salvamos e carregamos o checklist técnico do veículo
exibido em `app/dashboard/partner/checklist/page.tsx`.

- Identificação: a página aceita `inspectionId` (preferencial), `vehicleId` ou `quoteId`
  via querystring. O hook resolve o veículo/inspeção em `/api/partner/get-vehicle-from-inspection`.
- Carregamento: `POST /api/partner/checklist/load` lê as tabelas:
  - `mechanics_checklist` (observações gerais, `fluidsNotes`),
  - `mechanics_checklist_items` (status/notas por item),
  - `mechanics_checklist_evidences` (caminho de storage por item) e gera URLs públicas.
  Modelo binário de status:
  - Front: apenas `ok` (OK) e `nok` (NOK). Internamente, na UI atual, `nok` aparece como `attention`.
  - Banco: também somente `ok` e `nok` (sem `good/poor/critical`).
  - Mapeamentos: Banco→Front: `ok`→`ok`; `nok`→`attention` (NOK).
- Edição: `PartnerChecklistGroups` controla os itens e notas; o hook gerencia o estado
  e evidências (`setEvidence/removeEvidence`). `InspectionData` apenas exibe metadados.
- Salvamento: `PUT /api/partner/checklist/submit`:
  - Faz upload das evidências no bucket `vehicle-media` e envia `storage_path` por item.
  - Upsert em `mechanics_checklist`, `mechanics_checklist_items` e `mechanics_checklist_evidences`.
  - Status é mapeado Front→Banco: `ok`→`ok`; `nok`/`attention`/outros não-`ok`→`nok`.
  - Agregação: campos agregados (ex.: `motor_condition`) são `ok` se todos os itens do grupo forem `ok`; caso contrário, `nok`.
- Round-trip: Ao recarregar a página, os dados salvos são reidratados no formulário,
  incluindo as evidências com URLs públicas.

## Nomenclatura e organização

Para manter o contexto correto no escopo do parceiro, usamos wrappers em `partner/`:

- Hook: `modules/partner/hooks/usePartnerChecklist` reexporta a implementação atual
  (antiga `useSpecialistChecklist`).
- UI: `modules/partner/components/checklist/PartnerChecklistGroups` reexporta
  o componente de grupos de inspeção. Quando houver tempo, migrar a implementação
  física para `partner/` ou `common/` caso haja reaproveitamento entre domínios.

Isso reduz acoplamento sem uma refatoração grande imediata e mantém a página do
parceiro semanticamente coerente.
