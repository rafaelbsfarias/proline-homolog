# Checklist Audits

Ferramentas para auditar o estado atual do banco relacionadas a vistorias/checklist, relações entre
tabelas e integridade das evidências (imagens).

## Objetivos

- Mapear relações entre `mechanics_checklist`, `mechanics_checklist_items`,
  `mechanics_checklist_evidences`, `quotes`, `partners` e `vehicles`.
- Identificar inconsistências comuns: registros órfãos, chaves ausentes (quote_id/partner_id),
  duplicidades por `item_key`, e uso misto de `inspection_id` vs `quote_id`.
- Validar a integridade das referências de evidências: cada imagem salva no Storage deve ter no
  máximo uma referência no banco que a aponte (sem cópias de arquivo no banco).
- Detectar caminhos de storage fora do padrão (ex: pastas antigas `itens/`, prefixos temporários
  como `tmp/` ou `pre/`).

## Pré‑requisitos

- Acesso ao banco via `psql` (local supabase:
  `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).
- Tabelas: `mechanics_checklist`, `mechanics_checklist_items`, `mechanics_checklist_evidences`,
  `quotes`, `vehicles`, `partners`, `storage.objects`.

## Uso Rápido

- Rodar auditorias individualmente:
  - `psql "$DB_URL" -f scripts/checklist/audit-checklist-relations.sql`
  - `psql "$DB_URL" -f scripts/checklist/audit-evidence-integrity.sql`
- Orquestrar tudo (inclui alguns scripts existentes):
  - `bash scripts/run_checklist_audit.sh`

## Interpretação

- Registros listados em seções de "órfãos" ou com contagens > 1 indicam potenciais problemas de
  modelagem ou gravação.
- Itens com `quote_id` nulo e apenas `inspection_id` devem ser revisados (padronizar contexto por
  `quote_id` quando aplicável).
- Evidências sem correspondência no `storage.objects` apontam para caminhos inválidos ou deleções no
  Storage sem limpeza no banco.

## Relacionados (já existentes)

- `scripts/verify_schema.sql` — verifica colunas/índices/RLS em items/evidence.
- `scripts/test-evidence-loading.sql` — valida estrutura de caminhos (evidences/ vs itens/).
- `scripts/debug-evidence-refs.sh` — confere Storage vs referências no banco para um `quote_id`.
- `scripts/verify-part-requests.sql` — inspeciona `part_request` nos itens do checklist.
