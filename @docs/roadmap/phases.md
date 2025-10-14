# Fases do Roadmap — Segmentação por Parceiro e Listagem

Status: proposta (alvo de implementação)

Referência: `docs/DEVELOPMENT_INSTRUCTIONS.md` (padrões de desenvolvimento, PRs, testes) e
documentos em `@docs/*`.

## Fase 0 — Preparação e Diagnóstico

- Objetivo: confirmar estado atual e dependências.
- Entregáveis:
  - Checklist de leitura dos docs `@docs/as-is/*` e alinhamento com times.
  - Validação das páginas-alvo: `app/dashboard/partner/checklist/page.tsx` e
    `PartnerEvidencesSection.tsx`.
- Critérios de aceite:
  - Escopo fechado, owners definidos, e riscos catalogados.

## Fase 1 — Base de Dados e Templates

- Objetivo: habilitar modelo unificado sem impacto de execução.
- Entregáveis:
  - DDLs de `partner_checklists`, `partner_checklist_items/evidences`, `partner_part_requests` e
    templates.
  - Seeds para `mechanic@v1` e `generic@v1`.
- Critérios de aceite:
  - Migrações aplicáveis em staging sem downtime.
  - Índices e chaves únicas validados.

## Fase 2 — Endpoints Núcleo (Novo Modelo)

- Objetivo: disponibilizar APIs alinhadas ao isolamento por parceiro.
- Entregáveis:
  - `/api/partner/checklist/load|save|submit|load-anomalies|save-anomalies` (escopo por partner,
    contexto normalizado).
  - `/api/partner/evidences/upload` com URL assinada.
  - `/api/partner/part-requests` CRUD por item.
- Critérios de aceite:
  - Contratos batendo com `@docs/api-spec.md`.
  - Testes de contrato e integração em staging.

## Fase 3 — Visualização (Somente Leitura)

- Objetivo: listar e exibir evidências por `categoria • parceiro`.
- Entregáveis:
  - `/api/checklist/categories` consolidando por `(vehicle_id, context)`.
  - `/api/checklist/view` retornando checklist/itens/evidências/peças.
  - `PartnerEvidencesSection.tsx` abrindo o viewer correto.
- Critérios de aceite:
  - Listagem apresenta todas as combinações existentes, incluindo casos só-quote.
  - Viewer sem `img src` vazio; performance aceitável P95.

## Fase 4 — UI/UX de Edição do Parceiro

- Objetivo: fluxo robusto de edição/submissão isolado por parceiro.
- Entregáveis:
  - `PartnerChecklistGroups.tsx` com modal de peças por item e estados de item.
  - `usePartnerChecklist` com salvamento em lote, retry de upload.
- Critérios de aceite:
  - Recarregar mantém rascunho do próprio parceiro.
  - Submissão bloqueia edição do parceiro e gera auditoria.

## Fase 5 — Mecânica Legada (Compatibilidade)

- Objetivo: evitar regressão enquanto migra.
- Entregáveis:
  - Camada de compatibilidade para mecânica (leitura e, opcionalmente, shadow-write).
  - Mapeamento de `item_key` legado → template mecânico.
- Critérios de aceite:
  - Nenhum vazamento entre parceiros em mecânica.
  - Métricas de divergência sob controle (<2%).

## Fase 6 — Rollout e Cutover

- Objetivo: ativar novo modelo em produção com segurança.
- Entregáveis:
  - Feature flags, plano de rollback, dashboards de métricas.
  - Cutover por cliente/categoria.
- Critérios de aceite:
  - Zero incidentes críticos; SLO cumprido.

## Fase 7 — Limpeza e Otimizações

- Objetivo: consolidar e reduzir débitos.
- Entregáveis:
  - Remoção de código legado e ETLs temporárias.
  - Otimizações de consultas e cache.
- Critérios de aceite:
  - Sem referências a estruturas antigas; latência P95 dentro do alvo.
