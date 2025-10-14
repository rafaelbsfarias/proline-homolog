# Segurança e Permissões — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

## Papéis (Roles)

- `partner`: colaboradores de parceiros; atuam somente nos seus dados.
- `admin`: equipe interna com acesso total (leitura/escrita, inclusive reabrir checklist).
- `customer`: cliente final, leitura somente.
- `specialist`: analista/consultor, leitura somente.

## Matriz de Acesso

- Parceiros
  - Criar/editar/submeter seu checklist: permitido.
  - Ver checklists de outros parceiros: negado.
  - Ver sua própria visualização de leitura: permitido.
- Admin
  - Ver todos os checklists: permitido.
  - Editar e reabrir checklist submetido: permitido (com auditoria).
- Customer/Specialist
  - Ver (somente leitura) todos os checklists: permitido.

## Isolamento por Escopo

- Toda consulta/gravação em endpoints de parceiro aplica filtro por:
  `(partner_id, vehicle_id, context_type, context_id, category)`.
- `partner_id` deve ser obtido do token; se enviado no payload, deve ser ignorado/substituído pelo
  do token.

## Autorização e Validações

- Verificar se o parceiro tem vínculo com o `vehicle_id` e com o `context` antes de criar/carregar.
- Em submissão, verificar propriedade do checklist.
- Em visualização pública, validar que o `partner_id` consultado existe para os parâmetros.

## Auditoria

- Registrar `created_by/updated_by`, `submitted_by`, timestamps e IP/agent.
- Logar eventos-chave (save, submit, reopen) em trilhas de auditoria.

## Proteção de Mídia

- Upload via URLs assinadas com tempo limitado; armazenar apenas `media_url` público/assinado.
- Opcional: varredura antivírus/heurística em backend/bucket.
- Controle de tamanho e tipos permitidos.

## Rate Limiting e Anti-abuso

- Limitar `/save` por checklist e IP (ex.: 30 req/min).
- Limitar `/upload` por usuário (ex.: 60 req/min) e tamanho por arquivo.

## Erros e Mensagens

- Evitar detalhamento excessivo em mensagens de erro de autorização.
- Retornar `403` sem indicar existência do recurso quando o acesso é negado.

## Considerações de Multi-tenancy

- Se houver multi-organização, incluir `org_id` no filtro e token.
- Segregar buckets de mídia por organização/parceiro quando apropriado.
