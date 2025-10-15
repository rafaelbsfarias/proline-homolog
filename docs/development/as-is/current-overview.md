# Visão Geral Atual (Arquitetura, Páginas e Rotas)

Resumo do estado atual com base no código e integrações utilizadas.

## Páginas e Componentes Relevantes

- `app/dashboard/partner/checklist/page.tsx`
  - Página de checklist do parceiro (edição de rascunho/submissão).
  - Reaproveita modal de Solicitação de Peças do dynamic-checklist.
- `modules/partner/components/checklist/PartnerChecklistGroups.tsx`
  - Renderização de grupos/itens do checklist; ações por item (evidências, peças).
- `modules/vehicles/components/sections/PartnerEvidencesSection.tsx`
  - Exibe botões por `categoria • parceiro` para visualização (somente leitura).
- `modules/vehicles/components/modals/ChecklistViewer.tsx`
  - Viewer de itens/evidências consolidado; ignora `img src` vazio.
- `modules/vehicles/components/modals/MechanicsChecklistView.tsx`
  - Viewer focado na mecânica; filtra mídias inválidas; lightbox.

## Rotas/Endpoints Atuais Observados

- Parceiro (edição)
  - `POST /api/partner/checklist/load` — carrega checklist do parceiro; aceita `inspection_id` e/ou
    `quote_id`.
  - `GET /api/partner/checklist/load-anomalies` — anomalias escopadas por parceiro; aceita
    `vehicle_id`, `inspection_id` e `quote_id`.
  - `POST /api/partner/checklist/save-anomalies` — sobrescreve anomalias do parceiro.
  - `PUT /api/partner/checklist/submit` — submissão (com ressalvas em tabelas legadas de mecânica).
- Visualização (somente leitura)
  - `GET /api/checklist/categories` — agrega categorias por parceiro a partir de
    quotes/service_orders/service_categories (sem depender de `inspection_id`).
  - `GET /api/checklist/view` — retorna checklist/itens/evidências para leitura, filtrando por
    `partner_id` e `category`.
- Mecânica (legado)
  - Rotas de submissão e leitura específicas para mecânica ainda existem; parte do escopo aponta
    `mechanics_checklist*`.

## Observações de Comportamento

- Botões na `PartnerEvidencesSection` agora aparecem por parceiro+categoria; ao clicar abre o
  conjunto correto.
- O carregamento do checklist por parceiro busca sempre o contexto do próprio parceiro (isola
  rascunho).
- Evidências sem `media_url` são filtradas no viewer para evitar `img src` vazio.
- As anomalias são retornadas com escopo por parceiro.

## Limitações Atuais

- Tabelas legadas de mecânica (`mechanics_checklist_items`/`evidences`) não têm `partner_id`:
  - Tentativa de segmentar por parceiro causa erros caso o código tente inserir/filtrar por
    `partner_id` nessas tabelas.
- Parte da lógica de evidências depende de `item_key` para associação quando `checklist_item_id` não
  existe.
- Há coexistência de contexto por `quote_id` e/ou `inspection_id` sem normalização unificada.
