# QA, Testes e Validações por Fase

Status: proposta (alvo de implementação)

## Fase 1 — DB e Templates

- Validação de migrações em ambiente de staging.
- Seeds dos templates conferidos (itens, item_key únicos, ordering).

## Fase 2 — Endpoints Núcleo

- Testes de contrato (OpenAPI/Insomnia) para load/save/submit/anomalias/upload.
- Testes de autorização (RBAC, partner_id isolado) e casos de erro (409 submitted).

## Fase 3 — Visualização

- Testes de listagem de categorias em cenários: só-quote, só-inspection, multi-parceiro.
- Viewer sem `img src` vazio; tempos P95 aceitáveis; paginação de evidências quando necessário.

## Fase 4 — UI/UX Parceiro

- Fluxo completo (edição ➜ salvar ➜ submeter) com evidências e part-requests por item.
- Persistência após reload; salvamentos de terceiros não afetam visão atual.

## Fase 5 — Mecânica Legada

- Comparação novo vs legado por veículo/contexto (diferença de contagens < 2%).
- Sem vazamento entre parceiros.

## Rollout

- Healthchecks e métricas em dashboards; alertas; dry-run de rollback.
- Testes de fumaça pós-cutover por cliente/categoria.
