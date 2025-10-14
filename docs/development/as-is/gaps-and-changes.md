# Gaps vs Ideal e Mudanças Necessárias

Este documento mapeia diferenças entre o estado atual e a especificação ideal, com mudanças
propostas sem perda de funcionalidades.

## 1) Isolamento por Parceiro

- Gap: Tabelas de mecânica (itens/evidências) sem `partner_id`.
- Impacto: Dificulta edição simultânea por múltiplos parceiros no mesmo veículo/contexto para
  mecânica.
- Mudanças propostas:
  - Opção A (preferível): migrar para modelo unificado `partner_checklists` +
    `partner_checklist_items/evidences` (vide `@docs/data-model.md`).
  - Opção B (temporária): manter mecânica em tabelas legadas, segmentando por
    `(vehicle_id, context)` e associando evidências via `item_key`; reforçar dono no cabeçalho.

## 2) Contexto Quote/Inspection

- Gap: Regras ad-hoc para `quote_id` vs `inspection_id`.
- Mudanças propostas: normalizar como `(context_type, context_id)` em todos endpoints e chaves
  únicas.

## 3) Evidências com `media_url` vazio

- Estado: Frontend já filtra; backend pode aceitar valores vazios.
- Mudanças: validar no backend e rejeitar `media_url` vazio; manter filtro no frontend por robustez.

## 4) Solicitação de Peças (per-item)

- Estado: Modal reutilizado e integrado por item.
- Gap: Consolidar ciclo completo CRUD e estados no backend com histórico.
- Mudanças: implementar tabela `partner_part_requests` e endpoints (`create/update/delete`).

## 5) Visualização Somente Leitura

- Estado: `PartnerEvidencesSection` exibe botões por `categoria • parceiro` e viewer funciona.
- Gap: Contagens padronizadas (itens NOK, evidências) e ordering consistente.
- Mudanças: adicionar view `vw_partner_checklist_summary` e enriquecer `/api/checklist/categories`.

## 6) Templates e Versionamento

- Gap: Falta formalização de templates por categoria e versionamento atrelado ao checklist.
- Mudanças: criar `checklist_templates` e `checklist_template_items` e referenciá-los em
  `partner_checklists.template_version`.

## 7) Auditoria e RBAC

- Gap: Auditoria parcial e validações inconsistentes entre endpoints.
- Mudanças: padronizar middleware de autorização e registrar `created_by/updated_by/submitted_by`,
  `request_id`.

## 8) Desempenho e Observabilidade

- Gap: ausência de métricas consolidadas e índices padronizados.
- Mudanças: adicionar índices sugeridos, logs estruturados e métricas P95.

## 9) Compatibilidade Legada (mecânica)

- Gap: tentativa de uso de `partner_id` em tabelas que não o possuem.
- Mudanças: escolher estratégia:
  - Migrar dados para o novo modelo (A) com shadow-write + cutover.
  - Ou manter leitura/escrita via camada de compatibilidade (B) até migração final.
