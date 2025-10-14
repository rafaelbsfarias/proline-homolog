# Fluxos e Diagramas — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

## Fluxo: Parceiro carrega checklist

```mermaid
sequenceDiagram
  autonumber
  participant U as Partner UI
  participant API as Backend API
  participant DB as Database
  U->>API: POST /api/partner/checklist/load { vehicle_id, context, category }
  API->>DB: upsert/select partner_checklists by (partner_id, vehicle_id, context, category)
  DB-->>API: checklist + items + evidences + part_requests
  API-->>U: 200 { checklist, items, evidences, part_requests, template }
```

## Fluxo: Salvar rascunho (itens, evidências, solicitações)

```mermaid
sequenceDiagram
  autonumber
  participant U as Partner UI
  participant API as Backend API
  participant DB as Database
  U->>API: POST /api/partner/checklist/save { checklist_id, items, evidences, part_requests }
  API->>DB: validate ownership (partner_id)
  API->>DB: upsert items (by checklist_id, item_key)
  API->>DB: upsert evidences (by id) and validate media_url
  API->>DB: upsert part_requests (by id)
  DB-->>API: ok
  API-->>U: 200 { saved: true }
```

## Fluxo: Submeter checklist

```mermaid
sequenceDiagram
  autonumber
  participant U as Partner UI
  participant API as Backend API
  participant DB as Database
  U->>API: PUT /api/partner/checklist/submit { checklist_id }
  API->>DB: validate ownership, status = draft
  API->>DB: set status=submitted, submitted_at, submitted_by
  DB-->>API: ok
  API-->>U: 200 { submitted: true }
```

## Fluxo: Upload de evidência (assinado)

```mermaid
sequenceDiagram
  autonumber
  participant U as Partner UI
  participant API as Backend API
  participant ST as Storage
  U->>API: POST /api/partner/evidences/upload { content_type, file_name }
  API-->>U: 200 { upload_url, media_url }
  U->>ST: PUT upload_url (conteúdo)
  U->>API: POST /api/partner/checklist/save (salva media_url)
```

## Fluxo: Visualização (PartnerEvidencesSection ➜ Viewer)

```mermaid
sequenceDiagram
  autonumber
  participant U as Vehicle UI
  participant API as Backend API
  participant DB as Database
  U->>API: GET /api/checklist/categories { vehicle_id, context }
  API->>DB: list partner_checklists grouped by (partner_id, category)
  API-->>U: 200 { categories: [...] }
  U->>API: GET /api/checklist/view { vehicle_id, context, partner_id, category }
  API->>DB: select checklist + items + evidences + part_requests
  API-->>U: 200 { checklist, items, evidences, part_requests }
```

## Fluxo: Solicitação de Peças por item

```mermaid
sequenceDiagram
  autonumber
  participant U as Partner UI
  participant API as Backend API
  participant DB as Database
  U->>API: POST /api/partner/part-requests { checklist_id, item_key, ... }
  API->>DB: insert part_request
  API-->>U: 201 { id }
  U->>API: PUT /api/partner/part-requests/:id { status, ... }
  API->>DB: update part_request
  API-->>U: 200 { updated: true }
```
