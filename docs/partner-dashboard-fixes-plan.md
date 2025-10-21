# Partner Dashboard Fixes — Execution Plan (Staged)

Owner: Web team
Status: Proposed (awaiting approval)
Scope: UI/UX fixes in PartnerDashboard and execution evidence flow. No DB migrations.

## Goals
- Remove the duplicate "Finalizados" counter in `PartnerDashboard` with a clear problem statement and rationale.
- Trigger "Salvar Progresso" when clicking "Marcar como Concluído" on the execution evidence page.
- Keep the vehicle timeline clean: avoid new "Em Execução" after finalization (guards already in place).
- Avoid breaking Delegation/Queue system; do not ship DB migrations in this batch.

## Stage 1 — Fix duplicate "Finalizados" in PartnerDashboard
Files: `app/dashboard/PartnerDashboard.tsx`, optionally `modules/partner/hooks/usePartnerDashboard.ts`

Problem
There are currently two tiles labeled "Finalizados" in the Budgets section:

1) Finalizados (approved + rejected) — This tile sums outcomes of the budget phase: `approved + rejected`. It was a requested KPI placed next to "Rejeitados" and represents “budgets finished” from the partner’s budgeting perspective.

2) Finalizados (execution finalized) — A second tile was introduced earlier that reads `budgetCounters.finalized` and was positioned between "Pendente" and "Em Análise". Conceptually, it attempts to reflect quotes whose execution was finalized.

Issues
- Semantics clash: "Finalizados" as a budget KPI (approved+rejected) vs. as an execution KPI (post-approval). Mixing both under the "Orçamentos" header confuses operators.
- Visual noise: Two tiles named identically with different meanings produce ambiguity and increase support burden.
- Data source fragility: The second tile depends on DB-level support (RPC and enum), which was rolled back to protect Delegation. Leaving a dead/zero counter worsens UX.

Decision
- Keep only the budget-phase "Finalizados" (approved + rejected), next to "Rejeitados" — this aligns with the previously requested KPI and requires no DB changes.
- Remove the execution-level "Finalizados" tile (`budgetCounters.finalized`). If/when an execution KPI is needed, we’ll add it under an Execution section with a distinct label (e.g., "Execuções Finalizadas") to prevent ambiguity.

Solution
1) Remove the extra tile bound to `budgetCounters.finalized` (currently rendered between "Pendente" and "Em Análise").
   - File: `app/dashboard/PartnerDashboard.tsx`
   - Action: Delete the JSX block that renders `{budgetCounters.finalized}` with label "Finalizados" in that early position.
   - Keep the tile that computes `(approved + rejected)` at the end of the grid, next to "Rejeitados".

2) Optional type cleanup (non-blocking):
   - File: `modules/partner/hooks/usePartnerDashboard.ts`
   - Remove `finalized` from `BudgetCounters` type to avoid dangling properties and prevent future regressions. This is optional and can be done in a subsequent pass to minimize risk.

3) Future evolution (not in this change):
   - If business needs a metric for finished executions, introduce a separate section (e.g., "Execução") and label it distinctly ("Execuções Finalizadas") fed from a stable backend field. This avoids tile name conflicts and clarifies semantics.

Acceptance Criteria
- The Budgets grid shows a single tile labeled "Finalizados", placed next to "Rejeitados".
- No references to `budgetCounters.finalized` remain in the component tree.
- No console errors or TypeScript errors are introduced by the removal.

Backout Plan
- Revert the commit that removes the JSX tile. No DB changes are involved.

## Stage 2 — Save Progress on "Marcar como Concluído"
- File: `app/dashboard/partner/execution-evidence/page.tsx`
- Current: Clicking "Marcar como Concluído" invokes `completeService(serviceId, serviceName)` and then `reloadData()`.
- Change: Invoke `saveProgress(services)` before or immediately after the completion call to ensure evidences and descriptions are persisted even if the user forgets to press the global "Salvar".
- UX considerations:
  - Single toast on success; if both operations succeed, show one success message.
  - If `saveProgress` fails, display error and do not mark as completed; if completion fails, report error and keep the service state unchanged.

Acceptance Criteria
- When clicking "Marcar como Concluído" for a service with new evidences/descriptions, the data remains persisted after a reload and the service shows as completed.
- A single success toast is shown for the combined action (save + complete), or a clear error toast if any step fails.

## Stage 3 — Timeline Guards (Verification)
- Files: `app/api/partner/execution-evidences/route.ts`, `modules/vehicles/timeline/VehicleTimelineService.ts`
- Confirm existing guards prevent `vehicles.status` from being set to "Em Execução" after a finalization, and that the UI filters out any "EXECUTION_STARTED" entries that appear after the last completion event. No new code here unless QA finds issues.

Acceptance Criteria
- After execution finalization, interacting with the evidence page does not create new "Em Execução" entries for the vehicle.
- Timeline does not display post-finalization "EXECUTION_STARTED" events (guarded/filtered).

## Out of Scope / Deferred
- Any DB migration (e.g., reintroducing a `finalized` quote status) to avoid impacting Delegation. If needed later, ship in a dedicated, coordinated change set.

## Testing Plan
- UI manual tests with partner user:
  - Verify the "Orçamentos" grid order and presence of a single "Finalizados" tile (no early duplicate).
  - Start a service, add evidence, click "Marcar como Concluído": evidence remains after reload and the service shows as completed; timeline shows "Execução de {serviço} Finalizada".
  - After finishing all services, verify no additional "Em Execução" appears if the page is interacted with post-finalization.

## Rollout & Risk
- Low risk: CSS/JSX-only change for the duplicate tile and a small handler change for save progress. No DB changes.
- Rollback: revert edited files.
