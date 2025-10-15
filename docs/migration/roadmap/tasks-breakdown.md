# Tarefas por Área (Backend, Frontend, DB, DevOps)

Status: proposta (alvo de implementação)

## Backend

- Implementar DDDL e repositórios para `partner_checklists/*`.
- Endpoints: load/save/submit/load-anomalies/save-anomalies, upload, part-requests, categories,
  view.
- Normalização de contexto `(context_type, context_id)`; validações de `partner_id` e RBAC.
- Camada de compatibilidade para mecânica (read-fallback, shadow-write opcional).

## Frontend

- Partner checklist page: integração completa com novos endpoints; part-requests por item; estados.
- Viewer e PartnerEvidencesSection: uso de `/api/checklist/categories` e `/api/checklist/view` com
  filtros corretos.
- Filtrar `media_url` vazio; thumbnails; lightbox estável.

## Banco de Dados

- Migrações, índices e seeds de templates.
- View `vw_partner_checklist_summary` para contagens e auditoria rápida.
- Tabela de mapeamento de `item_key` legado → novo (se necessário).

## DevOps/Observabilidade

- Feature flags; dashboards; alertas.
- Storage de mídia: buckets, policies, lifecycle e antivirus (opcional).
- Pipelines de CI para testes de contrato e migrações.
