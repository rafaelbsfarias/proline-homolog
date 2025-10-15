# Especificação de APIs — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

Este documento define contratos de API para suportar o fluxo completo: criação/edição/submissão de
checklists por parceiro com isolamento, anexos de evidências, solicitações de peças por item, e
visualização somente leitura para administradores/clientes/especialistas via `PartnerEvidencesSection.tsx`.

## Convenções Gerais

- Autenticação: Bearer JWT. `sub` identifica o usuário; `partner_id` presente no token para perfis
  de parceiro.
- RBAC: ver `@docs/security-permissions.md` para papéis e escopos.
- Contexto: `(vehicle_id, context_type, context_id)` onde `context_type ∈ {quote, inspection}`.
- Categoria: `category` em snake-case: `mechanic`, `body`, `paint`, `electrical`, etc.
- Idempotência: endpoints de gravação devem aceitar `Idempotency-Key` (header) opcional.
- Respostas: JSON; erros no formato `{ error: { code, message, details? } }`.
- Paginação: `?page` e `?page_size` quando aplicável.

## Parceiro — Checklist

POST `/api/partner/checklist/load`

- Descrição: Carrega (ou cria rascunho) o checklist do parceiro para
  `(vehicle_id, contexto, categoria)`.
- Auth: `role=partner` com `partner_id` obrigatório.
- Body:

```json
{
  "vehicle_id": "uuid",
  "context_type": "quote",
  "context_id": "uuid",
  "category": "mechanic"
}
```

- 200 OK:

```json
{
  "checklist": {
    "id": "uuid",
    "partner_id": "uuid",
    "vehicle_id": "uuid",
    "context_type": "quote",
    "context_id": "uuid",
    "category": "mechanic",
    "status": "draft",
    "template_version": "v1"
  },
  "items": [
    { "item_key": "engine.oil.level", "status": "OK", "comment": "", "severity": null },
    { "item_key": "engine.noise", "status": "NOK", "comment": "ruído frio", "severity": "medium" }
  ],
  "evidences": [
    { "id": "uuid", "item_key": "engine.noise", "media_url": "https://...", "media_type": "video" }
  ],
  "part_requests": [
    { "id": "uuid", "item_key": "engine.noise", "status": "draft", "title": "Correia" }
  ],
  "template": {
    "category": "mechanic",
    "version": "v1",
    "items": [{ "item_key": "engine.oil.level", "label": "Nível do óleo" }]
  }
}
```

- 403: parceiro sem acesso ao veículo/contexto.

POST `/api/partner/checklist/save`

- Descrição: Salva rascunho de itens/evidências/solicitações do checklist do parceiro.
- Auth: `role=partner`.
- Body:

```json
{
  "checklist_id": "uuid",
  "items": [
    {
      "item_key": "...",
      "status": "OK|NOK|NA",
      "comment": "...",
      "severity": "low|medium|high|null"
    }
  ],
  "evidences": [
    { "id": "uuid|null", "item_key": "...", "media_url": "https://...", "media_type": "image" }
  ],
  "part_requests": [
    {
      "id": "uuid|null",
      "item_key": "...",
      "status": "draft|sent|approved|rejected|cancelled",
      "title": "...",
      "description": "...",
      "quantity": 1,
      "unit": "pc",
      "estimated_cost": 123.45
    }
  ]
}
```

- 200 OK: `{ "saved": true, "updated_at": "ts" }`
- 409: checklist já `submitted`.

PUT `/api/partner/checklist/submit`

- Descrição: Submete o checklist (trava edição do parceiro).
- Auth: `role=partner`.
- Body: `{ "checklist_id": "uuid" }`
- 200 OK: `{ "submitted": true, "submitted_at": "ts" }`
- 409: já submetido.

GET `/api/partner/checklist/load-anomalies`

- Descrição: Lista anomalias do parceiro derivadas de itens NOK.
- Auth: `role=partner`.
- Query: `vehicle_id, context_type, context_id, category`
- 200 OK:

```json
{
  "anomalies": [
    { "item_key": "engine.noise", "severity": "medium", "comment": "...", "detected_at": "ts" }
  ]
}
```

POST `/api/partner/checklist/save-anomalies`

- Descrição: Salva anomalias do parceiro (sobrescreve/merge por checklist).
- Auth: `role=partner`.
- Body:
  `{ "checklist_id": "uuid", "anomalies": [ { "item_key": "...", "severity": "...", "comment": "..." } ] }`
- 200 OK: `{ "saved": true }`

## Parceiro — Evidências

POST `/api/partner/evidences/upload`

- Descrição: Solicita URL assinada para upload e retorna URL pública/assinada para `media_url`.
- Auth: `role=partner`.
- Body: `{ "content_type": "image/jpeg", "file_name": "...jpg" }`
- 200 OK: `{ "upload_url": "https://...", "media_url": "https://..." }`

DELETE `/api/partner/evidences/:id`

- Descrição: Remove evidência do checklist do parceiro.
- Auth: `role=partner`.
- 200 OK: `{ "deleted": true }`

## Parceiro — Solicitações de Peças (per-item)

POST `/api/partner/part-requests`

- Body:
  `{ "checklist_id": "uuid", "item_key": "...", "title": "...", "description": "...", "quantity": 1, "unit": "pc" }`
- 201 Created: `{ "id": "uuid" }`

PUT `/api/partner/part-requests/:id`

- Body:
  `{ "status": "sent|approved|rejected|cancelled", "title": "...", "description": "...", "quantity": 2, "estimated_cost": 10.5 }`
- 200 OK: `{ "updated": true }`

DELETE `/api/partner/part-requests/:id`

- 200 OK

## Visualização (Somente leitura)

GET `/api/checklist/categories`

- Descrição: Lista de combinações `categoria • parceiro` disponíveis para `(vehicle_id, contexto)`.
- Auth: `role in {admin, customer, specialist}` ou `partner` vendo o próprio.
- Query: `vehicle_id, context_type, context_id`
- 200 OK:

```json
{
  "categories": [
    {
      "partner_id": "uuid",
      "partner_name": "Oficina X",
      "category": "mechanic",
      "label": "Mecânica • Oficina X",
      "counts": { "items_nok": 3, "evidences": 5 }
    }
  ]
}
```

GET `/api/checklist/view`

- Descrição: Retorna checklist e evidências para visualização somente leitura.
- Auth: `role in {admin, customer, specialist}` ou `partner` (=próprio).
- Query: `vehicle_id, context_type, context_id, category, partner_id`
- 200 OK:

```json
{
  "checklist": { "id": "uuid", "status": "submitted|draft" },
  "items": [{ "item_key": "...", "status": "NOK", "comment": "..." }],
  "evidences": [{ "item_key": "...", "media_url": "https://..." }],
  "part_requests": [{ "item_key": "...", "status": "sent", "title": "..." }]
}
```

- 404: inexistente para os parâmetros.

## Templates

GET `/api/checklist/templates`

- Descrição: Lista templates ativos por categoria.
- 200 OK:
  `{ "templates": [ { "category": "mechanic", "version": "v1", "items": [ { "item_key": "...", "label": "..." } ] } ] }`

## Códigos de Erro

- 400: parâmetros inválidos (`invalid_parameters`).
- 401: não autenticado (`unauthorized`).
- 403: acesso negado (`forbidden`).
- 404: recurso não encontrado (`not_found`).
- 409: conflito de estado (`conflict`).
- 429: limite excedido (`rate_limited`).
- 500: erro interno (`internal_error`).

## Notas de Implementação

- Toda consulta deve aplicar filtro por
  `(partner_id, vehicle_id, context_type, context_id, category)` quando o papel for `partner`.
- Em visualização, permitir múltiplos parceiros; o chamador escolhe `partner_id` + `category`.
- Evidências com `media_url` vazio devem ser ignoradas no frontend; backend deve validar não-vazio.
- Part-requests por item surgem no mesmo payload para simplificar atomicidade em `/save`.