# Scripts de Desenvolvimento - Proline Homolog

## 📋 Visão Geral

Este diretório contém scripts organizados para desenvolvimento, teste e manutenção do sistema
Proline. Os scripts estão organizados em pastas temáticas para facilitar a navegação e manutenção.

## 📁 Estrutura de Organização

```
scripts/
├── api_tests/       # Testes específicos de API
├── data/            # Scripts de população e geração de dados
├── db_scripts/      # Scripts de banco de dados (não modificados)
├── maintenance/     # Scripts de diagnóstico e manutenção
├── migrations/      # Scripts de migração de banco
├── tests/           # Scripts de teste e validação
└── utils/           # Scripts utilitários diversos
```

## 📜 Scripts Disponíveis

Abaixo está a lista de scripts disponíveis em cada diretório.

### `api_tests/`

- temp_test_pending_collections.js
- temp_test_run.js
- test-api-authentication.js
- test-api-direct.cjs
- test-api-http.cjs
- test-api-logic.cjs
- test-auth-login.js
- test-auth-middleware.cjs
- test_pending_collections_api.js
- test_set_address_collection_fees.js
- test-single-api.cjs
- test_vehicles_count_api.js

### `data/`

- add-missing-categories.js
- create-simple-quote.js
- create-test-data.js
- create-test-data.sh
- create-test-inspection.js
- generate-report.sh
- populate-partner-categories.js
- populate-partner-categories.sh
- populate-partner-services.js
- populate-partner-services-simple.js
- populate-partner-services-test.js
- populate-services-table.cjs
- README.md
- verify-partner-services.js

### `maintenance/`

- analyze-services-table.cjs
- check-auth.cjs
- check-budget-tables.cjs
- check-contract-status.cjs
- check-database-state.js
- check-database-state-pg.js
- check-environment-connection.js
- check-partner-data.cjs
- check-partner-ids.js
- check-partner-services.js
- check-partner-services-rls.js
- check-quotes-data.cjs
- check-quote-status.cjs
- check-rls-policies.js
- check-services.cjs
- check-services-table.js
- check-services-tables.cjs
- check-system-status.sh
- check-vehicle-columns.cjs
- check-vehicle-plates.cjs
- check-vehicle-structure.cjs
- cleanup-orphaned-collections.js
- complete-solution.cjs
- database-report.js
- debug-api-problem.cjs
- debug-auth.js
- debug-budget.js
- debug-partner-dashboard.cjs
- debug-propose-api.ts
- debug-quote-data.cjs
- debug-specific-quote.js
- debug-tables.js
- debug-vehicle-data.cjs
- detailed-analysis.cjs
- diagnose-budget-counter.sh
- dry-run-orphan-requested.mjs
- explore-services.js
- find-empty-files.js
- find-quotes-with-vehicles.js
- fix-partner-quote.cjs
- fix-partner-setup.cjs
- fix-routes-manifest.js
- implement-solution.cjs
- investigate-dates.js
- investigate-inconsistencies.js
- investigate-interface-discrepancy.js
- investigate-partner-services-inconsistency.js
- investigate-services-tables.js
- README.md
- repair.sh
- switch-env.sh
- verify-user-credentials.cjs

### `migrations/`

- add_new_checklist_categories.sql
- migrate-collection-history.ts
- README.md

### `tests/`

- check-services-after-population.js
- debug-client-flow.sh
- full-partner-services-diagnostic.sh
- quick-check-partner-services.sh
- README.md
- simulate-finalize.js
- test-address.js
- test-all.sh
- test-budget-flow.sh
- test-budget-save-flow.cjs
- test-checklist-error.js
- test-client-flow.sh
- test-collection-flow.js
- test-collection-history-integrity.js
- test-confirm-email.sh
- test-create-admin.js
- test-endpoints.sh
- test-finalize-api.js
- test-finalized-inspections.sh
- test-flow-validation.sh
- test-guide.sh
- test-magic-link.js
- test-partner-access.js
- test-partner-api-v2.sh
- test-partner-categories.sh
- test-quote-structure.js
- test-reset-password.sh
- test-service-status.cjs
- test-signup.sh
- test-status-fix.cjs
- test_vehicle_count_fix.js
- test_vehicle_count_fix.sql
- validate-flow.sh

### `utils/`

- README.md
- rewire-imports.ts
- simulate-finalize.js
- validate-flow.sh
